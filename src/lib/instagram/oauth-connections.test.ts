import { afterEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  externalOAuthConnection: {
    upsert: vi.fn(),
  },
}));

interface OAuthConnectionUpsertArgs {
  create: {
    workspaceId: string;
    externalAccountId: string;
    scopes: string;
    tokenType: string;
    accessTokenEncrypted: string;
    refreshTokenEncrypted: string | null;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date | null;
  };
  update: Record<string, unknown>;
}

vi.mock("@/lib/db", () => ({
  getPrisma: () => prismaMock,
}));

import { saveInstagramOAuthConnection } from "./oauth-connections.server";

const originalEncryptionKey = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

describe("Instagram OAuth connections", () => {
  afterEach(() => {
    vi.clearAllMocks();

    if (typeof originalEncryptionKey === "undefined") {
      delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
    } else {
      process.env.OAUTH_TOKEN_ENCRYPTION_KEY = originalEncryptionKey;
    }
  });

  it("persists encrypted token fields without plaintext tokens", async () => {
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "test-encryption-key-with-at-least-32-characters";
    prismaMock.externalOAuthConnection.upsert.mockImplementation(async (args: OAuthConnectionUpsertArgs) => ({
      id: "connection-1",
      workspaceId: args.create.workspaceId,
      provider: "INSTAGRAM",
      status: "CONNECTED",
      externalAccountId: args.create.externalAccountId,
      scopes: args.create.scopes,
      tokenType: args.create.tokenType,
      accessTokenEncrypted: args.create.accessTokenEncrypted,
      refreshTokenEncrypted: args.create.refreshTokenEncrypted,
      accessTokenExpiresAt: args.create.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.create.refreshTokenExpiresAt,
      error: null,
      connectedAt: new Date("2026-04-27T12:00:00.000Z"),
      createdAt: new Date("2026-04-27T12:00:00.000Z"),
      updatedAt: new Date("2026-04-27T12:05:00.000Z"),
    }));

    const safeConnection = await saveInstagramOAuthConnection(
      { workspaceId: "workspace-1" },
      {
        accessToken: "access-token-plain",
        externalAccountId: "instagram-user-id",
        scope: "instagram_business_basic,instagram_business_manage_insights",
        tokenType: "bearer",
        expiresIn: 5184000,
      },
    );
    const upsertArgs = prismaMock.externalOAuthConnection.upsert.mock.calls[0][0];
    const serializedPersistedData = JSON.stringify({
      create: upsertArgs.create,
      update: upsertArgs.update,
    });

    expect(serializedPersistedData).not.toContain("access-token-plain");
    expect(serializedPersistedData).toContain("v1:");
    expect(safeConnection).toEqual({
      provider: "instagram",
      status: "connected",
      connectedAt: "2026-04-27T12:00:00.000Z",
      updatedAt: "2026-04-27T12:05:00.000Z",
    });
    expect(JSON.stringify(safeConnection)).not.toContain("access-token-plain");
    expect(JSON.stringify(safeConnection)).not.toContain("refresh-token-plain");
  });
});
