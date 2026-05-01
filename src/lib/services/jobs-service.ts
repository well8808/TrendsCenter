import type { JobStatus } from "@prisma/client";

import { dispatchDueJobs } from "@/lib/jobs/dispatcher";
import { listRecentJobRuns } from "@/lib/repositories/job-run-repository";
import { processAuthOutbox } from "@/lib/services/outbox-service";
import { processDueProviderReelsImports } from "@/lib/services/reels-provider-import-service";
import type { ApiTenantContext } from "@/lib/services/auth-context-service";

function parseStatuses(value: string | null) {
  if (!value) {
    return undefined;
  }

  const allowed: JobStatus[] = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "DEAD_LETTERED", "CANCELED"];
  const parsed = value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is JobStatus => allowed.includes(item as JobStatus));

  return parsed.length > 0 ? parsed : undefined;
}

export async function listWorkspaceJobRuns(context: ApiTenantContext, searchParams: URLSearchParams) {
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20"), 1), 100);
  const statuses = parseStatuses(searchParams.get("status"));
  const queue = searchParams.get("queue")?.trim() || undefined;
  const jobs = await listRecentJobRuns(context.workspaceId, { limit, statuses, queue });

  return {
    items: jobs.map((job) => ({
      id: job.id,
      queue: job.queue,
      handler: job.handler,
      name: job.name,
      status: job.status,
      stage: job.stage,
      requestId: job.requestId,
      importBatchId: job.importBatchId,
      dedupeKey: job.dedupeKey,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      createdBy: job.createdBy,
      availableAt: (job.availableAt ?? job.createdAt).toISOString(),
      startedAt: job.startedAt?.toISOString(),
      finishedAt: job.finishedAt?.toISOString(),
      lastError: job.lastError ?? job.error ?? undefined,
      deadLetteredAt: job.deadLetteredAt?.toISOString(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    })),
  };
}

export async function dispatchOperationalCron(options: { requestId: string; limit?: number; outboxLimit?: number }) {
  const jobs = await dispatchDueJobs({
    requestId: options.requestId,
    limit: options.limit,
  });
  const providerReels = await processDueProviderReelsImports({
    limit: options.limit,
  });
  const outbox = await processAuthOutbox({
    requestId: options.requestId,
    limit: options.outboxLimit,
  });

  return {
    jobs,
    providerReels,
    outbox,
  };
}
