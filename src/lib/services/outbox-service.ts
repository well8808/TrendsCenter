import { randomUUID } from "node:crypto";

import { calculateExponentialBackoff } from "@/lib/jobs/backoff";
import { deliverEmail } from "@/lib/services/email-delivery-service";
import { AppError } from "@/lib/http/errors";
import { createLogger } from "@/lib/http/logger";
import { incrementMetric } from "@/lib/observability/metrics";
import {
  claimDueOutboxItems,
  markOutboxItemRetryableFailure,
  markOutboxItemSent,
  markOutboxItemSuppressed,
} from "@/lib/repositories/outbox-repository";

function appErrorDetails(error: unknown) {
  if (!(error instanceof AppError) || typeof error.details !== "object" || error.details === null) {
    return {};
  }

  return error.details as Record<string, unknown>;
}

function isMissingEmailProvider(error: unknown, message: string) {
  const details = appErrorDetails(error);

  return (
    (error instanceof AppError &&
      error.code === "SERVICE_UNAVAILABLE" &&
      details.provider === "resend" &&
      details.reason === "missing_env") ||
    message.includes("nao configurado")
  );
}

function toHtml(body: string, actionUrl?: string | null) {
  const escaped = body.replace(/\n/g, "<br />");

  if (!actionUrl) {
    return `<div>${escaped}</div>`;
  }

  return `<div>${escaped}<br /><br /><a href="${actionUrl}">${actionUrl}</a></div>`;
}

export async function processAuthOutbox(options: { limit?: number; requestId: string }) {
  const limit = options.limit ?? 20;
  const claimToken = randomUUID();
  const leaseExpiresAt = new Date(Date.now() + 60_000);
  const logger = createLogger({
    scope: "outbox",
    requestId: options.requestId,
  });
  const claimed = await claimDueOutboxItems(limit, claimToken, leaseExpiresAt);
  incrementMetric("outbox.claimed_total", claimed.length, {
    kind: "auth",
  });
  const summary = {
    claimed: claimed.length,
    sent: 0,
    failed: 0,
    suppressed: 0,
  };

  for (const item of claimed) {
    try {
      const delivery = await deliverEmail({
        to: item.toEmail,
        subject: item.subject,
        html: toHtml(item.body, item.actionUrl),
        idempotencyKey: item.dedupeKey ?? item.id,
      });

      await markOutboxItemSent(item.id, claimToken, delivery.provider, delivery.messageId);
      summary.sent += 1;
      incrementMetric("outbox.sent_total", 1, {
        kind: item.kind,
      });
      logger.info("outbox_item_sent", {
        outboxId: item.id,
        provider: delivery.provider,
        workspaceId: item.workspaceId ?? undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida no provider de email.";
      const missingProvider = isMissingEmailProvider(error, message);

      if (missingProvider) {
        const details = appErrorDetails(error);
        await markOutboxItemSuppressed(item.id, claimToken, message);
        summary.suppressed += 1;
        incrementMetric("outbox.suppressed_total", 1, {
          kind: item.kind,
        });
        logger.info("outbox_item_suppressed", {
          outboxId: item.id,
          workspaceId: item.workspaceId ?? undefined,
          provider: details.provider ?? "resend",
          reasonCode: details.reason ?? "missing_env",
          reason: message,
          emailDeliveryEnabled: false,
        });
        continue;
      }

      if (item.attemptCount >= item.maxAttempts) {
        await markOutboxItemSuppressed(item.id, claimToken, message);
        summary.suppressed += 1;
        incrementMetric("outbox.dead_lettered_total", 1, {
          kind: item.kind,
        });
        logger.error("outbox_item_dead_lettered", {
          outboxId: item.id,
          workspaceId: item.workspaceId ?? undefined,
          reason: message,
          attemptCount: item.attemptCount,
        });
        continue;
      }

      const nextAttemptAt = new Date(Date.now() + calculateExponentialBackoff(item.attemptCount));
      await markOutboxItemRetryableFailure(item.id, claimToken, nextAttemptAt, message);
      summary.failed += 1;
      incrementMetric("outbox.retry_scheduled_total", 1, {
        kind: item.kind,
      });
      logger.error("outbox_item_retry_scheduled", {
        outboxId: item.id,
        workspaceId: item.workspaceId ?? undefined,
        reason: message,
        attemptCount: item.attemptCount,
        nextAttemptAt: nextAttemptAt.toISOString(),
      });
    }
  }

  return summary;
}
