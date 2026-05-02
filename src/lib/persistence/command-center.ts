import type { Prisma, TrendSource } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { calculateTrendScore } from "@/lib/scoring";
import { promoteImportedReelsToSignals } from "@/lib/trends/signal-bridge";
import type {
  ConfidenceBand,
  SignalHistoryItem,
  SourceRecord,
  TrendSignal,
  TrendSourceRecord,
} from "@/lib/types";

const sourceInclude = {
  snapshots: {
    orderBy: { collectedAt: "desc" as const },
    take: 1,
  },
  _count: {
    select: { evidence: true },
  },
} satisfies Prisma.SourceInclude;

const signalInclude = {
  source: {
    include: sourceInclude,
  },
  evidence: {
    orderBy: { capturedAt: "desc" as const },
  },
  auditEvents: {
    orderBy: { eventAt: "desc" as const },
    take: 6,
  },
  scores: {
    orderBy: { calculatedAt: "desc" as const },
    take: 1,
  },
  decisionQueueItems: {
    where: { status: "ACTIVE" as const },
  },
} satisfies Prisma.SignalInclude;

type SourceRecordPayload = Prisma.SourceGetPayload<{ include: typeof sourceInclude }>;
type SignalRecordPayload = Prisma.SignalGetPayload<{ include: typeof signalInclude }>;

const batchInclude = {
  source: true,
  request: true,
  signals: {
    select: { title: true },
    take: 3,
  },
  evidence: {
    select: { title: true },
    take: 3,
  },
  snapshots: {
    select: { id: true },
  },
  jobRuns: {
    select: { id: true },
  },
  steps: {
    orderBy: { sequence: "asc" as const },
  },
} satisfies Prisma.ImportBatchInclude;

type BatchRecordPayload = Prisma.ImportBatchGetPayload<{ include: typeof batchInclude }>;

export type PersistenceMode = "database" | "empty-fallback" | "error-fallback";

export interface PersistenceState {
  mode: PersistenceMode;
  label: string;
  detail: string;
}

export interface IngestionConnectorSummary {
  id: string;
  title: string;
  slug: string;
  kind: string;
  origin: string;
  status: string;
  market?: string;
  manualEntryEnabled: boolean;
}

export interface IngestionRequestSummary {
  id: string;
  title: string;
  type: string;
  status: string;
  market: string;
  origin: string;
  submittedAt: string;
  error?: string;
}

export interface IngestionJobSummary {
  id: string;
  name: string;
  status: string;
  stage?: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export interface IngestionBatchSummary {
  id: string;
  title: string;
  kind: string;
  status: string;
  market: string;
  origin: string;
  itemCount: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  sourceTitle?: string;
  requestTitle?: string;
  signalTitles: string[];
  evidenceTitles: string[];
  snapshotCount: number;
  jobCount: number;
  steps: Array<{
    name: string;
    status: string;
    error?: string;
  }>;
}

export interface IngestionLabData {
  connectors: IngestionConnectorSummary[];
  requests: IngestionRequestSummary[];
  batches: IngestionBatchSummary[];
  jobs: IngestionJobSummary[];
  stats: {
    approvedConnectors: number;
    openRequests: number;
    failedBatches: number;
    succeededBatches: number;
  };
}

export interface ReelStatsData {
  total: number;
  br: number;
  us: number;
  avgScore: number;
  evidenceCount: number;
}

export interface CommandCenterData {
  signals: TrendSignal[];
  sources: SourceRecord[];
  trendSources: TrendSourceRecord[];
  persistence: PersistenceState;
  ingestionLab: IngestionLabData;
  reelStats: ReelStatsData;
  tenant: {
    userEmail: string;
    userName: string | null;
    workspaceName: string;
    workspaceSlug: string;
    role: string;
  };
}

const emptyIngestionLab: IngestionLabData = {
  connectors: [],
  requests: [],
  batches: [],
  jobs: [],
  stats: {
    approvedConnectors: 0,
    openRequests: 0,
    failedBatches: 0,
    succeededBatches: 0,
  },
};

const emptyReelStats: ReelStatsData = {
  total: 0,
  br: 0,
  us: 0,
  avgScore: 0,
  evidenceCount: 0,
};

function lowerBand(value: string): ConfidenceBand {
  return value.toLowerCase() as ConfidenceBand;
}

function lowerValue<T extends string>(value: string) {
  return value.toLowerCase() as T;
}

function stringArray(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function scoreLabel(band: ConfidenceBand) {
  if (band === "high") {
    return "alta confianca";
  }

  if (band === "medium") {
    return "observar";
  }

  return "fraco";
}

const operationalSourceKinds = new Set<SourceRecord["kind"]>([
  "INSTAGRAM_REELS_TRENDS",
  "INSTAGRAM_GRAPH_API",
  "INSTAGRAM_PROFESSIONAL_DASHBOARD",
  "META_AD_LIBRARY",
  "META_BUSINESS_SUITE",
  "META_CREATOR_MARKETPLACE",
  "OWNED_UPLOAD",
  "MANUAL_RESEARCH",
  "DEMO",
]);

function mapOperationalSourceKind(kind: string): SourceRecord["kind"] {
  return operationalSourceKinds.has(kind as SourceRecord["kind"])
    ? (kind as SourceRecord["kind"])
    : "MANUAL_RESEARCH";
}

function mapSource(source: SourceRecordPayload): SourceRecord {
  const latestSnapshot = source.snapshots[0];

  return {
    id: source.id,
    title: source.title,
    kind: mapOperationalSourceKind(source.kind),
    origin: source.origin,
    url: source.url ?? undefined,
    collectedAt: (latestSnapshot?.collectedAt ?? source.updatedAt).toISOString(),
    market: source.market,
    confidence: lowerBand(source.confidence),
    evidenceCount: source._count.evidence,
    coverage: source.coverage ?? undefined,
    freshness: source.freshness ?? undefined,
    gap: source.gap ?? undefined,
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

function mapHistoryItem(item: SignalRecordPayload["auditEvents"][number]): SignalHistoryItem {
  const tone = ["acid", "aqua", "coral", "gold", "violet"].includes(item.tone)
    ? (item.tone as SignalHistoryItem["tone"])
    : "violet";

  return {
    label: item.label,
    value: item.value,
    tone,
  };
}

function mapBatch(batch: BatchRecordPayload): IngestionBatchSummary {
  return {
    id: batch.id,
    title: batch.title,
    kind: batch.kind,
    status: batch.status,
    market: batch.market,
    origin: batch.origin,
    itemCount: batch.itemCount,
    createdAt: batch.createdAt.toISOString(),
    completedAt: batch.completedAt?.toISOString(),
    error: batch.error ?? undefined,
    sourceTitle: batch.source?.title,
    requestTitle: batch.request?.title,
    signalTitles: batch.signals.map((signal) => signal.title),
    evidenceTitles: batch.evidence.map((item) => item.title),
    snapshotCount: batch.snapshots.length,
    jobCount: batch.jobRuns.length,
    steps: batch.steps.map((step) => ({
      name: step.name,
      status: step.status,
      error: step.error ?? undefined,
    })),
  };
}

export function mapSignal(signal: SignalRecordPayload): TrendSignal {
  const latestScore = signal.scores[0];
  const scoreInput = latestScore
    ? {
        velocity7d: latestScore.velocity7d,
        acceleration: latestScore.acceleration,
        brazilFit: latestScore.brazilFit,
        usTransferability: latestScore.usTransferability,
        formatRepeatability: latestScore.formatRepeatability,
        creatorSignal: latestScore.creatorSignal,
        audioCommercialUsable: latestScore.audioCommercialUsable,
        revivalStrength: latestScore.revivalStrength,
        evidenceQuality: latestScore.evidenceQuality,
        riskPenalty: latestScore.riskPenalty,
      }
    : {
        velocity7d: 0,
        acceleration: 0,
        brazilFit: 0,
        usTransferability: 0,
        formatRepeatability: 0,
        creatorSignal: 0,
        audioCommercialUsable: 0,
        revivalStrength: 0,
        evidenceQuality: 0,
        riskPenalty: 0,
      };
  const calculated = calculateTrendScore(scoreInput);
  const band = latestScore ? lowerBand(latestScore.confidence) : calculated.band;

  return {
    id: signal.id,
    title: signal.title,
    summary: signal.summary,
    type: signal.type,
    market: signal.market,
    audience: signal.audience,
    status: lowerValue<TrendSignal["status"]>(signal.status === "ARCHIVED" ? "WATCH" : signal.status),
    priority: lowerValue<TrendSignal["priority"]>(signal.priority),
    riskLevel: lowerValue<TrendSignal["riskLevel"]>(signal.riskLevel),
    stage: lowerValue<TrendSignal["stage"]>(signal.stage),
    strength: signal.strength,
    trendWindow: signal.trendWindow ?? "sem janela definida",
    decision: signal.decision ?? "Aguardar evidência adicional antes de acionar.",
    nextAction: signal.nextAction ?? "Registrar próxima ação manual.",
    saved: signal.decisionQueueItems.length > 0,
    origin: signal.origin,
    scoreInput,
    score: {
      value: latestScore?.score ?? calculated.value,
      band,
      label: scoreLabel(band),
      riskAdjusted: scoreInput.riskPenalty > 0,
    },
    source: mapSource(signal.source),
    tags: stringArray(signal.tags),
    evidence: signal.evidence.map((item) => ({
      id: item.id,
      title: item.title,
      sourceLabel: item.excerpt ?? signal.source.title,
      quality: lowerBand(item.quality),
      timestamp: item.capturedAt.toISOString(),
      note: item.note ?? item.excerpt ?? "Evidência sem nota adicional.",
    })),
    history: signal.auditEvents.map(mapHistoryItem),
    scoreDrivers: stringArray(signal.scoreDrivers),
  };
}

function mapTenant(context: TenantContext): CommandCenterData["tenant"] {
  return {
    userEmail: context.userEmail,
    userName: context.userName,
    workspaceName: context.workspaceName,
    workspaceSlug: context.workspaceSlug,
    role: context.role,
  };
}

export async function getCommandCenterData(context: TenantContext): Promise<CommandCenterData> {
  try {
    const prisma = getPrisma();
    const videoWhere = { workspaceId: context.workspaceId };
    const [
      signals,
      sources,
      trendSources,
      connectors,
      requests,
      batches,
      jobs,
      videoStats,
      videoMarketCounts,
      videoEvidenceCount,
    ] = await Promise.all([
      prisma.signal.findMany({
        where: { workspaceId: context.workspaceId },
        include: signalInclude,
        orderBy: [{ priority: "asc" }, { strength: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.source.findMany({
        where: { workspaceId: context.workspaceId },
        include: sourceInclude,
        orderBy: [{ market: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.trendSource.findMany({
        where: { workspaceId: context.workspaceId },
        orderBy: [{ platform: "asc" }, { sourceType: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.connector.findMany({
        where: { workspaceId: context.workspaceId },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 8,
      }),
      prisma.ingestRequest.findMany({
        where: { workspaceId: context.workspaceId },
        orderBy: { submittedAt: "desc" },
        take: 6,
      }),
      prisma.importBatch.findMany({
        where: { workspaceId: context.workspaceId },
        include: batchInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.jobRun.findMany({
        where: { workspaceId: context.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.video.aggregate({
        where: videoWhere,
        _count: { _all: true },
        _avg: { trendScore: true },
      }),
      prisma.video.groupBy({
        by: ["market"],
        where: videoWhere,
        _count: { _all: true },
      }),
      prisma.trendEvidence.count({
        where: { workspaceId: context.workspaceId, videoId: { not: null } },
      }),
    ]);
    const reelStats: ReelStatsData = {
      total: videoStats._count._all,
      br: videoMarketCounts.find((item) => item.market === "BR")?._count._all ?? 0,
      us: videoMarketCounts.find((item) => item.market === "US")?._count._all ?? 0,
      avgScore: Math.round(videoStats._avg.trendScore ?? 0),
      evidenceCount: videoEvidenceCount,
    };
    let currentSignals = signals;

    if (currentSignals.length === 0 && reelStats.total > 0) {
      const promotedCount = await promoteImportedReelsToSignals(context, 3);

      if (promotedCount > 0) {
        currentSignals = await prisma.signal.findMany({
          where: { workspaceId: context.workspaceId },
          include: signalInclude,
          orderBy: [{ priority: "asc" }, { strength: "desc" }, { updatedAt: "desc" }],
        });
      }
    }

    const ingestionLab: IngestionLabData = {
      connectors: connectors.map((connector) => ({
        id: connector.id,
        title: connector.title,
        slug: connector.slug,
        kind: connector.kind,
        origin: connector.origin,
        status: connector.status,
        market: connector.market ?? undefined,
        manualEntryEnabled: connector.manualEntryEnabled,
      })),
      requests: requests.map((request) => ({
        id: request.id,
        title: request.title,
        type: request.type,
        status: request.status,
        market: request.market,
        origin: request.origin,
        submittedAt: request.submittedAt.toISOString(),
        error: request.error ?? undefined,
      })),
      batches: batches.map(mapBatch),
      jobs: jobs.map((job) => ({
        id: job.id,
        name: job.name,
        status: job.status,
        stage: job.stage ?? undefined,
        startedAt: job.startedAt?.toISOString(),
        finishedAt: job.finishedAt?.toISOString(),
        error: job.error ?? undefined,
      })),
      stats: {
        approvedConnectors: connectors.filter((connector) => connector.status === "APPROVED").length,
        openRequests: requests.filter((request) => request.status === "QUEUED" || request.status === "RUNNING").length,
        failedBatches: batches.filter((batch) => batch.status === "FAILED").length,
        succeededBatches: batches.filter((batch) => batch.status === "SUCCEEDED").length,
      },
    };

    if (currentSignals.length === 0) {
      return {
        signals: [],
        sources: sources.map(mapSource),
        trendSources: trendSources.map(mapTrendSource),
        persistence: {
          mode: "database",
          label: reelStats.total > 0 ? "Postgres real" : "Postgres vazio",
          detail: reelStats.total > 0
            ? `${reelStats.total} Reels carregados do workspace ${context.workspaceName}; sinais estrategicos ainda nao foram gerados.`
            : "Postgres gerenciado ativo, sem sinais persistidos ainda. Use o Ingestion Lab para criar o primeiro sinal real.",
        },
        ingestionLab,
        reelStats,
        tenant: mapTenant(context),
      };
    }

    return {
      signals: currentSignals.map(mapSignal),
      sources: sources.map(mapSource),
      trendSources: trendSources.map(mapTrendSource),
      persistence: {
        mode: "database",
        label: "Postgres real",
        detail: `Sinais, evidências, fila de decisão, jobs e auditoria carregados do workspace ${context.workspaceName}.`,
      },
      ingestionLab,
      reelStats,
      tenant: mapTenant(context),
    };
  } catch (error) {
    console.error("[persistence] command center unavailable", error);
    return {
      signals: [],
      sources: [],
      trendSources: [],
      persistence: {
        mode: "error-fallback",
        label: "banco indisponível",
        detail: "Postgres não respondeu. Fallback isolado: nenhum insight fictício foi carregado.",
      },
      ingestionLab: emptyIngestionLab,
      reelStats: emptyReelStats,
      tenant: mapTenant(context),
    };
  }
}

export async function toggleSavedSignal(signalId: string, context: TenantContext) {
  const prisma = getPrisma();
  const signal = await prisma.signal.findFirst({
    where: { id: signalId, workspaceId: context.workspaceId },
    select: { id: true },
  });

  if (!signal) {
    return { ok: false, saved: false, reason: "signal_not_found" };
  }

  const existing = await prisma.decisionQueueItem.findUnique({
    where: { workspaceId_signalId: { workspaceId: context.workspaceId, signalId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.decisionQueueItem.delete({
        where: { workspaceId_signalId: { workspaceId: context.workspaceId, signalId } },
      }),
      prisma.auditEvent.create({
        data: {
          type: "DECISION_REMOVED",
          workspaceId: context.workspaceId,
          signalId,
          label: "workspace",
          value: "removido",
          tone: "violet",
          message: "Sinal removido da fila de decisão.",
          actor: context.userEmail,
        },
      }),
    ]);

    return { ok: true, saved: false };
  }

  await prisma.$transaction([
    prisma.decisionQueueItem.create({
      data: {
        workspaceId: context.workspaceId,
        signalId,
        label: "Fila de decisão",
        notes: "Criado pela UI com persistência Postgres.",
      },
    }),
    prisma.auditEvent.create({
      data: {
        type: "DECISION_QUEUED",
        workspaceId: context.workspaceId,
        signalId,
        label: "workspace",
        value: "salvo",
        tone: "acid",
        message: "Sinal salvo na fila de decisão.",
        actor: context.userEmail,
      },
    }),
  ]);

  return { ok: true, saved: true };
}
