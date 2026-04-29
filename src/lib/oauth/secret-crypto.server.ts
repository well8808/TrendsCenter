import { createCipheriv, createHash, randomBytes } from "node:crypto";

import { serviceUnavailable } from "@/lib/http/errors";

const algorithm = "aes-256-gcm";
const minimumSecretLength = 32;

function encryptionSecret() {
  return process.env.OAUTH_TOKEN_ENCRYPTION_KEY?.trim();
}

export function isOAuthTokenEncryptionConfigured() {
  return Boolean(encryptionSecret() && encryptionSecret()!.length >= minimumSecretLength);
}

function encryptionKey() {
  const secret = encryptionSecret();

  if (!secret || secret.length < minimumSecretLength) {
    throw serviceUnavailable("Criptografia OAuth não configurada para persistir tokens com segurança.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptOAuthSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}
