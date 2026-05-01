import { afterEach, describe, expect, it, vi } from "vitest";

import type { TenantContext } from "@/lib/auth/session";

const prismaMock = vi.hoisted(() => ({
  trendSource: {
    findMany: vi.fn(),
  },
  externalOAuthConnection: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  getPrisma: () => prismaMock,
}));

import { buildInstagramConnectorView, getSourcesConnectorsData } from "./connectors";

const originalEnv = {
  INSTAGRAM_OAUTH_ENABLED: process.env.INSTAGRAM_OAUTH_ENABLED,
  INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
  INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
  INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
  INSTAGRAM_SCOPES: process.env.INSTAGRAM_SCOPES,
  OAUTH_TOKEN_ENCRYPTION_KEY: process.env.OAUTH_TOKEN_ENCRYPTION_KEY,
};

const tenantContext: TenantContext = {
  userId: "user-1",
  userEmail: "ops@trends.center",
  userName: "Ops",
  userStatus: "ACTIVE",
  emailVerifiedAt: new Date("2026-04-27T10:00:00.000Z"),
  workspaceId: "workspace-1",
  workspaceName: "Trends Center",
  workspaceSlug: "trends-center",
  role: "OWNER",
  membershipStatus: "ACTIVE",
};

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function instagramTrendSource(overrides = {}) {
  return {
    id: "trend-source-1",
    workspaceId: "workspace-1",
    platform: "INSTAGRAM",
    title: "Instagram Reels official surface From DB",
    sourceType: "REEL",
    sourceUrl: "https://www.instagram.com/reels/",
    region: "global",
    category: "reels",
    status: "ACTIVE",
    lastCheckedAt: null,
    createdAt: new Date("2026-04-27T10:00:00.000Z"),
    updatedAt: new Date("2026-04-27T11:00:00.000Z"),
    ...overrides,
  };
}

describe("sources connectors data", () => {
  afterEach(() => {
    vi.clearAllMocks();
    restoreEnv();
  });

  it("loads Instagram sources from the current workspace database scope", async () => {
    prismaMock.trendSource.findMany.mockResolvedValue([instagramTrendSource()]);
    prismaMock.externalOAuthConnection.findUnique.mockResolvedValue(null);

    const data = await getSourcesConnectorsData(tenantContext);

    expect(prismaMock.trendSource.findMany).toHaveBeenCalledWith({
      where: {
        workspaceId: "workspace-1",
        platform: "INSTAGRAM",
      },
      orderBy: [{ status: "asc" }, { sourceType: "asc" }, { updatedAt: "desc" }],
    });
    expect(prismaMock.externalOAuthConnection.findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_provider: {
          workspaceId: "workspace-1",
          provider: "INSTAGRAM",
        },
      },
    });
    expect(data.trendSources).toEqual([
      {
        id: "trend-source-1",
        platform: "instagram",
        title: "Instagram Reels official surface From DB",
        sourceType: "reel",
        sourceUrl: "https://www.instagram.com/reels/",
        region: "global",
        category: "reels",
        status: "active",
        lastCheckedAt: undefined,
        createdAt: "2026-04-27T10:00:00.000Z",
        updatedAt: "2026-04-27T11:00:00.000Z",
      },
    ]);
    expect(data.stats).toEqual({ totalSources: 1, activeSources: 1, uncheckedSources: 1 });
  });

  it("keeps Instagram OAuth optional when env vars are absent", () => {
    process.env.INSTAGRAM_OAUTH_ENABLED = "true";
    delete process.env.INSTAGRAM_CLIENT_ID;
    delete process.env.INSTAGRAM_CLIENT_SECRET;
    delete process.env.INSTAGRAM_REDIRECT_URI;
    delete process.env.INSTAGRAM_SCOPES;
    delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

    expect(buildInstagramConnectorView()).toMatchObject({
      provider: "instagram",
      state: "not_configured",
      stateLabel: "Nao conectada",
      readinessLabel: "Configure para ativar",
      missingRequirements: [
        "ID do app Meta",
        "segredo do app Meta",
        "URL de retorno",
        "cofre de acesso",
      ],
      oauthImplemented: true,
      canStartConnection: false,
    });
  });

  it("keeps the official Instagram connector paused by default", () => {
    delete process.env.INSTAGRAM_OAUTH_ENABLED;
    process.env.INSTAGRAM_CLIENT_ID = "client-id";

    expect(buildInstagramConnectorView()).toMatchObject({
      provider: "instagram",
      state: "not_configured",
      stateLabel: "Pausado",
      readinessLabel: "Nao usado agora",
      missingRequirements: [],
      oauthImplemented: false,
      canStartConnection: false,
    });
  });

  it("surfaces partial Instagram OAuth env as a configuration error", () => {
    process.env.INSTAGRAM_OAUTH_ENABLED = "true";
    process.env.INSTAGRAM_CLIENT_ID = "client-id";
    delete process.env.INSTAGRAM_CLIENT_SECRET;
    delete process.env.INSTAGRAM_REDIRECT_URI;
    delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

    expect(buildInstagramConnectorView()).toMatchObject({
      state: "configuration_error",
      stateLabel: "Falta configuracao",
      missingRequirements: ["segredo do app Meta", "URL de retorno", "cofre de acesso"],
      oauthImplemented: true,
      canStartConnection: false,
    });
  });

  it("does not serialize the Instagram client secret into connector UI data", () => {
    const connector = buildInstagramConnectorView({
      clientId: "client-id",
      clientSecret: "super-secret-value",
      redirectUri: "https://trends.center/api/connectors/instagram/callback",
      scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
      ready: true,
    }, null, { tokenEncryptionReady: true, oauthEnabled: true });

    expect(connector).toMatchObject({
      state: "ready",
      stateLabel: "Pronto para conectar",
      scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
      oauthImplemented: true,
      canStartConnection: true,
      startUrl: "/api/connectors/instagram/start",
    });
    expect(JSON.stringify(connector)).not.toContain("super-secret-value");
  });

  it("shows a connected state with safe connection metadata only", () => {
    const connector = buildInstagramConnectorView(
      {
        clientId: "client-id",
        clientSecret: "super-secret-value",
        redirectUri: "https://trends.center/api/connectors/instagram/callback",
        scopes: ["instagram_business_basic"],
        ready: true,
      },
      {
        status: "CONNECTED",
        connectedAt: new Date("2026-04-27T12:00:00.000Z"),
        updatedAt: new Date("2026-04-27T12:05:00.000Z"),
      },
      { tokenEncryptionReady: true, oauthEnabled: true },
    );

    expect(connector).toMatchObject({
      state: "connected",
      stateLabel: "Conectado",
      canStartConnection: false,
      connection: {
        provider: "instagram",
        status: "connected",
        connectedAt: "2026-04-27T12:00:00.000Z",
        updatedAt: "2026-04-27T12:05:00.000Z",
      },
    });
    expect(JSON.stringify(connector)).not.toContain("super-secret-value");
  });
});
