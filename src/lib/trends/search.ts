import type { Prisma } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export type TrendSearchSort = "score" | "recency" | "growth";
export type TrendMarketFilter = "ALL" | "BR" | "US";

export interface TrendSearchParams {
  query: string;
  market: TrendMarketFilter;
  sort: TrendSearchSort;
}

const videoInclude = {
  source: true,
  creator: true,
  sound: true,
  hashtags: {
    include: { hashtag: true },
  },
  snapshots: {
    orderBy: { observedAt: "asc" as const },
    take: 12,
  },
  evidence: {
    include: { source: true, snapshot: true },
    orderBy: { capturedAt: "desc" as const },
    take: 6,
  },
} satisfies Prisma.VideoInclude;

export type TrendVideoPayload = Prisma.VideoGetPayload<{ include: typeof videoInclude }>;

function toNumber(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value ?? 0;
}

function scoreBand(score: number) {
  if (score >= 78) {
    return "alta";
  }

  if (score >= 52) {
    return "media";
  }

  return "baixa";
}

export interface TrendVideoResult {
  id: string;
  title: string;
  caption?: string;
  url?: string;
  thumbnailUrl?: string;
  market: string;
  origin: string;
  trendScore: number;
  confidence: string;
  scoreBand: string;
  growthViews: number;
  velocityScore: number;
  accelerationScore: number;
  recencyScore: number;
  consistencyScore: number;
  collectedAt: string;
  postedAt?: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  source: {
    title: string;
    kind: string;
    origin: string;
    url?: string;
  };
  creator?: {
    handle: string;
    displayName?: string;
    followerCount?: number;
  };
  sound?: {
    title: string;
    authorName?: string;
    isCommerciallyUsable?: boolean;
  };
  hashtags: string[];
  evidenceCount: number;
  snapshotCount: number;
}

export interface TrendDetail extends TrendVideoResult {
  timeline: Array<{
    id: string;
    observedAt: string;
    views: number;
    growthViews: number;
    score: number;
    velocityScore: number;
    accelerationScore: number;
  }>;
  evidence: Array<{
    id: string;
    title: string;
    url?: string;
    note?: string;
    origin: string;
    confidence: string;
    capturedAt: string;
    sourceTitle: string;
  }>;
  related: TrendVideoResult[];
  scoreExplanation: string;
}

export interface TrendSearchData {
  params: TrendSearchParams;
  results: TrendVideoResult[];
  stats: {
    total: number;
    br: number;
    us: number;
    avgScore: number;
    latestIndexedAt?: string;
  };
}

function mapVideo(video: TrendVideoPayload): TrendVideoResult {
  return {
    id: video.id,
    title: video.title,
    caption: video.caption ?? undefined,
    url: video.url ?? undefined,
    thumbnailUrl: video.thumbnailUrl ?? undefined,
    market: video.market,
    origin: video.origin,
    trendScore: video.trendScore,
    confidence: video.confidence,
    scoreBand: scoreBand(video.trendScore),
    growthViews: toNumber(video.growthViews),
    velocityScore: video.velocityScore,
    accelerationScore: video.accelerationScore,
    recencyScore: video.recencyScore,
    consistencyScore: video.consistencyScore,
    collectedAt: video.collectedAt.toISOString(),
    postedAt: video.postedAt?.toISOString(),
    metrics: {
      views: toNumber(video.currentViewCount),
      likes: toNumber(video.currentLikeCount),
      comments: toNumber(video.currentCommentCount),
      shares: toNumber(video.currentShareCount),
      saves: toNumber(video.currentSaveCount),
    },
    source: {
      title: video.source.title,
      kind: video.source.kind,
      origin: video.source.origin,
      url: video.source.url ?? undefined,
    },
    creator: video.creator
      ? {
          handle: video.creator.handle,
          displayName: video.creator.displayName ?? undefined,
          followerCount: video.creator.followerCount ? Number(video.creator.followerCount) : undefined,
        }
      : undefined,
    sound: video.sound
      ? {
          title: video.sound.title,
          authorName: video.sound.authorName ?? undefined,
          isCommerciallyUsable: video.sound.isCommerciallyUsable ?? undefined,
        }
      : undefined,
    hashtags: video.hashtags.map((item) => item.hashtag.displayTag),
    evidenceCount: video.evidence.length,
    snapshotCount: video.snapshots.length,
  };
}

function orderBy(sort: TrendSearchSort): Prisma.VideoOrderByWithRelationInput[] {
  if (sort === "recency") {
    return [{ collectedAt: "desc" }, { trendScore: "desc" }];
  }

  if (sort === "growth") {
    return [{ growthViews: "desc" }, { trendScore: "desc" }];
  }

  return [{ trendScore: "desc" }, { collectedAt: "desc" }];
}

function searchWhere(context: TenantContext, params: TrendSearchParams): Prisma.VideoWhereInput {
  const query = params.query.trim();
  const where: Prisma.VideoWhereInput = {
    workspaceId: context.workspaceId,
  };

  if (params.market !== "ALL") {
    where.market = params.market;
  }

  if (query) {
    const normalized = query.replace(/^#|^@/, "");

    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { caption: { contains: query, mode: "insensitive" } },
      { platformVideoId: { contains: query, mode: "insensitive" } },
      { creator: { is: { handle: { contains: normalized, mode: "insensitive" } } } },
      { sound: { is: { title: { contains: query, mode: "insensitive" } } } },
      { hashtags: { some: { hashtag: { tag: { contains: normalized, mode: "insensitive" } } } } },
    ];
  }

  return where;
}

export async function getTrendSearchData(
  context: TenantContext,
  params: TrendSearchParams,
): Promise<TrendSearchData> {
  const prisma = getPrisma();
  const where = searchWhere(context, params);
  const [results, total, br, us, latest] = await Promise.all([
    prisma.video.findMany({
      where,
      include: videoInclude,
      orderBy: orderBy(params.sort),
      take: 40,
    }),
    prisma.video.count({ where: { workspaceId: context.workspaceId } }),
    prisma.video.count({ where: { workspaceId: context.workspaceId, market: "BR" } }),
    prisma.video.count({ where: { workspaceId: context.workspaceId, market: "US" } }),
    prisma.video.findFirst({
      where: { workspaceId: context.workspaceId },
      orderBy: { collectedAt: "desc" },
      select: { collectedAt: true },
    }),
  ]);
  const mapped = results.map(mapVideo);
  const avgScore = mapped.length
    ? Math.round(mapped.reduce((totalScore, video) => totalScore + video.trendScore, 0) / mapped.length)
    : 0;

  await prisma.searchQueryLog.create({
    data: {
      workspaceId: context.workspaceId,
      userId: context.userId,
      query: params.query.trim(),
      market: params.market === "ALL" ? undefined : params.market,
      entityType: "VIDEO",
      sort: params.sort,
      filters: {
        market: params.market,
        sort: params.sort,
      },
      resultCount: mapped.length,
    },
  });

  return {
    params,
    results: mapped,
    stats: {
      total,
      br,
      us,
      avgScore,
      latestIndexedAt: latest?.collectedAt.toISOString(),
    },
  };
}

export async function getTrendDetail(context: TenantContext, videoId: string): Promise<TrendDetail | null> {
  const video = await getPrisma().video.findFirst({
    where: { id: videoId, workspaceId: context.workspaceId },
    include: videoInclude,
  });

  if (!video) {
    return null;
  }

  const hashtagIds = video.hashtags.map((item) => item.hashtagId);
  const relatedClauses = [
    video.creatorId ? { creatorId: video.creatorId } : undefined,
    video.soundId ? { soundId: video.soundId } : undefined,
    hashtagIds.length ? { hashtags: { some: { hashtagId: { in: hashtagIds } } } } : undefined,
  ].filter((item) => item !== undefined);
  const related = relatedClauses.length
    ? await getPrisma().video.findMany({
        where: {
          workspaceId: context.workspaceId,
          id: { not: video.id },
          OR: relatedClauses,
        },
        include: videoInclude,
        orderBy: [{ trendScore: "desc" }, { collectedAt: "desc" }],
        take: 4,
      })
    : [];
  const mapped = mapVideo(video);

  return {
    ...mapped,
    timeline: video.snapshots.map((snapshot) => ({
      id: snapshot.id,
      observedAt: snapshot.observedAt.toISOString(),
      views: toNumber(snapshot.viewCount),
      growthViews: toNumber(snapshot.growthViews),
      score: snapshot.trendScore,
      velocityScore: snapshot.velocityScore,
      accelerationScore: snapshot.accelerationScore,
    })),
    evidence: video.evidence.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url ?? undefined,
      note: item.note ?? item.excerpt ?? undefined,
      origin: item.origin,
      confidence: item.confidence,
      capturedAt: item.capturedAt.toISOString(),
      sourceTitle: item.source.title,
    })),
    related: related.map(mapVideo),
    scoreExplanation:
      "Score v0.1 combina crescimento de views, velocidade, aceleração, recência do post e consistência entre snapshots/evidências.",
  };
}
