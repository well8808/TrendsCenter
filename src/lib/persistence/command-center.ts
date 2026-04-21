import type { Prisma } from "@prisma/client";

import { demoSignals, sourceQueue } from "@/lib/demo-data";
import { getPrisma } from "@/lib/db";
import { calculateTrendScore } from "@/lib/scoring";
import type {
  ConfidenceBand,
  SignalHistoryItem,
  SourceRecord,
  TrendSignal,
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
  history: {
    orderBy: { eventAt: "desc" as const },
  },
  scores: {
    orderBy: { calculatedAt: "desc" as const },
    take: 1,
  },
  savedBy: true,
} satisfies Prisma.TrendSignalInclude;

type SourceRecordPayload = Prisma.SourceGetPayload<{ include: typeof sourceInclude }>;
type SignalRecordPayload = Prisma.TrendSignalGetPayload<{ include: typeof signalInclude }>;

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

export interface CommandCenterData {
  signals: TrendSignal[];
  sources: SourceRecord[];
  persistence: PersistenceState;
  ingestionLab: IngestionLabData;
}

const fallbackData: CommandCenterData = {
  signals: demoSignals,
  sources: sourceQueue,
  persistence: {
    mode: "error-fallback",
    label: "fallback demo",
    detail: "Banco persistente indisponivel; exibindo fixtures demo/mock.",
  },
  ingestionLab: {
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
  },
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

function mapSource(source: SourceRecordPayload): SourceRecord {
  const latestSnapshot = source.snapshots[0];

  return {
    id: source.id,
    title: source.title,
    kind: source.kind,
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

function mapHistoryItem(item: SignalRecordPayload["history"][number]): SignalHistoryItem {
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
    decision: signal.decision ?? "Aguardar evidencia adicional antes de acionar.",
    nextAction: signal.nextAction ?? "Registrar proxima acao manual.",
    saved: signal.savedBy.length > 0,
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
      note: item.note ?? item.excerpt ?? "Evidencia sem nota adicional.",
    })),
    history: signal.history.map(mapHistoryItem),
    scoreDrivers: stringArray(signal.scoreDrivers),
  };
}

export async function getCommandCenterData(): Promise<CommandCenterData> {
  try {
    const prisma = getPrisma();
    const [signals, sources, connectors, requests, batches, jobs] = await Promise.all([
      prisma.trendSignal.findMany({
        include: signalInclude,
        orderBy: [{ priority: "asc" }, { strength: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.source.findMany({
        include: sourceInclude,
        orderBy: [{ market: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.sourceConnector.findMany({
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 8,
      }),
      prisma.ingestRequest.findMany({
        orderBy: { submittedAt: "desc" },
        take: 6,
      }),
      prisma.importBatch.findMany({
        include: batchInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.jobRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
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

    if (signals.length === 0) {
      return {
        signals: demoSignals,
        sources: sourceQueue,
        persistence: {
          mode: "empty-fallback",
          label: "banco vazio",
          detail: "SQLite local ativo, sem sinais persistidos; exibindo demo/mock.",
        },
        ingestionLab,
      };
    }

    return {
      signals: signals.map(mapSignal),
      sources: sources.map(mapSource),
      persistence: {
        mode: "database",
        label: "SQLite local",
        detail: "Sinais, evidencias, historico e saved carregados do banco local.",
      },
      ingestionLab,
    };
  } catch (error) {
    console.error("[persistence] command center fallback", error);
    return fallbackData;
  }
}

export async function toggleSavedSignal(signalId: string) {
  const prisma = getPrisma();
  const signal = await prisma.trendSignal.findUnique({
    where: { id: signalId },
    select: { id: true },
  });

  if (!signal) {
    return { ok: false, saved: false, reason: "signal_not_found" };
  }

  const existing = await prisma.workspaceSavedSignal.findUnique({
    where: { signalId },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.workspaceSavedSignal.delete({
        where: { signalId },
      }),
      prisma.signalHistoryEvent.create({
        data: {
          signalId,
          label: "workspace",
          value: "removido",
          tone: "violet",
        },
      }),
    ]);

    return { ok: true, saved: false };
  }

  await prisma.$transaction([
    prisma.workspaceSavedSignal.create({
      data: {
        signalId,
        label: "Saved local",
        notes: "Criado pela UI local da Fase 3B.",
      },
    }),
    prisma.signalHistoryEvent.create({
      data: {
        signalId,
        label: "workspace",
        value: "salvo",
        tone: "acid",
      },
    }),
  ]);

  return { ok: true, saved: true };
}
