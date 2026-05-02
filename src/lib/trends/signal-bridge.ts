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

function signalType(video: SignalVideo) {
  if (video.soundId) {
    return "AUDIO" as const;
  }

  if (video.creatorId) {
    return "CREATOR" as const;
  }

  if (video.hashtags.length > 0) {
    return "HASHTAG" as const;
  }

  return "FORMAT" as const;
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

function buildSignalCopy(video: SignalVideo) {
  const handle = video.creator?.handle ? `@${video.creator.handle}` : video.source.title;
  const views = formatCompactCount(video.currentViewCount);
  const title = `Reel em alta: ${handle}`;
  const summary = `Reel real importado com ${views} visualizacoes e score ${video.trendScore}. Use como sinal de formato, criador ou gancho antes de adaptar.`;
  const decision = video.trendScore >= 70
    ? "Priorizar analise do gancho, formato e promessa antes de adaptar para o radar BR."
    : "Manter em observacao e comparar com outros Reels antes de transformar em acao.";
  const nextAction = "Abrir o Reel, revisar caption/audio/estrutura e registrar a hipotese criativa com fonte vinculada.";

  return {
    title,
    summary,
    audience: video.market === "BR" ? "Radar Brasil" : "Early signal EUA",
    trendWindow: video.postedAt ? "validar nas proximas 24-48h" : "snapshot importado; validar recencia manualmente",
    decision,
    nextAction,
  };
}

function signalTags(video: SignalVideo) {
  const tags = [
    "reel-real",
    video.market.toLowerCase(),
    `score-${video.trendScore}`,
    video.creator?.handle ? `@${video.creator.handle}` : undefined,
    ...video.hashtags.slice(0, 4).map((item) => `#${item.hashtag.tag}`),
  ];

  return tags.filter((tag): tag is string => Boolean(tag));
}

async function upsertSignalForVideo(tx: Tx, context: TenantContext, video: SignalVideo) {
  const dedupeKey = signalKey(video);
  const existing = await tx.signal.findUnique({
    where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey } },
    select: { id: true, lastIngestedAt: true },
  });

  if (existing?.lastIngestedAt && existing.lastIngestedAt >= video.updatedAt) {
    return { signalId: existing.id, changed: false };
  }

  const copy = buildSignalCopy(video);
  const input = scoreInputForVideo(video);
  const confidence = confidenceForScore(video.trendScore);
  const now = new Date();
  const latestEvidence = video.evidence[0];
  const createOrUpdate = {
    title: copy.title,
    summary: copy.summary,
    type: signalType(video),
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
    tags: signalTags(video),
    scoreDrivers: [
      "Reel importado",
      `${formatCompactCount(video.currentViewCount)} views`,
      `score ${video.trendScore}`,
      video.market,
    ],
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
      modelVersion: "score-v0.1-reel-bridge",
      explanation: "Signal derivado de Reel real importado, usando metricas e score ja persistidos.",
    },
  });

  await tx.evidence.upsert({
    where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey: evidenceKey(video) } },
    update: {
      signalId: signal.id,
      sourceId: video.sourceId,
      importBatchId: video.importBatchId,
      jobRunId: video.jobRunId,
      title: latestEvidence?.title ?? compactText(video.title, "Reel importado"),
      url: latestEvidence?.url ?? video.url,
      excerpt: compactText(video.caption, video.title, 180),
      note: latestEvidence?.note ?? `Reel real com ${formatCompactCount(video.currentViewCount)} visualizacoes no momento da coleta.`,
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
      title: latestEvidence?.title ?? compactText(video.title, "Reel importado"),
      url: latestEvidence?.url ?? video.url,
      excerpt: compactText(video.caption, video.title, 180),
      note: latestEvidence?.note ?? `Reel real com ${formatCompactCount(video.currentViewCount)} visualizacoes no momento da coleta.`,
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
