import { headers } from "next/headers";

import { writeAuthEvent } from "@/lib/auth/events";
import { hashIdentifier } from "@/lib/auth/tokens";
import { getPrisma } from "@/lib/db";

export class RateLimitError extends Error {
  constructor(public readonly resetAt: Date) {
    super("Muitas tentativas. Aguarde um pouco e tente novamente.");
    this.name = "RateLimitError";
  }
}

export async function requestFingerprint(identifier: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown-ip";
  const userAgent = headerStore.get("user-agent") ?? "unknown-agent";

  return hashIdentifier(`${forwardedFor}|${userAgent}|${identifier}`);
}

export async function assertRateLimit({
  bucket,
  identifier,
  limit,
  windowSeconds,
}: {
  bucket: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}) {
  const key = await requestFingerprint(identifier);
  const prisma = getPrisma();
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const existing = await prisma.authRateLimit.findUnique({
    where: { bucket_key: { bucket, key } },
  });

  if (!existing || existing.resetAt <= now) {
    await prisma.authRateLimit.upsert({
      where: { bucket_key: { bucket, key } },
      update: { count: 1, resetAt },
      create: { bucket, key, count: 1, resetAt },
    });

    return { key, resetAt };
  }

  if (existing.count >= limit) {
    await writeAuthEvent({
      type: "RATE_LIMITED",
      success: false,
      ipHash: key,
      reason: bucket,
      metadata: { limit, resetAt: existing.resetAt.toISOString() },
    });
    throw new RateLimitError(existing.resetAt);
  }

  await prisma.authRateLimit.update({
    where: { bucket_key: { bucket, key } },
    data: { count: { increment: 1 } },
  });

  return { key, resetAt: existing.resetAt };
}
