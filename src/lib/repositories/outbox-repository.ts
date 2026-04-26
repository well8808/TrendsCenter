import type { AuthEmailStatus } from "@prisma/client";

import { getPrisma } from "@/lib/db";

export interface ClaimedOutboxItem {
  id: string;
  kind: string;
  toEmail: string;
  subject: string;
  body: string;
  actionUrl?: string | null;
  workspaceId?: string | null;
  userId?: string | null;
  dedupeKey?: string | null;
  attemptCount: number;
  maxAttempts: number;
}

export async function claimDueOutboxItems(limit: number, claimToken: string, leaseExpiresAt: Date) {
  const now = new Date();
  const claimableWhere = {
    OR: [
      {
        status: { in: ["QUEUED", "FAILED"] as AuthEmailStatus[] },
        nextAttemptAt: { lte: now },
        OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
      },
      {
        status: "PROCESSING" as AuthEmailStatus,
        leaseExpiresAt: { lt: now },
      },
    ],
  };
  const candidates = await getPrisma().authEmailOutbox.findMany({
    where: claimableWhere,
    orderBy: [{ createdAt: "asc" }],
    take: limit,
  });
  const claimed: ClaimedOutboxItem[] = [];

  for (const candidate of candidates) {
    const result = await getPrisma().authEmailOutbox.updateMany({
      where: {
        id: candidate.id,
        ...claimableWhere,
      },
      data: {
        status: "PROCESSING",
        claimToken,
        leaseExpiresAt,
        attemptCount: { increment: 1 },
      },
    });

    if (result.count === 1) {
      claimed.push({
        id: candidate.id,
        kind: candidate.kind,
        toEmail: candidate.toEmail,
        subject: candidate.subject,
        body: candidate.body,
        actionUrl: candidate.actionUrl,
        workspaceId: candidate.workspaceId,
        userId: candidate.userId,
        dedupeKey: candidate.dedupeKey,
        attemptCount: candidate.attemptCount + 1,
        maxAttempts: candidate.maxAttempts,
      });
    }
  }

  return claimed;
}

export async function markOutboxItemSent(id: string, claimToken: string, provider: string, providerMessageId?: string) {
  await getPrisma().authEmailOutbox.updateMany({
    where: { id, claimToken },
    data: {
      status: "SENT",
      provider,
      providerMessageId,
      sentAt: new Date(),
      processedAt: new Date(),
      leaseExpiresAt: null,
      claimToken: null,
      error: null,
      lastError: null,
    },
  });
}

export async function markOutboxItemRetryableFailure(
  id: string,
  claimToken: string,
  nextAttemptAt: Date,
  lastError: string,
) {
  await getPrisma().authEmailOutbox.updateMany({
    where: { id, claimToken },
    data: {
      status: "FAILED",
      nextAttemptAt,
      processedAt: null,
      leaseExpiresAt: null,
      claimToken: null,
      error: lastError,
      lastError,
    },
  });
}

export async function markOutboxItemSuppressed(id: string, claimToken: string, lastError: string) {
  await getPrisma().authEmailOutbox.updateMany({
    where: { id, claimToken },
    data: {
      status: "SUPPRESSED",
      processedAt: new Date(),
      leaseExpiresAt: null,
      claimToken: null,
      error: lastError,
      lastError,
    },
  });
}
