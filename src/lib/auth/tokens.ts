import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createPlainToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashIdentifier(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function expiresInMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isSameTokenHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
