import type { DataOrigin, IngestRequestType, Market, SignalType, SourceKind } from "@prisma/client";

import {
  buildEvidenceDedupeKey,
  buildSignalDedupeKey,
  normalizeForDedupe,
  stableHash,
} from "@/lib/ingestion/dedupe";
import { getPrisma } from "@/lib/db";
import { jobHandlers, jobQueues, type IngestionJobPayload } from "@/lib/jobs/contracts";
import { badRequest } from "@/lib/http/errors";
import { createAuditEvent } from "@/lib/repositories/audit-event-repository";
import {
  findIngestRequestByWorkspaceKey,
  queueIngestRequest,
} from "@/lib/repositories/ingestion-request-repository";
import { enqueueJob } from "@/lib/repositories/job-run-repository";
import type { ApiTenantContext } from "@/lib/services/auth-context-service";

type IngestionRequestApiInput =
  | {
      type: "OFFICIAL_SNAPSHOT";
      sourceTitle: string;
      sourceKind: SourceKind;
      sourceOrigin: Exclude<DataOrigin, "DEMO">;
      market: Market;
      sourceUrl?: string;
      payloadJson: string;
    }
  | {
      type: "SIGNAL_CREATE";
      signalTitle: string;
      summary: string;
      signalType: SignalType;
      market: Market;
      audience: string;
      sourceTitle: string;
      sourceKind: SourceKind;
      sourceOrigin: Exclude<DataOrigin, "DEMO">;
      evidenceTitle: string;
      evidenceUrl?: string;
      evidenceNote: string;
    }
  | {
      type: "EVIDENCE_APPEND";
      signalId: string;
      sourceId: string;
      signalTitle: string;
      market: Market;
      sourceOrigin: Exclude<DataOrigin, "DEMO">;
      sourceTitle: string;
      evidenceTitle: string;
      evidenceUrl?: string;
      evidenceNote: string;
    };

function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`${field} obrigatorio.`);
  }

  return value.trim();
}

function parseMarket(value: unknown): Market {
  const market = typeof value === "string" ? value.toUpperCase() : "";

  if (market !== "BR" && market !== "US") {
    throw badRequest("market invalido.");
  }

  return market;
}

function parseOrigin(value: unknown): Exclude<DataOrigin, "DEMO"> {
  const origin = typeof value === "string" ? value.toUpperCase() : "";

  if (origin !== "MANUAL" && origin !== "OFFICIAL" && origin !== "OWNED") {
    throw badRequest("sourceOrigin invalido.");
  }

  return origin;
}

function parseSourceKind(value: unknown): SourceKind {
  const kind = typeof value === "string" ? value.toUpperCase() : "";
  const allowed: SourceKind[] = [
    "CREATIVE_CENTER_TRENDS",
    "TOP_ADS",
    "KEYWORD_INSIGHTS",
    "CREATIVE_INSIGHTS",
    "AUDIENCE_INSIGHTS",
    "TIKTOK_ONE",
    "MARKET_SCOPE",
    "DISPLAY_API",
    "COMMERCIAL_MUSIC_LIBRARY",
    "OWNED_UPLOAD",
    "MANUAL_RESEARCH",
  ];

  if (!allowed.includes(kind as SourceKind)) {
    throw badRequest("sourceKind invalido.");
  }

  return kind as SourceKind;
}

function parseSignalType(value: unknown): SignalType {
  const type = typeof value === "string" ? value.toUpperCase() : "";
  const allowed: SignalType[] = ["AUDIO", "FORMAT", "HASHTAG", "CREATOR", "REVIVAL", "US_TO_BR"];

  if (!allowed.includes(type as SignalType)) {
    throw badRequest("signalType invalido.");
  }

  return type as SignalType;
}

export function parseIngestionRequestBody(body: unknown): IngestionRequestApiInput {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const type = requireText(record.type, "type").toUpperCase() as IngestRequestType;

  if (type === "OFFICIAL_SNAPSHOT") {
    return {
      type,
      sourceTitle: requireText(record.sourceTitle, "sourceTitle"),
      sourceKind: parseSourceKind(record.sourceKind),
      sourceOrigin: parseOrigin(record.sourceOrigin),
      market: parseMarket(record.market),
      sourceUrl: typeof record.sourceUrl === "string" && record.sourceUrl.trim() ? record.sourceUrl.trim() : undefined,
      payloadJson: requireText(record.payloadJson, "payloadJson"),
    };
  }

  if (type === "SIGNAL_CREATE") {
    return {
      type,
      signalTitle: requireText(record.signalTitle, "signalTitle"),
      summary: requireText(record.summary, "summary"),
      signalType: parseSignalType(record.signalType),
      market: parseMarket(record.market),
      audience: requireText(record.audience, "audience"),
      sourceTitle: requireText(record.sourceTitle, "sourceTitle"),
      sourceKind: parseSourceKind(record.sourceKind),
      sourceOrigin: parseOrigin(record.sourceOrigin),
      evidenceTitle: requireText(record.evidenceTitle, "evidenceTitle"),
      evidenceUrl: typeof record.evidenceUrl === "string" && record.evidenceUrl.trim() ? record.evidenceUrl.trim() : undefined,
      evidenceNote: requireText(record.evidenceNote, "evidenceNote"),
    };
  }

  if (type === "EVIDENCE_APPEND") {
    return {
      type,
      signalId: requireText(record.signalId, "signalId"),
      sourceId: requireText(record.sourceId, "sourceId"),
      signalTitle: requireText(record.signalTitle, "signalTitle"),
      market: parseMarket(record.market),
      sourceOrigin: parseOrigin(record.sourceOrigin),
      sourceTitle: requireText(record.sourceTitle, "sourceTitle"),
      evidenceTitle: requireText(record.evidenceTitle, "evidenceTitle"),
      evidenceUrl: typeof record.evidenceUrl === "string" && record.evidenceUrl.trim() ? record.evidenceUrl.trim() : undefined,
      evidenceNote: requireText(record.evidenceNote, "evidenceNote"),
    };
  }

  throw badRequest("type de ingestao nao suportado.");
}

function buildTrendImportRequestKey(input: Extract<IngestionRequestApiInput, { type: "OFFICIAL_SNAPSHOT" }>) {
  const sourceKey = [
    "trend-source",
    input.sourceOrigin.toLowerCase(),
    input.sourceKind.toLowerCase(),
    input.market.toLowerCase(),
    normalizeForDedupe(input.sourceTitle),
  ].join(":");

  return `trend-video:${sourceKey}:${stableHash(input.payloadJson)}`;
}

function buildManualSignalRequestKey(input: Extract<IngestionRequestApiInput, { type: "SIGNAL_CREATE" }>) {
  const signalKey = buildSignalDedupeKey({
    market: input.market,
    type: input.signalType,
    title: input.signalTitle,
  });
  const evidenceKey = buildEvidenceDedupeKey({
    signalKey,
    title: input.evidenceTitle,
    url: input.evidenceUrl,
  });

  return `manual-signal:${signalKey}:${evidenceKey}`;
}

async function buildEvidenceAppendRequestKey(
  context: ApiTenantContext,
  input: Extract<IngestionRequestApiInput, { type: "EVIDENCE_APPEND" }>,
) {
  const signal = await getPrisma().signal.findFirst({
    where: {
      id: input.signalId,
      workspaceId: context.workspaceId,
    },
    select: {
      dedupeKey: true,
      title: true,
      type: true,
      market: true,
    },
  });
  const signalKey =
    signal?.dedupeKey ??
    buildSignalDedupeKey({
      market: signal?.market ?? input.market,
      type: signal?.type ?? "FORMAT",
      title: signal?.title ?? input.signalTitle,
    });
  const evidenceKey = buildEvidenceDedupeKey({
    signalKey,
    title: input.evidenceTitle,
    url: input.evidenceUrl,
  });

  return `manual-evidence:${input.signalId}:${evidenceKey}`;
}

async function requestKeyFor(context: ApiTenantContext, input: IngestionRequestApiInput) {
  if (input.type === "OFFICIAL_SNAPSHOT") {
    return buildTrendImportRequestKey(input);
  }

  if (input.type === "SIGNAL_CREATE") {
    return buildManualSignalRequestKey(input);
  }

  return buildEvidenceAppendRequestKey(context, input);
}

function titleFor(input: IngestionRequestApiInput) {
  if (input.type === "OFFICIAL_SNAPSHOT") {
    return input.sourceTitle;
  }

  if (input.type === "SIGNAL_CREATE") {
    return input.signalTitle;
  }

  return input.evidenceTitle;
}

export async function queueOperationalIngestionRequest(context: ApiTenantContext, body: unknown) {
  const input = parseIngestionRequestBody(body);
  const requestKey = await requestKeyFor(context, input);
  const existing = await findIngestRequestByWorkspaceKey(context.workspaceId, requestKey);

  if (existing && (existing.status === "SUCCEEDED" || existing.status === "QUEUED" || existing.status === "RUNNING")) {
    const existingJob = await enqueueJob({
      workspaceId: context.workspaceId,
      queue: jobQueues.ingestion,
      handler: jobHandlers.ingestionRequestProcess,
      name: `process-${existing.type.toLowerCase()}`,
      createdBy: context.userEmail,
      dedupeKey: `queue:${requestKey}`,
      requestId: existing.id,
      payload: {
        requestId: existing.id,
        requestType: existing.type,
      } as unknown as import("@prisma/client").Prisma.InputJsonValue,
    });

    return {
      request: {
        id: existing.id,
        requestKey: existing.requestKey,
        type: existing.type,
        status: existing.status,
        title: existing.title,
        market: existing.market,
        origin: existing.origin,
        submittedAt: existing.submittedAt.toISOString(),
      },
      job: {
        id: existingJob.id,
        queue: existingJob.queue,
        handler: existingJob.handler,
        status: existingJob.status,
        attemptCount: existingJob.attemptCount,
        availableAt: existingJob.availableAt.toISOString(),
      },
      idempotent: true,
    };
  }

  const payload = {
    kind: input.type,
    input,
    submittedBy: context.userEmail,
    requestedAt: new Date().toISOString(),
    requestKey,
  };
  const request = await queueIngestRequest({
    workspaceId: context.workspaceId,
    requestKey,
    type: input.type,
    market: input.market,
    origin: input.sourceOrigin,
    title: titleFor(input),
    submittedBy: context.userEmail,
    sourceId: "sourceId" in input ? input.sourceId : undefined,
    signalId: "signalId" in input ? input.signalId : undefined,
    payload,
  });
  const jobPayload: IngestionJobPayload = {
    requestId: request.id,
    requestType: request.type,
  };
  const job = await enqueueJob({
    workspaceId: context.workspaceId,
    queue: jobQueues.ingestion,
    handler: jobHandlers.ingestionRequestProcess,
    name: `process-${request.type.toLowerCase()}`,
    createdBy: context.userEmail,
    dedupeKey: `queue:${requestKey}`,
    requestId: request.id,
    payload: jobPayload as unknown as import("@prisma/client").Prisma.InputJsonValue,
  });

  await createAuditEvent({
    workspaceId: context.workspaceId,
    type: "JOB_RECORDED",
    label: "queue",
    value: request.type.toLowerCase(),
    tone: "aqua",
    message: "Ingest request enfileirada pela API operacional.",
    actor: context.userEmail,
    metadata: {
      requestId: request.id,
      requestKey,
      jobId: job.id,
    },
  });

  return {
    request: {
      id: request.id,
      requestKey: request.requestKey,
      type: request.type,
      status: request.status,
      title: request.title,
      market: request.market,
      origin: request.origin,
      submittedAt: request.submittedAt.toISOString(),
    },
    job: {
      id: job.id,
      queue: job.queue,
      handler: job.handler,
      status: job.status,
      attemptCount: job.attemptCount,
      availableAt: job.availableAt.toISOString(),
    },
    idempotent: false,
  };
}
