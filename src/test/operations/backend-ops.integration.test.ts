import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it, vi } from "vitest";

import { getPrisma } from "@/lib/db";
import { claimDueJobs, enqueueJob } from "@/lib/repositories/job-run-repository";
import { claimDueOutboxItems } from "@/lib/repositories/outbox-repository";
import { processAuthOutbox } from "@/lib/services/outbox-service";

const cleanupWorkspaceIds = new Set<string>();

async function createWorkspace(label: string) {
  const workspace = await getPrisma().workspace.create({
    data: {
      slug: `ops-${label}-${randomUUID().slice(0, 8)}`,
      name: `Ops ${label}`,
    },
  });

  cleanupWorkspaceIds.add(workspace.id);

  return workspace;
}

afterAll(async () => {
  if (cleanupWorkspaceIds.size === 0) {
    return;
  }

  await getPrisma().workspace.deleteMany({
    where: {
      id: { in: Array.from(cleanupWorkspaceIds) },
    },
  });
});

describe("backend operational integrations", () => {
  it("prevents double-claiming the same queued job lease", async () => {
    const workspace = await createWorkspace("lease");
    const job = await enqueueJob({
      workspaceId: workspace.id,
      queue: "integration",
      handler: "ingestion.request.process",
      name: "claim-check",
      createdBy: "integration-test",
      dedupeKey: `claim:${workspace.id}`,
      payload: {
        requestId: "missing",
        requestType: "OFFICIAL_SNAPSHOT",
      },
    });

    const firstClaim = await claimDueJobs(1, `claim-a-${job.id}`, new Date(Date.now() + 60_000));
    const secondClaim = await claimDueJobs(1, `claim-b-${job.id}`, new Date(Date.now() + 60_000));

    expect(firstClaim).toHaveLength(1);
    expect(firstClaim[0].id).toBe(job.id);
    expect(secondClaim).toHaveLength(0);
  });

  it("keeps outbox processing retry-safe with lease and backoff when provider fails", async () => {
    const workspace = await createWorkspace("outbox");
    const outbox = await getPrisma().authEmailOutbox.create({
      data: {
        kind: "PASSWORD_RESET",
        toEmail: "ops-outbox@example.com",
        subject: "Reset",
        body: "Reset your password",
        workspaceId: workspace.id,
        dedupeKey: `ops-outbox:${workspace.id}`,
        nextAttemptAt: new Date(Date.now() - 1000),
        maxAttempts: 3,
        createdAt: new Date("2000-01-01T00:00:00.000Z"),
      },
    });

    const originalApiKey = process.env.RESEND_API_KEY;
    const originalEmailFrom = process.env.AUTH_EMAIL_FROM;
    const originalFetch = global.fetch;

    process.env.RESEND_API_KEY = "re_test_failure";
    process.env.AUTH_EMAIL_FROM = "Ops <alerts@example.com>";
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ message: "provider unavailable" }),
    } as Response);

    try {
      const summary = await processAuthOutbox({
        requestId: "ops-outbox-001",
        limit: 1,
      });

      expect(summary.claimed).toBe(1);
      expect(summary.failed).toBe(1);

      const updated = await getPrisma().authEmailOutbox.findUniqueOrThrow({
        where: { id: outbox.id },
      });
      expect(updated.status).toBe("FAILED");
      expect(updated.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
      expect(updated.claimToken).toBeNull();
      expect(updated.leaseExpiresAt).toBeNull();
      expect(updated.lastError).toMatch(/falha ao entregar/i);

      const claimedAgain = await claimDueOutboxItems(5, "second-pass", new Date(Date.now() + 60_000));
      expect(claimedAgain.some((item) => item.id === outbox.id)).toBe(false);
    } finally {
      process.env.RESEND_API_KEY = originalApiKey;
      process.env.AUTH_EMAIL_FROM = originalEmailFrom;
      global.fetch = originalFetch;
    }
  });
});
