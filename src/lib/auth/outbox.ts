import type { AuthEmailKind, Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";

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
    },
  });
}
