import type { ContentDraftStatus, Prisma } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { buildContentIdeaBrief } from "@/lib/trends/content-idea-brief";
import {
  buildInitialContentDraftInput,
  contentDraftStatusMeta,
  getContentDraftSummary,
  normalizeContentDraftStatus,
  type ContentDraftStatusKey,
  type ContentDraftSummary,
} from "@/lib/trends/content-draft";
import { buildOpportunityBrief } from "@/lib/trends/opportunity-brief";
import { normalizeReelMedia, type NormalizedReelMedia } from "@/lib/trends/reel-media";
import { getTrendDetail, type TrendDetail } from "@/lib/trends/search";

const contentDraftInclude = {
  opportunityDecision: true,
  video: {
    include: {
      source: true,
      creator: true,
      sound: true,
      hashtags: {
        include: { hashtag: true },
      },
      snapshots: {
        orderBy: { observedAt: "asc" as const },
        take: 4,
      },
      evidence: {
        include: { source: true, snapshot: true },
        orderBy: { capturedAt: "desc" as const },
        take: 4,
      },
    },
  },
} satisfies Prisma.ContentDraftInclude;

type ContentDraftRecord = Prisma.ContentDraftGetPayload<{ include: typeof contentDraftInclude }>;

export interface ContentDraftVideoView {
  id: string;
  title: string;
  caption?: string;
  url?: string;
  thumbnailUrl?: string;
  media: NormalizedReelMedia;
  market: string;
  origin: string;
  trendScore: number;
  views: number;
  growthViews: number;
  creator?: string;
  sourceTitle: string;
  sound?: string;
  hashtags: string[];
}

export interface ContentDraftView extends ContentDraftSummary {
  centralIdea: string;
  scriptDraft: string;
  captionDraft: string;
  structureText: string;
  riskNotes: string;
  cta: string;
  notes?: string;
  channel?: string;
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
  source: string;
  evidence: string[];
  video: ContentDraftVideoView;
  decision?: {
    id: string;
    label: string;
    action: string;
    updatedAt: string;
  };
}

export interface UpdateContentDraftInput {
  title?: string;
  centralIdea?: string;
  hook?: string;
  scriptDraft?: string;
  captionDraft?: string;
  cta?: string;
  structureText?: string;
  riskNotes?: string;
  notes?: string;
  channel?: string;
  scheduledFor?: string;
  status?: string;
}

export type CreateOrOpenContentDraftResult =
  | { ok: true; draftId: string; created: boolean }
  | { ok: false; reason: "video_not_found" | "decision_required" };

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function optionalText(value: string | null | undefined) {
  const text = clean(value);

  return text || undefined;
}

function parseOptionalDate(value: string | null | undefined) {
  const text = clean(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function evidenceArray(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function mapVideo(video: ContentDraftRecord["video"]): ContentDraftVideoView {
  return {
    id: video.id,
    title: video.title,
    caption: video.caption ?? undefined,
    url: video.url ?? undefined,
    thumbnailUrl: video.thumbnailUrl ?? undefined,
    media: normalizeReelMedia(video),
    market: video.market,
    origin: video.origin,
    trendScore: video.trendScore,
    views: Number(video.currentViewCount),
    growthViews: Number(video.growthViews),
    creator: video.creator?.handle,
    sourceTitle: video.source.title,
    sound: video.sound?.title,
    hashtags: video.hashtags.map((item) => item.hashtag.displayTag),
  };
}

function mapContentDraft(record: ContentDraftRecord): ContentDraftView {
  const summary = getContentDraftSummary(record);

  return {
    ...summary,
    centralIdea: record.centralIdea,
    scriptDraft: record.scriptDraft,
    captionDraft: record.captionDraft,
    structureText: record.structureText,
    riskNotes: record.riskNotes,
    cta: record.cta,
    notes: record.notes ?? undefined,
    channel: record.channel ?? undefined,
    scheduledFor: record.scheduledFor?.toISOString(),
    publishedAt: record.publishedAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    source: record.source,
    evidence: evidenceArray(record.evidenceJson),
    video: mapVideo(record.video),
    decision: record.opportunityDecision
      ? {
          id: record.opportunityDecision.id,
          label: record.opportunityDecision.label,
          action: record.opportunityDecision.action,
          updatedAt: record.opportunityDecision.updatedAt.toISOString(),
        }
      : undefined,
  };
}

function buildContentIdeaForTrend(trend: TrendDetail) {
  const opportunityBrief = buildOpportunityBrief({
    title: trend.title,
    caption: trend.caption,
    creator: trend.creator?.handle,
    market: trend.market,
    origin: trend.origin,
    trendScore: trend.trendScore,
    growthViews: trend.growthViews,
    velocityScore: trend.velocityScore,
    accelerationScore: trend.accelerationScore,
    evidenceCount: trend.evidenceCount,
    snapshotCount: trend.snapshotCount,
    views: trend.metrics.views,
    likes: trend.metrics.likes,
    comments: trend.metrics.comments,
    shares: trend.metrics.shares,
    saves: trend.metrics.saves,
    sound: trend.sound?.title,
    hashtags: trend.hashtags,
    collectedAt: trend.collectedAt,
    postedAt: trend.postedAt,
  });
  const primarySignal = trend.relatedSignals[0];

  return buildContentIdeaBrief({
    reel: {
      title: trend.title,
      caption: trend.caption,
      creator: trend.creator?.handle,
      market: trend.market,
      origin: trend.origin,
      trendScore: trend.trendScore,
      views: trend.metrics.views,
      growthViews: trend.growthViews,
      evidenceCount: trend.evidenceCount,
      snapshotCount: trend.snapshotCount,
      sound: trend.sound?.title,
      hashtags: trend.hashtags,
    },
    opportunityBrief,
    decision: trend.decision,
    signal: primarySignal
      ? {
          title: primarySignal.title,
          summary: primarySignal.summary,
          decision: primarySignal.decision,
          nextAction: primarySignal.nextAction,
          confidence: primarySignal.confidence,
          evidenceCount: primarySignal.evidenceCount,
          score: primarySignal.score,
          scoreDrivers: primarySignal.scoreDrivers,
        }
      : undefined,
  });
}

export async function listContentDrafts(context: TenantContext) {
  const records = await getPrisma().contentDraft.findMany({
    where: {
      workspaceId: context.workspaceId,
      userId: context.userId,
    },
    include: contentDraftInclude,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return records.map(mapContentDraft);
}

export async function getContentDraft(context: TenantContext, draftId: string) {
  const record = await getPrisma().contentDraft.findFirst({
    where: {
      id: draftId,
      workspaceId: context.workspaceId,
      userId: context.userId,
    },
    include: contentDraftInclude,
  });

  return record ? mapContentDraft(record) : null;
}

export async function createOrOpenContentDraftFromOpportunity(
  context: TenantContext,
  videoId: string,
): Promise<CreateOrOpenContentDraftResult> {
  const trend = await getTrendDetail(context, videoId);

  if (!trend) {
    return { ok: false, reason: "video_not_found" };
  }

  if (trend.decision?.action !== "create_content_idea") {
    return { ok: false, reason: "decision_required" };
  }

  const prisma = getPrisma();
  const existing = await prisma.contentDraft.findUnique({
    where: {
      workspaceId_userId_videoId: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        videoId: trend.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return { ok: true, draftId: existing.id, created: false };
  }

  const idea = buildContentIdeaForTrend(trend);
  const initial = buildInitialContentDraftInput(idea);
  const draft = await prisma.contentDraft.create({
    data: {
      workspaceId: context.workspaceId,
      userId: context.userId,
      videoId: trend.id,
      opportunityDecisionId: trend.decision.id,
      title: initial.title,
      centralIdea: initial.centralIdea,
      hook: initial.hook,
      scriptDraft: initial.scriptDraft,
      captionDraft: initial.captionDraft,
      cta: initial.cta,
      structureText: initial.structureText,
      riskNotes: initial.riskNotes,
      evidenceJson: initial.evidenceJson,
      status: initial.status as ContentDraftStatus,
      source: initial.source,
    },
    select: { id: true },
  });

  return { ok: true, draftId: draft.id, created: true };
}

export async function updateContentDraft(context: TenantContext, draftId: string, input: UpdateContentDraftInput) {
  const status = input.status ? normalizeContentDraftStatus(input.status) : undefined;
  const scheduledFor = input.scheduledFor !== undefined ? parseOptionalDate(input.scheduledFor) : undefined;
  const publishedAt = status === "PUBLISHED" ? new Date() : undefined;
  const data: Prisma.ContentDraftUpdateInput = {};

  if (input.title !== undefined) data.title = clean(input.title) || "Roteiro sem titulo";
  if (input.centralIdea !== undefined) data.centralIdea = clean(input.centralIdea) || "Ideia central a revisar.";
  if (input.hook !== undefined) data.hook = clean(input.hook) || "Gancho a revisar.";
  if (input.scriptDraft !== undefined) data.scriptDraft = clean(input.scriptDraft) || "Roteiro a revisar.";
  if (input.captionDraft !== undefined) data.captionDraft = clean(input.captionDraft) || "Legenda a revisar.";
  if (input.cta !== undefined) data.cta = clean(input.cta) || "CTA a revisar.";
  if (input.structureText !== undefined) data.structureText = clean(input.structureText) || "Estrutura a revisar.";
  if (input.riskNotes !== undefined) data.riskNotes = clean(input.riskNotes) || "Cuidados a revisar.";
  if (input.notes !== undefined) data.notes = optionalText(input.notes) ?? null;
  if (input.channel !== undefined) data.channel = optionalText(input.channel) ?? null;
  if (input.scheduledFor !== undefined) data.scheduledFor = scheduledFor;
  if (status) data.status = status as ContentDraftStatus;
  if (publishedAt) data.publishedAt = publishedAt;

  const existing = await getPrisma().contentDraft.findFirst({
    where: {
      id: draftId,
      workspaceId: context.workspaceId,
      userId: context.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  const record = await getPrisma().contentDraft.update({
    where: { id: draftId },
    data,
    include: contentDraftInclude,
  });

  return mapContentDraft(record);
}

export async function updateContentDraftStatus(
  context: TenantContext,
  draftId: string,
  statusInput: string,
) {
  const status = normalizeContentDraftStatus(statusInput);

  return updateContentDraft(context, draftId, {
    status,
    scheduledFor: status === "SCHEDULED" ? undefined : undefined,
  });
}

export function getContentDraftStatusLabel(status: ContentDraftStatusKey | string) {
  return contentDraftStatusMeta[normalizeContentDraftStatus(status)].label;
}
