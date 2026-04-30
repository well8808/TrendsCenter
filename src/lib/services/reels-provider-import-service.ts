import type { Market } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { collectBrightDataReels, type BrightDataReelsMode } from "@/lib/instagram/bright-data";
import { AppError, badRequest, serviceUnavailable } from "@/lib/http/errors";
import { stableHash } from "@/lib/ingestion/dedupe";
import type { ApiTenantContext } from "@/lib/services/auth-context-service";
import { ingestTrendVideos } from "@/lib/trends/ingestion";

interface ProviderImportInput {
  provider: "bright_data";
  mode: BrightDataReelsMode;
  market: Market;
  urls: string[];
  maxPerProfile?: number;
  sourceTitle?: string;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parseMarket(value: unknown): Market {
  const market = typeof value === "string" ? value.toUpperCase() : "";

  if (market !== "BR" && market !== "US") {
    throw badRequest("Mercado invalido.");
  }

  return market;
}

function parseMode(value: unknown): BrightDataReelsMode {
  if (value === "reel_urls" || value === "profile_reels") return value;

  throw badRequest("Tipo de coleta invalido.");
}

function parseUrls(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function parseBody(body: unknown): ProviderImportInput {
  const item = record(body);
  const provider = item.provider === "bright_data" || !item.provider ? "bright_data" : undefined;

  if (!provider) {
    throw badRequest("Provedor nao suportado.");
  }

  return {
    provider,
    mode: parseMode(item.mode),
    market: parseMarket(item.market),
    urls: parseUrls(item.urls),
    maxPerProfile: typeof item.maxPerProfile === "number" ? item.maxPerProfile : undefined,
    sourceTitle: typeof item.sourceTitle === "string" && item.sourceTitle.trim() ? item.sourceTitle.trim() : undefined,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Falha ao coletar Reels no provedor licenciado.";
}

async function recordProviderFailure(context: ApiTenantContext, input: ProviderImportInput, error: unknown) {
  const message = errorMessage(error);
  const now = new Date();

  await getPrisma().jobRun.create({
    data: {
      workspaceId: context.workspaceId,
      queue: "ingestion",
      handler: "provider-reels-import",
      name: "licensed-reels-import",
      status: "FAILED",
      stage: "RECEIVE",
      createdBy: context.userEmail,
      attemptCount: 1,
      maxAttempts: 1,
      startedAt: now,
      finishedAt: now,
      error: message,
      lastError: message,
      dedupeKey: `provider-reels-failed:${stableHash({
        provider: input.provider,
        mode: input.mode,
        market: input.market,
        urlCount: input.urls.length,
        at: now.toISOString(),
      }).slice(0, 24)}`,
      payload: {
        provider: input.provider,
        mode: input.mode,
        market: input.market,
        urlCount: input.urls.length,
        externalNetwork: true,
      },
    },
  });
}

export async function importProviderReels(context: ApiTenantContext, body: unknown) {
  const input = parseBody(body);
  let collected: Awaited<ReturnType<typeof collectBrightDataReels>>;

  try {
    collected = await collectBrightDataReels({
      mode: input.mode,
      market: input.market,
      urls: input.urls,
      maxPerProfile: input.maxPerProfile,
    });
  } catch (error) {
    if (!(error instanceof AppError && error.status === 400)) {
      await recordProviderFailure(context, input, error).catch((recordError) => {
        console.error("[provider-reels-import] failed to record provider failure", recordError);
      });
    }

    throw error;
  }

  const result = await ingestTrendVideos(
    {
      sourceTitle: input.sourceTitle ?? collected.sourceTitle,
      sourceKind: "INSTAGRAM_REELS_TRENDS",
      sourceOrigin: "OWNED",
      market: input.market,
      sourceUrl: collected.sourceUrl,
      payloadJson: JSON.stringify({
        provider: collected.provider,
        mode: collected.mode,
        collected_at: new Date().toISOString(),
        videos: collected.videos,
      }),
      submittedBy: context.userEmail,
    },
    context,
  );

  if (!result.ok) {
    throw serviceUnavailable(result.message);
  }

  return {
    provider: collected.provider,
    mode: collected.mode,
    sourceTitle: input.sourceTitle ?? collected.sourceTitle,
    market: input.market,
    importedCount: result.importedVideoIds.length,
    importedVideoIds: result.importedVideoIds,
    batchId: "batchId" in result ? result.batchId : undefined,
  };
}
