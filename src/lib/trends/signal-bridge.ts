import type { Prisma } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

const signalVideoInclude = {
  source: true,
  creator: true,
  sound: true,
  hashtags: {
    include: {
      hashtag: true,
    },
  },
  evidence: {
    orderBy: { capturedAt: "desc" as const },
    take: 1,
  },
  _count: {
    select: {
      evidence: true,
      snapshots: true,
    },
  },
} satisfies Prisma.VideoInclude;

type Tx = Prisma.TransactionClient;
type SignalVideo = Prisma.VideoGetPayload<{ include: typeof signalVideoInclude }>;

const signalScoreModelVersion = "score-v0.2-signal-intelligence-v1";

type OpportunityKind =
  | "authority_news"
  | "entertainment"
  | "debate"
  | "tutorial"
  | "audio_trend"
  | "public_creator"
  | "replicable_format"
  | "high_traction";

interface SignalOpportunityInput {
  title: string;
  caption?: string | null;
  creatorHandle?: string | null;
  sourceTitle: string;
  soundTitle?: string | null;
  hashtags: string[];
  viewCount: bigint;
  score: number;
  market: "BR" | "US";
  hasSound: boolean;
}

interface SignalOpportunity {
  kind: OpportunityKind;
  label: string;
  type: "AUDIO" | "FORMAT" | "HASHTAG" | "CREATOR" | "REVIVAL" | "US_TO_BR";
  title: string;
  reason: string;
  decision: string;
  nextAction: string;
  evidenceTitle: string;
  evidenceNote: string;
  tags: string[];
  scoreDrivers: string[];
}

function signalKey(video: SignalVideo) {
  return `reel-signal:${video.dedupeKey}`;
}

function evidenceKey(video: SignalVideo) {
  return `reel-signal-evidence:${video.dedupeKey}`;
}

function compactText(value: string | null | undefined, fallback: string, max = 118) {
  const text = value?.replace(/\s+/g, " ").trim() || fallback;

  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function formatCompactCount(value: bigint) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "0";
  }

  if (number >= 1_000_000) {
    return `${Math.round(number / 100_000) / 10} mi`;
  }

  if (number >= 1_000) {
    return `${Math.round(number / 100) / 10} mil`;
  }

  return String(Math.round(number));
}

function normalizeText(...values: Array<string | null | undefined>) {
  return values
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasAny(textValue: string, terms: string[]) {
  return terms.some((term) => textValue.includes(term));
}

function compactHandle(input: SignalOpportunityInput) {
  return input.creatorHandle ? `@${input.creatorHandle}` : input.sourceTitle;
}

export function classifySignalOpportunity(input: SignalOpportunityInput): SignalOpportunity {
  const textValue = normalizeText(input.title, input.caption, input.hashtags.join(" "), input.soundTitle);
  const views = formatCompactCount(input.viewCount);
  const handle = compactHandle(input);
  const traction = `${views} views, score ${input.score}, mercado ${input.market}`;

  let kind: OpportunityKind = "replicable_format";
  let label = "Formato replicavel";
  let type: SignalOpportunity["type"] = "FORMAT";
  let trigger = "estrutura do Reel pode ser quebrada em gancho, promessa, prova e fechamento";

  if (hasAny(textValue, ["breaking", "news", "noticia", "report", "official", "anuncia", "confirmou", "alerta"])) {
    kind = "authority_news";
    label = "Autoridade/noticia";
    type = "CREATOR";
    trigger = "caption sugere noticia, autoridade ou acontecimento com valor de timing";
  } else if (hasAny(textValue, ["controvers", "debate", "critic", "vs", "versus", "treta", "polemica", "respondeu"])) {
    kind = "debate";
    label = "Polemica/debate";
    type = "FORMAT";
    trigger = "texto indica conflito, comparacao ou discussao que pode puxar comentarios";
  } else if (hasAny(textValue, ["how to", "tutorial", "passo", "dica", "aprenda", "guia", "como fazer", "hack", "tips"])) {
    kind = "tutorial";
    label = "Tutorial/educativo";
    type = "FORMAT";
    trigger = "conteudo parece ensinar ou demonstrar um processo reutilizavel";
  } else if (hasAny(textValue, ["celebrity", "superstar", "creator", "influencer", "atleta", "artista", "famos", "omar", "wwe", "wrestlemania"])) {
    kind = "public_creator";
    label = "Creator/figura publica";
    type = "CREATOR";
    trigger = "Reel usa figura publica, fandom ou reconhecimento imediato como motor de atencao";
  } else if (input.hasSound && hasAny(textValue, ["audio", "sound", "song", "musica", "trend", "remix", "viral"])) {
    kind = "audio_trend";
    label = "Tendencia de audio";
    type = "AUDIO";
    trigger = "ha sinal de audio/som conectado ao desempenho do Reel";
  } else if (hasAny(textValue, ["fans", "surprise", "surprised", "meme", "funny", "comedy", "reaction", "react", "humor"])) {
    kind = "entertainment";
    label = "Entretenimento";
    type = "FORMAT";
    trigger = "caption aponta entretenimento, reacao ou momento de fandom facil de adaptar";
  } else if (input.score >= 70 || input.viewCount >= BigInt(1_000_000)) {
    kind = "high_traction";
    label = "Alta tracao";
    type = input.creatorHandle ? "CREATOR" : "FORMAT";
    trigger = "metricas indicam tracao forte mesmo sem categoria textual dominante";
  } else if (input.hasSound) {
    kind = "audio_trend";
    label = "Tendencia de audio";
    type = "AUDIO";
    trigger = "Reel tem audio associado e pode abrir teste de som/formato";
  }

  const title = `${label}: ${handle}`;
  const reason = `${trigger}. Evidencia real: ${traction}.`;
  const decision = input.score >= 70
    ? `Priorizar leitura do gancho e adaptar o padrao de ${label.toLowerCase()} para um teste BR.`
    : `Manter como sinal ${label.toLowerCase()} e comparar com mais Reels antes de virar aposta principal.`;
  const nextAction = kind === "audio_trend"
    ? "Verificar se o audio pode ser usado comercialmente; se sim, testar variacao curta com fonte registrada."
    : kind === "tutorial"
      ? "Quebrar o passo a passo em roteiro curto e validar se existe prova visual suficiente."
      : "Abrir o Reel, mapear gancho/caption/estrutura e registrar uma hipotese criativa com fonte vinculada.";
  const evidenceTitle = `${label}: ${compactText(input.title, "Reel importado", 72)}`;
  const evidenceNote = `${reason} URL e metricas foram preservadas na coleta licenciada.`;
  const tags = [
    "reel-real",
    input.market.toLowerCase(),
    kind.replace("_", "-"),
    `score-${input.score}`,
    input.creatorHandle ? `@${input.creatorHandle}` : undefined,
    ...input.hashtags.slice(0, 4).map((tag) => `#${tag}`),
  ].filter((tag): tag is string => Boolean(tag));
  const scoreDrivers = [
    label,
    `${views} views`,
    `score ${input.score}`,
    input.market,
    input.hasSound ? "audio conectado" : "sem audio priorizado",
  ];

  return {
    kind,
    label,
    type,
    title,
    reason,
    decision,
    nextAction,
    evidenceTitle,
    evidenceNote,
    tags,
    scoreDrivers,
  };
}

function priorityForScore(score: number) {
  if (score >= 78) {
    return "NOW" as const;
  }

  if (score >= 60) {
    return "NEXT" as const;
  }

  if (score >= 42) {
    return "WATCH" as const;
  }

  return "HOLD" as const;
}

function statusForScore(score: number) {
  if (score >= 78) {
    return "RISING" as const;
  }

  return "WATCH" as const;
}

function stageForScore(score: number) {
  if (score >= 78) {
    return "ACCELERATING" as const;
  }

  if (score >= 60) {
    return "PROVING" as const;
  }

  return "MONITOR" as const;
}

function confidenceForScore(score: number) {
  if (score >= 78) {
    return "HIGH" as const;
  }

  if (score >= 52) {
    return "MEDIUM" as const;
  }

  return "LOW" as const;
}

function scoreInputForVideo(video: SignalVideo) {
  const hashtagBoost = Math.min(video.hashtags.length * 8, 24);
  const sourceBoost = video.origin === "OFFICIAL" ? 78 : video.origin === "OWNED" ? 68 : 58;
  const creatorSignal = video.currentViewCount >= BigInt(1_000_000) ? 76 : video.creatorId ? 58 : 38;

  return {
    velocity7d: video.velocityScore,
    acceleration: video.accelerationScore,
    brazilFit: video.market === "BR" ? 78 : 46,
    usTransferability: video.market === "US" ? 72 : 38,
    formatRepeatability: Math.min(52 + hashtagBoost + (video.soundId ? 10 : 0), 88),
    creatorSignal,
    audioCommercialUsable: video.sound?.isCommerciallyUsable ? 72 : 36,
    revivalStrength: /revival|nostalgia|throwback|memoria|lembran/i.test(`${video.title} ${video.caption ?? ""}`) ? 68 : 28,
    evidenceQuality: Math.min(44 + video._count.evidence * 18 + sourceBoost / 5, 88),
    riskPenalty: 0,
  };
}

function analyzeVideo(video: SignalVideo) {
  const opportunity = classifySignalOpportunity({
    title: video.title,
    caption: video.caption,
    creatorHandle: video.creator?.handle,
    sourceTitle: video.source.title,
    soundTitle: video.sound?.title,
    hashtags: video.hashtags.map((item) => item.hashtag.tag),
    viewCount: video.currentViewCount,
    score: video.trendScore,
    market: video.market,
    hasSound: Boolean(video.soundId),
  });

  return {
    ...opportunity,
    summary: `${opportunity.reason} Use como sinal de decisao, nao como conclusao final.`,
    audience: video.market === "BR" ? "Radar Brasil" : "Early signal EUA",
    trendWindow: video.postedAt ? "validar nas proximas 24-48h" : "snapshot importado; validar recencia manualmente",
  };
}

async function upsertSignalForVideo(tx: Tx, context: TenantContext, video: SignalVideo) {
  const dedupeKey = signalKey(video);
  const existing = await tx.signal.findUnique({
    where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey } },
    select: {
      id: true,
      lastIngestedAt: true,
      scores: {
        orderBy: { calculatedAt: "desc" },
        select: { modelVersion: true },
        take: 1,
      },
    },
  });

  if (
    existing?.lastIngestedAt &&
    existing.lastIngestedAt >= video.updatedAt &&
    existing.scores[0]?.modelVersion === signalScoreModelVersion
  ) {
    return { signalId: existing.id, changed: false };
  }

  const copy = analyzeVideo(video);
  const input = scoreInputForVideo(video);
  const confidence = confidenceForScore(video.trendScore);
  const now = new Date();
  const latestEvidence = video.evidence[0];
  const createOrUpdate = {
    title: copy.title,
    summary: copy.summary,
    type: copy.type,
    market: video.market,
    audience: copy.audience,
    status: statusForScore(video.trendScore),
    priority: priorityForScore(video.trendScore),
    riskLevel: "LOW" as const,
    stage: stageForScore(video.trendScore),
    strength: video.trendScore,
    trendWindow: copy.trendWindow,
    decision: copy.decision,
    nextAction: copy.nextAction,
    tags: copy.tags,
    scoreDrivers: copy.scoreDrivers,
    dedupeKey,
    importBatchId: video.importBatchId,
    lastIngestedAt: video.updatedAt,
    processedAt: now,
    origin: video.origin,
    sourceId: video.sourceId,
    confidence,
    isDemo: video.isDemo,
  } satisfies Prisma.SignalUncheckedUpdateInput;

  const signal = existing
    ? await tx.signal.update({
        where: { id: existing.id, workspaceId: context.workspaceId },
        data: createOrUpdate,
      })
    : await tx.signal.create({
        data: {
          workspaceId: context.workspaceId,
          ...createOrUpdate,
        },
      });

  await tx.signalScore.create({
    data: {
      workspaceId: context.workspaceId,
      signalId: signal.id,
      score: video.trendScore,
      confidence,
      velocity7d: input.velocity7d,
      acceleration: input.acceleration,
      brazilFit: input.brazilFit,
      usTransferability: input.usTransferability,
      formatRepeatability: input.formatRepeatability,
      creatorSignal: input.creatorSignal,
      audioCommercialUsable: input.audioCommercialUsable,
      revivalStrength: input.revivalStrength,
      evidenceQuality: input.evidenceQuality,
      riskPenalty: input.riskPenalty,
      modelVersion: signalScoreModelVersion,
      explanation: copy.reason,
    },
  });

  await tx.evidence.upsert({
    where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey: evidenceKey(video) } },
    update: {
      signalId: signal.id,
      sourceId: video.sourceId,
      importBatchId: video.importBatchId,
      jobRunId: video.jobRunId,
      title: copy.evidenceTitle,
      url: latestEvidence?.url ?? video.url,
      excerpt: compactText(video.caption, video.title, 180),
      note: copy.evidenceNote,
      quality: confidence,
      capturedAt: video.collectedAt,
    },
    create: {
      workspaceId: context.workspaceId,
      signalId: signal.id,
      sourceId: video.sourceId,
      importBatchId: video.importBatchId,
      jobRunId: video.jobRunId,
      dedupeKey: evidenceKey(video),
      title: copy.evidenceTitle,
      url: latestEvidence?.url ?? video.url,
      excerpt: compactText(video.caption, video.title, 180),
      note: copy.evidenceNote,
      quality: confidence,
      capturedAt: video.collectedAt,
      isDemo: video.isDemo,
    },
  });

  await tx.signalObservation.create({
    data: {
      workspaceId: context.workspaceId,
      signalId: signal.id,
      observedAt: video.collectedAt,
      viewCount: video.currentViewCount,
      likeCount: video.currentLikeCount,
      commentCount: video.currentCommentCount,
      shareCount: video.currentShareCount,
      rawMetrics: {
        videoId: video.id,
        sourceId: video.sourceId,
        url: video.url,
        trendScore: video.trendScore,
        growthViews: video.growthViews.toString(),
      },
    },
  });

  const evidenceCount = await tx.evidence.count({
    where: { workspaceId: context.workspaceId, signalId: signal.id },
  });

  await tx.signal.update({
    where: { id: signal.id, workspaceId: context.workspaceId },
    data: { evidenceCount },
  });

  await tx.auditEvent.create({
    data: {
      type: existing ? "SIGNAL_UPDATED" : "SIGNAL_CREATED",
      workspaceId: context.workspaceId,
      signalId: signal.id,
      sourceId: video.sourceId,
      importBatchId: video.importBatchId,
      jobRunId: video.jobRunId,
      label: existing ? "reel" : "ponte",
      value: existing ? "atualizado" : "criado",
      tone: video.trendScore >= 60 ? "gold" : "aqua",
      message: existing
        ? "Signal atualizado a partir de Reel real importado."
        : "Signal estrategico criado a partir de Reel real importado.",
      actor: context.userEmail,
      metadata: {
        videoId: video.id,
        url: video.url,
        trendScore: video.trendScore,
        intelligenceVersion: signalScoreModelVersion,
        opportunityKind: copy.kind,
        reason: copy.reason,
      },
    },
  });

  return { signalId: signal.id, changed: true };
}

export async function promoteImportedReelToSignal(tx: Tx, context: TenantContext, videoId: string) {
  const video = await tx.video.findFirst({
    where: { id: videoId, workspaceId: context.workspaceId, isDemo: false },
    include: signalVideoInclude,
  });

  if (!video) {
    return { signalId: null, changed: false };
  }

  return upsertSignalForVideo(tx, context, video);
}

export async function promoteImportedReelsToSignals(context: TenantContext, limit = 3) {
  const prisma = getPrisma();
  const videos = await prisma.video.findMany({
    where: { workspaceId: context.workspaceId, isDemo: false },
    include: signalVideoInclude,
    orderBy: [{ trendScore: "desc" }, { lastSeenAt: "desc" }],
    take: Math.max(1, Math.min(limit, 5)),
  });

  if (videos.length === 0) {
    return 0;
  }

  return prisma.$transaction(async (tx) => {
    let changed = 0;

    for (const video of videos) {
      const result = await upsertSignalForVideo(tx, context, video);

      if (result.changed) {
        changed += 1;
      }
    }

    return changed;
  }, { maxWait: 10_000, timeout: 30_000 });
}
