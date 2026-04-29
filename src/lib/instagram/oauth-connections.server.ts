import type { ExternalOAuthConnection } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { encryptOAuthSecret } from "@/lib/oauth/secret-crypto.server";
import type { ApiTenantContext } from "@/lib/services/auth-context-service";
import type { InstagramTokenResponse } from "@/lib/instagram/oauth-flow.server";

export interface SafeOAuthConnectionRecord {
  provider: "instagram";
  status: "connected" | "disconnected" | "error";
  connectedAt?: string;
  updatedAt: string;
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

export function mapSafeInstagramOAuthConnection(
  connection?: Pick<ExternalOAuthConnection, "status" | "connectedAt" | "updatedAt"> | null,
): SafeOAuthConnectionRecord {
  const status = connection?.status
    ? (connection.status.toLowerCase() as SafeOAuthConnectionRecord["status"])
    : "disconnected";

  return {
    provider: "instagram",
    status,
    connectedAt: connection?.connectedAt?.toISOString(),
    updatedAt: (connection?.updatedAt ?? new Date(0)).toISOString(),
  };
}

export async function saveInstagramOAuthConnection(
  context: Pick<ApiTenantContext, "workspaceId">,
  token: InstagramTokenResponse,
) {
  const prisma = getPrisma();
  const now = new Date();
  const connection = await prisma.externalOAuthConnection.upsert({
    where: {
      workspaceId_provider: {
        workspaceId: context.workspaceId,
        provider: "INSTAGRAM",
      },
    },
    update: {
      status: "CONNECTED",
      externalAccountId: token.externalAccountId,
      scopes: token.scope,
      tokenType: token.tokenType,
      accessTokenEncrypted: encryptOAuthSecret(token.accessToken),
      refreshTokenEncrypted: token.refreshToken ? encryptOAuthSecret(token.refreshToken) : null,
      accessTokenExpiresAt: addSeconds(now, token.expiresIn),
      refreshTokenExpiresAt: token.refreshExpiresIn ? addSeconds(now, token.refreshExpiresIn) : null,
      error: null,
      connectedAt: now,
      updatedAt: now,
    },
    create: {
      workspaceId: context.workspaceId,
      provider: "INSTAGRAM",
      status: "CONNECTED",
      externalAccountId: token.externalAccountId,
      scopes: token.scope,
      tokenType: token.tokenType,
      accessTokenEncrypted: encryptOAuthSecret(token.accessToken),
      refreshTokenEncrypted: token.refreshToken ? encryptOAuthSecret(token.refreshToken) : null,
      accessTokenExpiresAt: addSeconds(now, token.expiresIn),
      refreshTokenExpiresAt: token.refreshExpiresIn ? addSeconds(now, token.refreshExpiresIn) : null,
      connectedAt: now,
    },
  });

  return mapSafeInstagramOAuthConnection(connection);
}

export async function markInstagramOAuthConnectionError(
  context: Pick<ApiTenantContext, "workspaceId">,
  error: string,
) {
  const prisma = getPrisma();
  const connection = await prisma.externalOAuthConnection.upsert({
    where: {
      workspaceId_provider: {
        workspaceId: context.workspaceId,
        provider: "INSTAGRAM",
      },
    },
    update: {
      status: "ERROR",
      error,
      updatedAt: new Date(),
    },
    create: {
      workspaceId: context.workspaceId,
      provider: "INSTAGRAM",
      status: "ERROR",
      error,
    },
  });

  return mapSafeInstagramOAuthConnection(connection);
}
