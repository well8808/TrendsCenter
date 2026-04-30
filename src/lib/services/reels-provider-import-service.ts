import { randomUUID } from "node:crypto";

import type { JobRun, JobStatus, Market, Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import {
  fetchBrightDataSnapshotOnce,
  normalizeBrightDataReelsSnapshot,
  startBrightDataReels,
  type BrightDataReelsMode,
  type BrightDataStartedReelsCollection,
} from "@/lib/instagram/bright-data";
import { AppError, badRequest, notFound, serviceUnavailable } from "@/lib/http/errors";
import { stableHash } from "@/lib/ingestion/dedupe";
import { markJobRunSucceeded } from "@/lib/repositories/job-run-repository";
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

type ProviderCollectionStatus = "started" | "pending" | "imported" | "failed";

interface ProviderImportResultPayload {
  importedCount: number;
  importedVideoIds: string[];
  batchId?: string;
  importedAt: string;
}

interface ProviderJobPayload extends BrightDataStartedReelsCollection {
  kind: "BRIGHT_DATA_REELS_IMPORT";
  externalNetwork: true;
  createdAt: string;
  lastCheckedAt?: string;
  result?: ProviderImportResultPayload;
}

const providerJobHandler = "provider-reels-import";
const providerJobName = "licensed-reels-import";
const providerPollMs = 6_000;

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

function jsonPayload(payload: ProviderJobPayload): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify({
    ...payload,
    result: payload.result
      ? {
          ...payload.result,
          importedVideoIds: payload.result.importedVideoIds,
        }
      : undefined,
  })) as Prisma.InputJsonValue;
}

function parseProviderPayload(value: unknown): ProviderJobPayload {
  const item = record(value);

  if (item.kind !== "BRIGHT_DATA_REELS_IMPORT") {
    throw serviceUnavailable("Job Bright Data sem payload de coleta reconhecido.");
  }

  const snapshotId = typeof item.snapshotId === "string" ? item.snapshotId : "";
  const sourceUrl = typeof item.sourceUrl === "string" ? item.sourceUrl : "";
  const sourceTitle = typeof item.sourceTitle === "string" ? item.sourceTitle : "";

  if (!snapshotId || !sourceUrl || !sourceTitle) {
    throw serviceUnavailable("Job Bright Data incompleto para polling.");
  }

  const result = record(item.result);
  const importedVideoIds = Array.isArray(result.importedVideoIds)
    ? result.importedVideoIds.filter((id): id is string => typeof id === "string")
    : [];
  const parsedResult =
    typeof result.importedCount === "number" && typeof result.importedAt === "string"
      ? {
          importedCount: result.importedCount,
          importedVideoIds,
          batchId: typeof result.batchId === "string" ? result.batchId : undefined,
          importedAt: result.importedAt,
        }
      : undefined;

  return {
    kind: "BRIGHT_DATA_REELS_IMPORT",
    externalNetwork: true,
    provider: "bright_data",
    mode: parseMode(item.mode),
    market: parseMarket(item.market),
    snapshotId,
    sourceUrl,
    sourceTitle,
    urls: parseUrls(item.urls),
    maxPerProfile: typeof item.maxPerProfile === "number" ? item.maxPerProfile : undefined,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    lastCheckedAt: typeof item.lastCheckedAt === "string" ? item.lastCheckedAt : undefined,
    result: parsedResult,
  };
}

function buildProviderImportDto(
  job: Pick<JobRun, "id" | "status" | "lastError" | "error" | "createdAt" | "updatedAt">,
  payload: ProviderJobPayload,
  collectionStatus: ProviderCollectionStatus,
  message: string,
) {
  const result = payload.result;

  return {
    provider: payload.provider,
    mode: payload.mode,
    sourceTitle: payload.sourceTitle,
    market: payload.market,
    jobId: job.id,
    jobStatus: job.status,
    collectionStatus,
    importedCount: result?.importedCount ?? 0,
    importedVideoIds: result?.importedVideoIds ?? [],
    batchId: result?.batchId,
    message,
    nextPollMs: collectionStatus === "started" || collectionStatus === "pending" ? providerPollMs : undefined,
    lastError: job.lastError ?? job.error ?? undefined,
    checkedAt: new Date().toISOString(),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

async function recordProviderFailure(context: ApiTenantContext, input: ProviderImportInput, error: unknown) {
  const message = errorMessage(error);
  const now = new Date();

  await getPrisma().jobRun.create({
    data: {
      workspaceId: context.workspaceId,
      queue: "ingestion",
      handler: providerJobHandler,
      name: providerJobName,
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
  return startProviderReelsImport(context, body);
}

export async function startProviderReelsImport(context: ApiTenantContext, body: unknown) {
  const input = parseBody(body);
  let started: BrightDataStartedReelsCollection;

  try {
    started = await startBrightDataReels({
      mode: input.mode,
      market: input.market,
      urls: input.urls,
      maxPerProfile: input.maxPerProfile,
      sourceTitle: input.sourceTitle,
    });
  } catch (error) {
    if (!(error instanceof AppError && error.status === 400)) {
      await recordProviderFailure(context, input, error).catch((recordError) => {
        console.error("[provider-reels-import] failed to record provider failure", recordError);
      });
    }

    throw error;
  }

  const now = new Date();
  const payload: ProviderJobPayload = {
    ...started,
    kind: "BRIGHT_DATA_REELS_IMPORT",
    externalNetwork: true,
    createdAt: now.toISOString(),
  };
  const job = await getPrisma().jobRun.create({
    data: {
      workspaceId: context.workspaceId,
      queue: "ingestion",
      handler: providerJobHandler,
      name: providerJobName,
      status: "RUNNING",
      stage: "RECEIVE",
      createdBy: context.userEmail,
      attemptCount: 1,
      maxAttempts: 30,
      startedAt: now,
      availableAt: new Date(Date.now() + providerPollMs),
      dedupeKey: `provider-reels:${started.snapshotId}`,
      payload: jsonPayload(payload),
    },
  });

  return buildProviderImportDto(
    job,
    payload,
    "started",
    "Coleta iniciada na Bright Data. Aguardando snapshot ficar pronto.",
  );
}

async function markProviderJobPending(jobId: string, claimToken: string, payload: ProviderJobPayload) {
  const nextAvailableAt = new Date(Date.now() + providerPollMs);
  await getPrisma().jobRun.updateMany({
    where: { id: jobId, claimToken },
    data: {
      status: "RUNNING",
      stage: "RECEIVE",
      availableAt: nextAvailableAt,
      leaseExpiresAt: null,
      claimToken: null,
      payload: jsonPayload({
        ...payload,
        lastCheckedAt: new Date().toISOString(),
      }),
    },
  });
}

async function markProviderJobFailed(jobId: string, claimToken: string, payload: ProviderJobPayload, error: unknown) {
  const message = errorMessage(error);
  await getPrisma().jobRun.updateMany({
    where: { id: jobId, claimToken },
    data: {
      status: "FAILED",
      stage: "RECEIVE",
      finishedAt: new Date(),
      leaseExpiresAt: null,
      claimToken: null,
      error: message,
      lastError: message,
      payload: jsonPayload({
        ...payload,
        lastCheckedAt: new Date().toISOString(),
      }),
    },
  });

  return message;
}

async function claimProviderJob(job: JobRun) {
  const claimToken = randomUUID();
  const now = new Date();
  const claimed = await getPrisma().jobRun.updateMany({
    where: {
      id: job.id,
      workspaceId: job.workspaceId,
      handler: providerJobHandler,
      status: { in: ["QUEUED", "RUNNING", "FAILED"] as JobStatus[] },
      OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
    },
    data: {
      status: "RUNNING",
      leaseExpiresAt: new Date(Date.now() + 45_000),
      claimToken,
    },
  });

  return claimed.count === 1 ? claimToken : undefined;
}

export async function getProviderReelsImportStatus(context: ApiTenantContext, jobId: string) {
  const job = await getPrisma().jobRun.findFirst({
    where: {
      id: jobId,
      workspaceId: context.workspaceId,
      handler: providerJobHandler,
    },
  });

  if (!job) {
    throw notFound("Coleta Bright Data nao encontrada neste workspace.");
  }

  const payload = parseProviderPayload(job.payload);

  if (job.status === "SUCCEEDED") {
    return buildProviderImportDto(job, payload, "imported", "Coleta Bright Data importada com sucesso.");
  }

  if (job.status === "FAILED" || job.status === "DEAD_LETTERED" || job.status === "CANCELED") {
    return buildProviderImportDto(job, payload, "failed", job.lastError ?? job.error ?? "Coleta Bright Data falhou.");
  }

  const claimToken = await claimProviderJob(job);

  if (!claimToken) {
    return buildProviderImportDto(job, payload, "pending", "Coleta ja esta sendo checada em outra requisicao.");
  }

  try {
    const snapshot = await fetchBrightDataSnapshotOnce(payload.snapshotId);

    if (snapshot.status === "pending") {
      await markProviderJobPending(job.id, claimToken, payload);
      return buildProviderImportDto(
        { ...job, status: "RUNNING" },
        { ...payload, lastCheckedAt: new Date().toISOString() },
        "pending",
        "Bright Data ainda esta preparando o snapshot.",
      );
    }

    const collected = normalizeBrightDataReelsSnapshot(payload, snapshot.textBody);
    const result = await ingestTrendVideos(
      {
        sourceTitle: payload.sourceTitle,
        sourceKind: "INSTAGRAM_REELS_TRENDS",
        sourceOrigin: "OWNED",
        market: payload.market,
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

    const importResult: ProviderImportResultPayload = {
      importedCount: result.importedVideoIds.length,
      importedVideoIds: result.importedVideoIds,
      batchId: "batchId" in result ? result.batchId : undefined,
      importedAt: new Date().toISOString(),
    };
    const completedPayload: ProviderJobPayload = {
      ...payload,
      lastCheckedAt: new Date().toISOString(),
      result: importResult,
    };

    await markJobRunSucceeded(job.id, claimToken, {
      ...(importResult.batchId ? { importBatch: { connect: { id: importResult.batchId } } } : {}),
      payload: jsonPayload(completedPayload),
    });

    return buildProviderImportDto(
      { ...job, status: "SUCCEEDED", updatedAt: new Date() },
      completedPayload,
      "imported",
      `${importResult.importedCount} Reels importados da Bright Data.`,
    );
  } catch (error) {
    const message = await markProviderJobFailed(job.id, claimToken, payload, error);
    return buildProviderImportDto(
      { ...job, status: "FAILED", error: message, lastError: message, updatedAt: new Date() },
      payload,
      "failed",
      message,
    );
  }
}
