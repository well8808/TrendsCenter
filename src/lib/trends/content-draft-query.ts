import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { getContentDraftSummary, type ContentDraftSummary } from "@/lib/trends/content-draft";

export async function getContentDraftMap(context: TenantContext, videoIds: string[]) {
  const uniqueVideoIds = Array.from(new Set(videoIds.filter(Boolean)));

  if (uniqueVideoIds.length === 0) {
    return new Map<string, ContentDraftSummary>();
  }

  const records = await getPrisma().contentDraft.findMany({
    where: {
      workspaceId: context.workspaceId,
      userId: context.userId,
      videoId: { in: uniqueVideoIds },
    },
    orderBy: { updatedAt: "desc" },
  });

  return new Map(records.map((record) => [record.videoId, getContentDraftSummary(record)]));
}

export async function getContentDraftForVideo(context: TenantContext, videoId: string) {
  const record = await getPrisma().contentDraft.findUnique({
    where: {
      workspaceId_userId_videoId: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        videoId,
      },
    },
  });

  return record ? getContentDraftSummary(record) : undefined;
}
