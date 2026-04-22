import type { AuthEventType, Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { hashIdentifier } from "@/lib/auth/tokens";

type AuthEventClient = Prisma.TransactionClient | ReturnType<typeof getPrisma>;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function writeAuthEvent({
  type,
  success = true,
  email,
  userId,
  actorUserId,
  workspaceId,
  ipHash,
  reason,
  metadata,
  client = getPrisma(),
}: {
  type: AuthEventType;
  success?: boolean;
  email?: string;
  userId?: string;
  actorUserId?: string;
  workspaceId?: string;
  ipHash?: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
  client?: AuthEventClient;
}) {
  try {
    await client.authEvent.create({
      data: {
        type,
        success,
        emailHash: email ? hashIdentifier(email) : undefined,
        userId,
        actorUserId,
        workspaceId,
        ipHash,
        reason,
        metadata,
      },
    });
  } catch (error) {
    console.error("[auth-event] failed", error);
  }
}
