import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  jobRun: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  authEmailOutbox: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  getPrisma: () => db,
}));

import { claimDueJobs } from "./job-run-repository";
import { claimDueOutboxItems } from "./outbox-repository";

describe("lease recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows an expired RUNNING job lease to be claimed again", async () => {
    const staleJob = {
      id: "job-stale",
      status: "RUNNING",
      availableAt: new Date("2026-01-01T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      leaseExpiresAt: new Date("2026-01-01T00:01:00.000Z"),
    };

    db.jobRun.findMany.mockResolvedValue([staleJob]);
    db.jobRun.updateMany.mockResolvedValue({ count: 1 });
    db.jobRun.findUnique.mockResolvedValue({ ...staleJob, attemptCount: 2 });

    const claimed = await claimDueJobs(1, "claim-token", new Date(Date.now() + 60_000));

    expect(claimed).toHaveLength(1);
    expect(db.jobRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              status: "RUNNING",
              leaseExpiresAt: expect.objectContaining({ lt: expect.any(Date) }),
            }),
          ]),
        }),
      }),
    );
    expect(db.jobRun.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: staleJob.id,
          OR: expect.arrayContaining([
            expect.objectContaining({
              status: "RUNNING",
              leaseExpiresAt: expect.objectContaining({ lt: expect.any(Date) }),
            }),
          ]),
        }),
        data: expect.objectContaining({
          status: "RUNNING",
          claimToken: "claim-token",
          attemptCount: { increment: 1 },
        }),
      }),
    );
  });

  it("allows an expired PROCESSING outbox lease to be claimed again", async () => {
    const staleItem = {
      id: "outbox-stale",
      kind: "EMAIL_VERIFICATION",
      toEmail: "hidden@example.com",
      subject: "Verify",
      body: "Verify",
      actionUrl: null,
      workspaceId: "workspace-id",
      userId: "user-id",
      dedupeKey: "dedupe",
      attemptCount: 1,
      maxAttempts: 5,
      status: "PROCESSING",
      nextAttemptAt: new Date("2026-01-01T00:00:00.000Z"),
      leaseExpiresAt: new Date("2026-01-01T00:01:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    db.authEmailOutbox.findMany.mockResolvedValue([staleItem]);
    db.authEmailOutbox.updateMany.mockResolvedValue({ count: 1 });

    const claimed = await claimDueOutboxItems(1, "outbox-claim", new Date(Date.now() + 60_000));

    expect(claimed).toEqual([
      expect.objectContaining({
        id: staleItem.id,
        attemptCount: 2,
      }),
    ]);
    expect(db.authEmailOutbox.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              status: "PROCESSING",
              leaseExpiresAt: expect.objectContaining({ lt: expect.any(Date) }),
            }),
          ]),
        }),
      }),
    );
    expect(db.authEmailOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: staleItem.id,
          OR: expect.arrayContaining([
            expect.objectContaining({
              status: "PROCESSING",
              leaseExpiresAt: expect.objectContaining({ lt: expect.any(Date) }),
            }),
          ]),
        }),
        data: expect.objectContaining({
          status: "PROCESSING",
          claimToken: "outbox-claim",
          attemptCount: { increment: 1 },
        }),
      }),
    );
  });
});
