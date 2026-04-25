import type { AuthEmailKind, Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { stableHash } from "@/lib/ingestion/dedupe";

type AuthEmailClient = Prisma.TransactionClient | ReturnType<typeof getPrisma>;

export async function queueAuthEmail({
  client = getPrisma(),
  kind,
  toEmail,
  subject,
  body,
  actionUrl,
  userId,
  workspaceId,
}: {
  client?: AuthEmailClient;
  kind: AuthEmailKind;
  toEmail: string;
  subject: string;
  body: string;
  actionUrl?: string;
  userId?: string;
  workspaceId?: string;
}) {
  const dedupeKey = stableHash({
    kind,
    toEmail: toEmail.trim().toLowerCase(),
    subject,
    actionUrl: actionUrl ?? null,
    body,
    workspaceId: workspaceId ?? null,
  }).slice(0, 40);

  return client.authEmailOutbox.create({
    data: {
      kind,
      toEmail,
      subject,
      body,
      actionUrl,
      userId,
      workspaceId,
      status: "QUEUED",
      dedupeKey,
      nextAttemptAt: new Date(),
    },
  });
}
