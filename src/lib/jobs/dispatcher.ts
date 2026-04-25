import { randomUUID } from "node:crypto";

import { calculateExponentialBackoff } from "@/lib/jobs/backoff";
import { runJobHandler } from "@/lib/jobs/handlers";
import { createLogger } from "@/lib/http/logger";
import { incrementMetric } from "@/lib/observability/metrics";
import { markIngestRequestFailed } from "@/lib/repositories/ingestion-request-repository";
import {
  claimDueJobs,
  markJobRunDeadLettered,
  markJobRunRetryableFailure,
  markJobRunSucceeded,
} from "@/lib/repositories/job-run-repository";

export async function dispatchDueJobs(options: { limit?: number; requestId: string }) {
  const limit = options.limit ?? 10;
  const claimToken = randomUUID();
  const leaseExpiresAt = new Date(Date.now() + 2 * 60_000);
  const logger = createLogger({
    scope: "jobs.dispatcher",
    requestId: options.requestId,
  });
  const claimed = await claimDueJobs(limit, claimToken, leaseExpiresAt);
  incrementMetric("jobs.claimed_total", claimed.length, {
    queue: "all",
  });
  const summary = {
    claimed: claimed.length,
    succeeded: 0,
    failed: 0,
    deadLettered: 0,
  };

  for (const job of claimed) {
    try {
      const result = await runJobHandler(job);

      if (result.status === "succeeded") {
        await markJobRunSucceeded(job.id, claimToken);
        summary.succeeded += 1;
        incrementMetric("jobs.succeeded_total", 1, {
          handler: job.handler,
        });
        logger.info("job_succeeded", {
          jobId: job.id,
          workspaceId: job.workspaceId,
          handler: job.handler,
          details: result.details,
        });
        continue;
      }

      if (result.status === "dead_lettered" || job.attemptCount >= job.maxAttempts) {
        await markJobRunDeadLettered(job.id, claimToken, result.message);

        if (job.requestId) {
          await markIngestRequestFailed(job.requestId, result.message);
        }

        summary.deadLettered += 1;
        incrementMetric("jobs.dead_lettered_total", 1, {
          handler: job.handler,
        });
        logger.error("job_dead_lettered", {
          jobId: job.id,
          workspaceId: job.workspaceId,
          handler: job.handler,
          reason: result.message,
          attemptCount: job.attemptCount,
        });
        continue;
      }

      const nextAttemptAt = new Date(Date.now() + calculateExponentialBackoff(job.attemptCount));
      await markJobRunRetryableFailure(job.id, claimToken, nextAttemptAt, result.message);

      if (job.requestId) {
        await markIngestRequestFailed(job.requestId, result.message);
      }

      summary.failed += 1;
      incrementMetric("jobs.retry_scheduled_total", 1, {
        handler: job.handler,
      });
      logger.warn("job_retry_scheduled", {
        jobId: job.id,
        workspaceId: job.workspaceId,
        handler: job.handler,
        reason: result.message,
        attemptCount: job.attemptCount,
        nextAttemptAt: nextAttemptAt.toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha inesperada no worker.";

      if (job.attemptCount >= job.maxAttempts) {
        await markJobRunDeadLettered(job.id, claimToken, message);
        summary.deadLettered += 1;
        incrementMetric("jobs.dead_lettered_total", 1, {
          handler: job.handler,
        });
      } else {
        const nextAttemptAt = new Date(Date.now() + calculateExponentialBackoff(job.attemptCount));
        await markJobRunRetryableFailure(job.id, claimToken, nextAttemptAt, message);
        summary.failed += 1;
        incrementMetric("jobs.retry_scheduled_total", 1, {
          handler: job.handler,
        });
      }

      if (job.requestId) {
        await markIngestRequestFailed(job.requestId, message);
      }

      logger.error("job_execution_failed", {
        jobId: job.id,
        workspaceId: job.workspaceId,
        handler: job.handler,
        reason: message,
        attemptCount: job.attemptCount,
      });
    }
  }

  return summary;
}
