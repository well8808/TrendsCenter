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

export type PersistenceMode = "database" | "empty-fallback" | "error-fallback";

export interface PersistenceState {
  mode: PersistenceMode;
  label: string;
  detail: string;
}

export interface CommandCenterData {
  signals: TrendSignal[];
  sources: SourceRecord[];
  persistence: PersistenceState;
}

const fallbackData: CommandCenterData = {
  signals: demoSignals,
  sources: sourceQueue,
  persistence: {
    mode: "error-fallback",
    label: "fallback demo",
    detail: "Banco local indisponivel; exibindo fixtures demo/mock.",
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
    const [signals, sources] = await Promise.all([
      prisma.trendSignal.findMany({
        include: signalInclude,
        orderBy: [{ priority: "asc" }, { strength: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.source.findMany({
        include: sourceInclude,
        orderBy: [{ market: "asc" }, { updatedAt: "desc" }],
      }),
    ]);

    if (signals.length === 0) {
      return {
        signals: demoSignals,
        sources: sourceQueue,
        persistence: {
          mode: "empty-fallback",
          label: "banco vazio",
          detail: "SQLite local ativo, sem sinais persistidos; exibindo demo/mock.",
        },
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
        notes: "Criado pela UI local da Fase 3A.",
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
