import type { ExternalOAuthConnection, TrendSource } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { isOAuthTokenEncryptionConfigured } from "@/lib/oauth/secret-crypto.server";
import { mapSafeInstagramOAuthConnection, type SafeOAuthConnectionRecord } from "@/lib/instagram/oauth-connections.server";
import { getInstagramOAuthConfig, type InstagramOAuthConfig } from "@/lib/instagram/oauth-config.server";
import type { TrendSourceRecord } from "@/lib/types";

export type ExternalConnectorProvider = "instagram";

export type ExternalConnectorConfigState = "not_configured" | "ready" | "configuration_error" | "connected";

export interface ExternalConnectorView {
  provider: ExternalConnectorProvider;
  platform: "instagram";
  title: string;
  surface: string;
  state: ExternalConnectorConfigState;
  stateLabel: string;
  readinessLabel: string;
  description: string;
  scopes: string[];
  missingRequirements: string[];
  oauthImplemented: boolean;
  canStartConnection: boolean;
  startUrl?: string;
  connection: SafeOAuthConnectionRecord;
}

export interface SourcesConnectorsData {
  tenant: {
    workspaceName: string;
    workspaceSlug: string;
    userEmail: string;
  };
  connectors: ExternalConnectorView[];
  trendSources: TrendSourceRecord[];
  stats: {
    totalSources: number;
    activeSources: number;
    uncheckedSources: number;
  };
}

function mapTrendSource(source: TrendSource): TrendSourceRecord {
  return {
    id: source.id,
    platform: source.platform.toLowerCase() as TrendSourceRecord["platform"],
    title: source.title,
    sourceType: source.sourceType.toLowerCase() as TrendSourceRecord["sourceType"],
    sourceUrl: source.sourceUrl,
    region: source.region,
    category: source.category,
    status: source.status.toLowerCase() as TrendSourceRecord["status"],
    lastCheckedAt: source.lastCheckedAt?.toISOString(),
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

export function buildInstagramConnectorView(
  config: InstagramOAuthConfig = getInstagramOAuthConfig(),
  connection?: Pick<ExternalOAuthConnection, "status" | "connectedAt" | "updatedAt"> | null,
  options: { tokenEncryptionReady?: boolean } = {},
): ExternalConnectorView {
  const safeConnection = mapSafeInstagramOAuthConnection(connection);
  const requiredVariables = [
    { label: "ID do app Meta", configured: Boolean(config.clientId) },
    { label: "segredo do app Meta", configured: Boolean(config.clientSecret) },
    { label: "URL de retorno", configured: Boolean(config.redirectUri) },
    { label: "cofre de acesso", configured: options.tokenEncryptionReady ?? isOAuthTokenEncryptionConfigured() },
  ];
  const missingRequirements = requiredVariables.filter((item) => !item.configured).map((item) => item.label);
  const configuredCount = requiredVariables.length - missingRequirements.length;
  const state: ExternalConnectorConfigState =
    safeConnection.status === "connected"
      ? "connected"
      : missingRequirements.length === 0
        ? "ready"
        : configuredCount === 0
          ? "not_configured"
          : "configuration_error";

  if (state === "connected") {
    return {
      provider: "instagram",
      platform: "instagram",
      title: "Conta Instagram",
      surface: "Instagram e Meta",
      state,
      stateLabel: "Conectado",
      readinessLabel: "Dados liberados",
      description:
        "Conta profissional autorizada. O radar pode receber dados reais permitidos por essa conta.",
      scopes: config.scopes,
      missingRequirements,
      oauthImplemented: true,
      canStartConnection: false,
      connection: safeConnection,
    };
  }

  if (state === "ready") {
    return {
      provider: "instagram",
      platform: "instagram",
      title: "Conta Instagram",
      surface: "Instagram e Meta",
      state,
      stateLabel: "Pronto para conectar",
      readinessLabel: "Aguardando autorizacao",
      description:
        "A configuracao esta pronta. Conecte uma conta profissional para liberar dados reais no radar.",
      scopes: config.scopes,
      missingRequirements,
      oauthImplemented: true,
      canStartConnection: true,
      startUrl: "/api/connectors/instagram/start",
      connection: safeConnection,
    };
  }

  if (state === "configuration_error") {
    return {
      provider: "instagram",
      platform: "instagram",
      title: "Conta Instagram",
      surface: "Instagram e Meta",
      state,
      stateLabel: "Falta configuracao",
      readinessLabel: "Acao necessaria",
      description:
        "Alguns dados de acesso da Meta foram preenchidos, mas ainda falta completar a conexao.",
      scopes: config.scopes,
      missingRequirements,
      oauthImplemented: true,
      canStartConnection: false,
      connection: safeConnection,
    };
  }

  return {
    provider: "instagram",
    platform: "instagram",
    title: "Conta Instagram",
    surface: "Instagram e Meta",
    state,
    stateLabel: "Nao conectada",
    readinessLabel: "Configure para ativar",
    description:
      "Nenhuma conta profissional foi conectada ainda. O radar nao simula dados nem acessos.",
    scopes: config.scopes,
    missingRequirements,
    oauthImplemented: true,
    canStartConnection: false,
    connection: safeConnection,
  };
}

export async function getSourcesConnectorsData(context: TenantContext): Promise<SourcesConnectorsData> {
  const prisma = getPrisma();
  const [trendSources, instagramOAuthConnection] = await Promise.all([
    prisma.trendSource.findMany({
      where: {
        workspaceId: context.workspaceId,
        platform: "INSTAGRAM",
      },
      orderBy: [{ status: "asc" }, { sourceType: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.externalOAuthConnection.findUnique({
      where: {
        workspaceId_provider: {
          workspaceId: context.workspaceId,
          provider: "INSTAGRAM",
        },
      },
    }),
  ]);
  const mappedTrendSources = trendSources.map(mapTrendSource);

  return {
    tenant: {
      workspaceName: context.workspaceName,
      workspaceSlug: context.workspaceSlug,
      userEmail: context.userEmail,
    },
    connectors: [buildInstagramConnectorView(getInstagramOAuthConfig(), instagramOAuthConnection)],
    trendSources: mappedTrendSources,
    stats: {
      totalSources: mappedTrendSources.length,
      activeSources: mappedTrendSources.filter((source) => source.status === "active").length,
      uncheckedSources: mappedTrendSources.filter((source) => !source.lastCheckedAt).length,
    },
  };
}
