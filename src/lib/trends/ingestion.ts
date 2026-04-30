import type { DataOrigin, Market, Prisma, SourceKind } from "@prisma/client";

import { requirePermission } from "@/lib/auth/authorization";
import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { normalizeForDedupe, stableHash } from "@/lib/ingestion/dedupe";
import { calculateVideoTrendScore } from "@/lib/trends/scoring";

const allowedMarkets: Market[] = ["BR", "US"];
const allowedOrigins: DataOrigin[] = ["MANUAL", "OFFICIAL", "OWNED"];
const allowedSourceKinds: SourceKind[] = [
  "INSTAGRAM_REELS_TRENDS",
  "INSTAGRAM_GRAPH_API",
  "INSTAGRAM_PROFESSIONAL_DASHBOARD",
  "META_AD_LIBRARY",
  "META_BUSINESS_SUITE",
  "META_CREATOR_MARKETPLACE",
  "OWNED_UPLOAD",
  "MANUAL_RESEARCH",
];
const trendStepNames = ["RECEIVE", "VALIDATE", "NORMALIZE", "DEDUPE", "PERSIST", "SCORE", "AUDIT"] as const;
const trendImportTransactionOptions = { maxWait: 10_000, timeout: 45_000 } as const;

type Tx = Prisma.TransactionClient;

interface TrendImportSourceInput {
  sourceTitle: string;
  sourceKind: SourceKind;
  sourceOrigin: DataOrigin;
  market: Market;
  sourceUrl?: string;
  payloadJson: string;
  submittedBy: string;
}

interface NormalizedCreator {
  handle: string;
  displayName?: string;
  profileUrl?: string;
  followerCount?: bigint;
  averageViews?: bigint;
}

interface NormalizedSound {
  title: string;
  authorName?: string;
  soundUrl?: string;
  isCommerciallyUsable?: boolean;
  commercialRightsStatus?: string;
  videoCount?: number;
}

interface NormalizedVideo {
  platformVideoId?: string;
  url?: string;
  title: string;
  caption?: string;
  postedAt?: Date;
  collectedAt: Date;
  viewCount: bigint;
  likeCount: bigint;
  commentCount: bigint;
  shareCount: bigint;
  saveCount: bigint;
  creator?: NormalizedCreator;
  sound?: NormalizedSound;
  hashtags: string[];
  evidence: {
    title: string;
    url?: string;
    excerpt?: string;
    note?: string;
  };
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const item = text(value);

  return item || undefined;
}

function bigintValue(value: unknown) {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.max(0, Math.round(value)));
  }

  if (typeof value === "string" && value.trim() && /^\d+$/.test(value.trim())) {
    return BigInt(value.trim());
  }

  return BigInt(0);
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string" && value.trim() && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }

  return undefined;
}

function dateValue(value: unknown) {
  const item = text(value);

  if (!item) {
    return undefined;
  }

  const parsed = new Date(item);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseEnum<T extends string>(value: string, allowed: T[], fallback: T) {
  return allowed.includes(value as T) ? value as T : fallback;
}

function requireText(value: string, label: string) {
  const item = value.trim();

  if (!item) {
    throw new Error(`${label} obrigatório.`);
  }

  return item;
}

function assertSafeText(...values: string[]) {
  const unsafeMinorPattern = /\b(menor|menores|crianca|criança|infantil|adolescente|teen|underage|minor)\b/i;

  if (values.some((value) => unsafeMinorPattern.test(value))) {
    throw new Error("Conteúdo com menor ou idade ambígua bloqueado pelo safe mode.");
  }
}

function parseVideos(payloadJson: string): NormalizedVideo[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payloadJson);
  } catch {
    throw new Error("JSON inválido. A ingestão foi bloqueada sem persistir insight.");
  }

  const candidate = Array.isArray(parsed) ? parsed : record(parsed).videos;
  const videos = Array.isArray(candidate) ? candidate : [];

  if (videos.length === 0) {
    throw new Error("Nenhum video encontrado no payload.");
  }

  return videos.slice(0, 50).map((raw, index) => {
    const item = record(raw);
    const metrics = record(item.metrics);
    const creator = record(item.creator);
    const sound = record(item.sound);
    const title = requireText(text(item.title) || text(item.caption), `Título do vídeo ${index + 1}`);
    const evidence = record(item.evidence);
    const hashtagsRaw = Array.isArray(item.hashtags) ? item.hashtags : [];
    const hashtags = hashtagsRaw
      .map((tag) => normalizeForDedupe(text(tag).replace(/^#/, "")))
      .filter(Boolean)
      .slice(0, 12);
    const evidenceTitle = requireText(text(evidence.title) || `Evidência ${index + 1}`, "Título da evidência");

    assertSafeText(
      title,
      text(item.caption),
      text(creator.handle),
      text(creator.displayName),
      text(sound.title),
      hashtags.join(" "),
      evidenceTitle,
      text(evidence.note),
    );

    return {
      platformVideoId: optionalText(item.platformVideoId) ?? optionalText(item.id),
      url: optionalText(item.url),
      title,
      caption: optionalText(item.caption),
      postedAt: dateValue(item.postedAt),
      collectedAt: dateValue(item.collectedAt) ?? new Date(),
      viewCount: bigintValue(metrics.views ?? item.views),
      likeCount: bigintValue(metrics.likes ?? item.likes),
      commentCount: bigintValue(metrics.comments ?? item.comments),
      shareCount: bigintValue(metrics.shares ?? item.shares),
      saveCount: bigintValue(metrics.saves ?? item.saves),
      creator: text(creator.handle)
        ? {
            handle: normalizeForDedupe(text(creator.handle).replace(/^@/, "")),
            displayName: optionalText(creator.displayName),
            profileUrl: optionalText(creator.profileUrl) ?? optionalText(creator.url),
            followerCount: bigintValue(creator.followerCount),
            averageViews: bigintValue(creator.averageViews),
          }
        : undefined,
      sound: text(sound.title)
        ? {
            title: text(sound.title),
            authorName: optionalText(sound.authorName) ?? optionalText(sound.author),
            soundUrl: optionalText(sound.soundUrl) ?? optionalText(sound.url),
            isCommerciallyUsable: typeof sound.isCommerciallyUsable === "boolean" ? sound.isCommerciallyUsable : undefined,
            commercialRightsStatus: optionalText(sound.commercialRightsStatus),
            videoCount: numberValue(sound.videoCount),
          }
        : undefined,
      hashtags,
      evidence: {
        title: evidenceTitle,
        url: optionalText(evidence.url) ?? optionalText(item.url),
        excerpt: optionalText(evidence.excerpt),
        note: optionalText(evidence.note) ?? "Evidência importada com proveniência do lote.",
      },
    };
  });
}

function sourceDedupeKey(input: TrendImportSourceInput) {
  return [
    "trend-source",
    input.sourceOrigin.toLowerCase(),
    input.sourceKind.toLowerCase(),
    input.market.toLowerCase(),
    normalizeForDedupe(input.sourceTitle),
  ].join(":");
}

function videoDedupeKey(video: NormalizedVideo, market: Market) {
  const locator = video.platformVideoId ?? video.url ?? `${video.creator?.handle ?? "unknown"}-${video.title}`;

  return ["video", market.toLowerCase(), normalizeForDedupe(locator)].join(":");
}

function creatorDedupeKey(handle: string, market: Market) {
  return ["creator", market.toLowerCase(), normalizeForDedupe(handle)].join(":");
}

function soundDedupeKey(sound: NormalizedSound, market: Market) {
  return ["sound", market.toLowerCase(), normalizeForDedupe(`${sound.title}-${sound.authorName ?? ""}`)].join(":");
}

function hashtagDedupeKey(tag: string, market: Market) {
  return ["hashtag", market.toLowerCase(), normalizeForDedupe(tag)].join(":");
}

async function createSteps(tx: Tx, context: TenantContext, batchId: string, failedStep?: typeof trendStepNames[number]) {
  const now = new Date();

  await tx.ingestionStep.createMany({
    data: trendStepNames.map((name, index) => {
      const failedIndex = failedStep ? trendStepNames.indexOf(failedStep) : -1;
      const status = failedStep && index > failedIndex ? "SKIPPED" : failedStep === name ? "FAILED" : "SUCCEEDED";

      return {
        workspaceId: context.workspaceId,
        batchId,
        name,
        status,
        sequence: index + 1,
        startedAt: now,
        completedAt: now,
        notes: status === "SUCCEEDED" ? "Etapa local concluída." : "Insight não foi promovido.",
      };
    }),
  });
}

async function recordFailure(input: TrendImportSourceInput, context: TenantContext, message: string) {
  const market = parseEnum(input.market, allowedMarkets, "BR");
  const origin = parseEnum(input.sourceOrigin, allowedOrigins, "MANUAL");
  const requestKey = `trend-failed:${stableHash({ input, at: new Date().toISOString() }).slice(0, 24)}`;

  await getPrisma().$transaction(async (tx) => {
    const request = await tx.ingestRequest.create({
      data: {
        workspaceId: context.workspaceId,
        requestKey,
        type: "OFFICIAL_SNAPSHOT",
        status: "FAILED",
        market,
        origin,
        title: input.sourceTitle || "Trend import failed",
        submittedBy: input.submittedBy,
        collectedAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        error: message,
        payload: { externalNetwork: false },
      },
    });
    const batch = await tx.importBatch.create({
      data: {
        workspaceId: context.workspaceId,
        idempotencyKey: requestKey,
        kind: origin === "OFFICIAL" ? "OFFICIAL_SNAPSHOT" : "MANUAL_SIGNAL",
        status: "FAILED",
        market,
        origin,
        requestId: request.id,
        title: input.sourceTitle || "Trend import failed",
        itemCount: 0,
        payloadHash: stableHash(input.payloadJson),
        payload: { externalNetwork: false },
        collectedAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        error: message,
      },
    });

    await tx.jobRun.create({
      data: {
        workspaceId: context.workspaceId,
        name: "trend-video-ingest",
        status: "FAILED",
        stage: "VALIDATE",
        requestId: request.id,
        importBatchId: batch.id,
        payload: { externalNetwork: false },
        startedAt: new Date(),
        finishedAt: new Date(),
        error: message,
      },
    });
    await createSteps(tx, context, batch.id, "VALIDATE");
  });
}

async function ensureSource(tx: Tx, context: TenantContext, input: TrendImportSourceInput) {
  const connectorSlug = input.sourceOrigin === "OFFICIAL"
    ? `official-trend-${input.sourceKind.toLowerCase()}`
    : input.sourceOrigin === "OWNED"
      ? "owned-trend-intake"
      : "manual-trend-intake";
  const connector = await tx.connector.upsert({
    where: { workspaceId_slug: { workspaceId: context.workspaceId, slug: connectorSlug } },
    update: {
      status: "APPROVED",
      market: input.market,
      manualEntryEnabled: true,
    },
    create: {
      workspaceId: context.workspaceId,
      slug: connectorSlug,
      title: input.sourceOrigin === "OFFICIAL" ? `Official trend intake: ${input.sourceKind}` : "Manual trend intake",
      kind: input.sourceKind,
      origin: input.sourceOrigin,
      status: "APPROVED",
      market: input.market,
      manualEntryEnabled: true,
      officialSurface: input.sourceOrigin === "OFFICIAL" ? input.sourceKind : undefined,
      policyNotes: "Core trend search intake sem rede externa automática.",
    },
  });

  return tx.source.upsert({
    where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey: sourceDedupeKey(input) } },
    update: {
      url: input.sourceUrl,
      connectorId: connector.id,
      updatedAt: new Date(),
    },
    create: {
      workspaceId: context.workspaceId,
      title: input.sourceTitle,
      kind: input.sourceKind,
      origin: input.sourceOrigin,
      url: input.sourceUrl,
      market: input.market,
      confidence: input.sourceOrigin === "OFFICIAL" ? "HIGH" : "MEDIUM",
      connectorId: connector.id,
      dedupeKey: sourceDedupeKey(input),
      coverage: "lote de vídeos importado com proveniência rastreável",
      freshness: "snapshot temporal do momento de coleta",
      gap: "sem scraping; origem depende do operador ou superficie oficial registrada",
      notes: "Criado pelo core de busca de trends.",
    },
  });
}

async function runImport(input: TrendImportSourceInput, context: TenantContext) {
  requirePermission(context, "operateSignals");

  if (!allowedOrigins.includes(input.sourceOrigin)) {
    throw new Error("Origem demo/mock não pode entrar no fluxo real.");
  }

  if (!allowedSourceKinds.includes(input.sourceKind)) {
    throw new Error("Superfície de fonte inválida para ingestão de trends.");
  }

  const sourceTitle = requireText(input.sourceTitle, "Fonte");
  const videos = parseVideos(input.payloadJson);
  const requestKey = `trend-video:${sourceDedupeKey({ ...input, sourceTitle })}:${stableHash(input.payloadJson)}`;

  return getPrisma().$transaction(async (tx) => {
    const source = await ensureSource(tx, context, { ...input, sourceTitle });
    const request = await tx.ingestRequest.upsert({
      where: { workspaceId_requestKey: { workspaceId: context.workspaceId, requestKey } },
      update: { status: "RUNNING", processedAt: new Date(), error: null },
      create: {
        workspaceId: context.workspaceId,
        requestKey,
        type: "OFFICIAL_SNAPSHOT",
        status: "RUNNING",
        market: input.market,
        origin: input.sourceOrigin,
        sourceId: source.id,
        title: sourceTitle,
        submittedBy: input.submittedBy,
        collectedAt: new Date(),
        processedAt: new Date(),
        payload: { itemCount: videos.length, externalNetwork: false },
      },
    });
    const batch = await tx.importBatch.upsert({
      where: { workspaceId_idempotencyKey: { workspaceId: context.workspaceId, idempotencyKey: requestKey } },
      update: { status: "RUNNING", processedAt: new Date(), error: null },
      create: {
        workspaceId: context.workspaceId,
        idempotencyKey: requestKey,
        kind: input.sourceOrigin === "OFFICIAL" ? "OFFICIAL_SNAPSHOT" : "MANUAL_SIGNAL",
        status: "RUNNING",
        market: input.market,
        origin: input.sourceOrigin,
        requestId: request.id,
        sourceId: source.id,
        title: `Trend video import: ${sourceTitle}`,
        itemCount: videos.length,
        payloadHash: stableHash(input.payloadJson),
        payload: { itemCount: videos.length, externalNetwork: false },
        collectedAt: new Date(),
        processedAt: new Date(),
      },
    });
    const job = await tx.jobRun.create({
      data: {
        workspaceId: context.workspaceId,
        name: "trend-video-ingest",
        status: "RUNNING",
        stage: "PERSIST",
        requestId: request.id,
        importBatchId: batch.id,
        payload: { itemCount: videos.length, externalNetwork: false },
        startedAt: new Date(),
      },
    });
    const importedVideoIds: string[] = [];

    for (const item of videos) {
      const creator = item.creator
        ? await tx.creator.upsert({
            where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey: creatorDedupeKey(item.creator.handle, input.market) } },
            update: {
              displayName: item.creator.displayName,
              profileUrl: item.creator.profileUrl,
              followerCount: item.creator.followerCount,
              averageViews: item.creator.averageViews,
              sourceId: source.id,
              lastSeenAt: item.collectedAt,
            },
            create: {
              workspaceId: context.workspaceId,
              sourceId: source.id,
              handle: item.creator.handle,
              displayName: item.creator.displayName,
              profileUrl: item.creator.profileUrl,
              market: input.market,
              origin: input.sourceOrigin,
              followerCount: item.creator.followerCount,
              averageViews: item.creator.averageViews,
              dedupeKey: creatorDedupeKey(item.creator.handle, input.market),
              firstSeenAt: item.collectedAt,
              lastSeenAt: item.collectedAt,
            },
          })
        : null;
      const sound = item.sound
        ? await tx.sound.upsert({
            where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey: soundDedupeKey(item.sound, input.market) } },
            update: {
              authorName: item.sound.authorName,
              soundUrl: item.sound.soundUrl,
              isCommerciallyUsable: item.sound.isCommerciallyUsable,
              commercialRightsStatus: item.sound.commercialRightsStatus,
              videoCount: item.sound.videoCount,
              sourceId: source.id,
              lastSeenAt: item.collectedAt,
            },
            create: {
              workspaceId: context.workspaceId,
              sourceId: source.id,
              title: item.sound.title,
              authorName: item.sound.authorName,
              soundUrl: item.sound.soundUrl,
              market: input.market,
              origin: input.sourceOrigin,
              isCommerciallyUsable: item.sound.isCommerciallyUsable,
              commercialRightsStatus: item.sound.commercialRightsStatus,
              videoCount: item.sound.videoCount,
              dedupeKey: soundDedupeKey(item.sound, input.market),
              firstSeenAt: item.collectedAt,
              lastSeenAt: item.collectedAt,
            },
          })
        : null;
      const key = videoDedupeKey(item, input.market);
      const existing = await tx.video.findUnique({
        where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey: key } },
        include: {
          snapshots: {
            orderBy: { observedAt: "desc" },
            take: 1,
          },
          _count: {
            select: { evidence: true, snapshots: true },
          },
        },
      });
      const previousSnapshot = existing?.snapshots[0];
      const score = calculateVideoTrendScore({
        viewCount: item.viewCount,
        previousViewCount: previousSnapshot?.viewCount ?? undefined,
        observedAt: item.collectedAt,
        previousObservedAt: previousSnapshot?.observedAt,
        postedAt: item.postedAt,
        snapshotCount: (existing?._count.snapshots ?? 0) + 1,
        evidenceCount: (existing?._count.evidence ?? 0) + 1,
      });
      const video = existing
        ? await tx.video.update({
            where: { id: existing.id },
            data: {
              sourceId: source.id,
              creatorId: creator?.id,
              soundId: sound?.id,
              importBatchId: batch.id,
              jobRunId: job.id,
              platformVideoId: item.platformVideoId,
              url: item.url,
              title: item.title,
              caption: item.caption,
              postedAt: item.postedAt,
              collectedAt: item.collectedAt,
              lastSeenAt: item.collectedAt,
              currentViewCount: item.viewCount,
              currentLikeCount: item.likeCount,
              currentCommentCount: item.commentCount,
              currentShareCount: item.shareCount,
              currentSaveCount: item.saveCount,
              growthViews: score.growthViews,
              velocityScore: score.velocityScore,
              accelerationScore: score.accelerationScore,
              recencyScore: score.recencyScore,
              consistencyScore: score.consistencyScore,
              trendScore: score.score,
              confidence: score.confidence,
            },
          })
        : await tx.video.create({
            data: {
              workspaceId: context.workspaceId,
              sourceId: source.id,
              creatorId: creator?.id,
              soundId: sound?.id,
              importBatchId: batch.id,
              jobRunId: job.id,
              platformVideoId: item.platformVideoId,
              url: item.url,
              title: item.title,
              caption: item.caption,
              market: input.market,
              origin: input.sourceOrigin,
              postedAt: item.postedAt,
              collectedAt: item.collectedAt,
              firstSeenAt: item.collectedAt,
              lastSeenAt: item.collectedAt,
              currentViewCount: item.viewCount,
              currentLikeCount: item.likeCount,
              currentCommentCount: item.commentCount,
              currentShareCount: item.shareCount,
              currentSaveCount: item.saveCount,
              growthViews: score.growthViews,
              velocityScore: score.velocityScore,
              accelerationScore: score.accelerationScore,
              recencyScore: score.recencyScore,
              consistencyScore: score.consistencyScore,
              trendScore: score.score,
              confidence: score.confidence,
              dedupeKey: key,
            },
          });
      const snapshot = await tx.trendSnapshot.create({
        data: {
          workspaceId: context.workspaceId,
          entityType: "VIDEO",
          videoId: video.id,
          sourceId: source.id,
          importBatchId: batch.id,
          jobRunId: job.id,
          observedAt: item.collectedAt,
          viewCount: item.viewCount,
          likeCount: item.likeCount,
          commentCount: item.commentCount,
          shareCount: item.shareCount,
          saveCount: item.saveCount,
          rawMetrics: {
            platformVideoId: item.platformVideoId,
            url: item.url,
            externalNetwork: false,
          },
          growthViews: score.growthViews,
          velocityScore: score.velocityScore,
          accelerationScore: score.accelerationScore,
          recencyScore: score.recencyScore,
          consistencyScore: score.consistencyScore,
          trendScore: score.score,
        },
      });

      for (const tag of item.hashtags) {
        const hashtag = await tx.hashtag.upsert({
          where: { workspaceId_dedupeKey: { workspaceId: context.workspaceId, dedupeKey: hashtagDedupeKey(tag, input.market) } },
          update: {
            sourceId: source.id,
            currentScore: score.score,
            lastSeenAt: item.collectedAt,
          },
          create: {
            workspaceId: context.workspaceId,
            sourceId: source.id,
            tag,
            displayTag: `#${tag}`,
            market: input.market,
            origin: input.sourceOrigin,
            currentScore: score.score,
            dedupeKey: hashtagDedupeKey(tag, input.market),
            firstSeenAt: item.collectedAt,
            lastSeenAt: item.collectedAt,
          },
        });

        await tx.videoHashtag.upsert({
          where: { videoId_hashtagId: { videoId: video.id, hashtagId: hashtag.id } },
          update: {},
          create: { videoId: video.id, hashtagId: hashtag.id },
        });
      }

      if (creator) {
        await tx.creator.update({ where: { id: creator.id }, data: { currentScore: score.score } });
      }

      if (sound) {
        await tx.sound.update({ where: { id: sound.id }, data: { currentScore: score.score } });
      }

      await tx.trendEvidence.upsert({
        where: {
          workspaceId_dedupeKey: {
            workspaceId: context.workspaceId,
            dedupeKey: ["trend-evidence", key, stableHash(item.evidence.url ?? item.evidence.title).slice(0, 18)].join(":"),
          },
        },
        update: {
          snapshotId: snapshot.id,
          importBatchId: batch.id,
          jobRunId: job.id,
          capturedAt: item.collectedAt,
        },
        create: {
          workspaceId: context.workspaceId,
          sourceId: source.id,
          importBatchId: batch.id,
          jobRunId: job.id,
          snapshotId: snapshot.id,
          videoId: video.id,
          creatorId: creator?.id,
          soundId: sound?.id,
          title: item.evidence.title,
          url: item.evidence.url,
          excerpt: item.evidence.excerpt,
          note: item.evidence.note,
          origin: input.sourceOrigin,
          confidence: input.sourceOrigin === "OFFICIAL" ? "HIGH" : "MEDIUM",
          capturedAt: item.collectedAt,
          dedupeKey: ["trend-evidence", key, stableHash(item.evidence.url ?? item.evidence.title).slice(0, 18)].join(":"),
        },
      });
      importedVideoIds.push(video.id);
    }

    await createSteps(tx, context, batch.id);
    await tx.jobRun.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        stage: "AUDIT",
        finishedAt: new Date(),
      },
    });
    await tx.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "SUCCEEDED",
        itemCount: importedVideoIds.length,
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });
    await tx.ingestRequest.update({
      where: { id: request.id },
      data: {
        status: "SUCCEEDED",
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });

    return {
      ok: true,
      message: `${importedVideoIds.length} vídeos indexados com snapshots e proveniência.`,
      importedVideoIds,
      batchId: batch.id,
    };
  }, trendImportTransactionOptions);
}

export async function ingestTrendVideos(input: TrendImportSourceInput, context: TenantContext) {
  try {
    return await runImport(input, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha segura na ingestão de trends.";
    await recordFailure(input, context, message).catch((recordError) => {
      console.error("[trend-ingestion] failed to record failure", recordError);
    });

    return {
      ok: false,
      message,
      importedVideoIds: [],
    };
  }
}

export function parseTrendImportForm(input: {
  sourceTitle: string;
  sourceKind: string;
  sourceOrigin: string;
  market: string;
  sourceUrl?: string;
  payloadJson: string;
  submittedBy: string;
}): TrendImportSourceInput {
  return {
    sourceTitle: requireText(input.sourceTitle, "Fonte"),
    sourceKind: parseEnum(input.sourceKind, allowedSourceKinds, "MANUAL_RESEARCH"),
    sourceOrigin: parseEnum(input.sourceOrigin, allowedOrigins, "MANUAL"),
    market: parseEnum(input.market, allowedMarkets, "BR"),
    sourceUrl: input.sourceUrl?.trim() || undefined,
    payloadJson: input.payloadJson,
    submittedBy: input.submittedBy,
  };
}
