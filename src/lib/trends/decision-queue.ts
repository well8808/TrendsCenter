import type { OpportunityDecisionAction, Prisma } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import {
  getOpportunityDecisionMeta,
  normalizeOpportunityDecisionAction,
  type OpportunityDecisionActionKey,
  type OpportunityDecisionView,
} from "@/lib/trends/opportunity-actions";

const prismaActionByKey = {
  save_for_brief: "SAVE_FOR_BRIEF",
  observe_trend: "OBSERVE_TREND",
  dismiss: "DISMISS",
  mark_used: "MARK_USED",
  create_content_idea: "CREATE_CONTENT_IDEA",
} satisfies Record<OpportunityDecisionActionKey, OpportunityDecisionAction>;

const actionKeyByPrisma = {
  SAVE_FOR_BRIEF: "save_for_brief",
  OBSERVE_TREND: "observe_trend",
  DISMISS: "dismiss",
  MARK_USED: "mark_used",
  CREATE_CONTENT_IDEA: "create_content_idea",
} satisfies Record<OpportunityDecisionAction, OpportunityDecisionActionKey>;

type OpportunityDecisionRecord = {
  id: string;
  action: OpportunityDecisionAction;
  label: string;
  notes: string | null;
  updatedAt: Date;
};

export interface SetOpportunityDecisionInput {
  videoId: string;
  action: string;
  notes?: string;
}

export type SetOpportunityDecisionResult =
  | { ok: true; decision: OpportunityDecisionView; unchanged: boolean }
  | { ok: false; reason: "invalid_action" | "video_not_found" };

function auditTone(tone: ReturnType<typeof getOpportunityDecisionMeta>["tone"]) {
  if (tone === "hot") return "acid";
  if (tone === "gold") return "gold";
  if (tone === "aqua") return "aqua";

  return "violet";
}

export function mapOpportunityDecisionRecord(record: OpportunityDecisionRecord): OpportunityDecisionView {
  const action = actionKeyByPrisma[record.action];
  const meta = getOpportunityDecisionMeta(action);

  return {
    id: record.id,
    action,
    label: record.label || meta.label,
    shortLabel: meta.shortLabel,
    body: meta.body,
    section: meta.section,
    tone: meta.tone,
    notes: record.notes ?? undefined,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getOpportunityDecisionMap(context: TenantContext, videoIds: string[]) {
  const uniqueVideoIds = Array.from(new Set(videoIds.filter(Boolean)));

  if (uniqueVideoIds.length === 0) {
    return new Map<string, OpportunityDecisionView>();
  }

  const records = await getPrisma().opportunityDecision.findMany({
    where: {
      workspaceId: context.workspaceId,
      userId: context.userId,
      videoId: { in: uniqueVideoIds },
    },
    orderBy: { updatedAt: "desc" },
  });

  return new Map(records.map((record) => [record.videoId, mapOpportunityDecisionRecord(record)]));
}

export async function getOpportunityDecisionForVideo(context: TenantContext, videoId: string) {
  const record = await getPrisma().opportunityDecision.findUnique({
    where: {
      workspaceId_userId_videoId: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        videoId,
      },
    },
  });

  return record ? mapOpportunityDecisionRecord(record) : undefined;
}

export async function setOpportunityDecision(
  context: TenantContext,
  input: SetOpportunityDecisionInput,
): Promise<SetOpportunityDecisionResult> {
  const action = normalizeOpportunityDecisionAction(input.action);

  if (!action) {
    return { ok: false, reason: "invalid_action" };
  }

  const prisma = getPrisma();
  const video = await prisma.video.findFirst({
    where: {
      id: input.videoId,
      workspaceId: context.workspaceId,
    },
    select: {
      id: true,
      title: true,
      dedupeKey: true,
    },
  });

  if (!video) {
    return { ok: false, reason: "video_not_found" };
  }

  const relatedSignal = await prisma.signal.findFirst({
    where: {
      workspaceId: context.workspaceId,
      dedupeKey: `reel-signal:${video.dedupeKey}`,
    },
    select: { id: true },
  });
  const existing = await prisma.opportunityDecision.findUnique({
    where: {
      workspaceId_userId_videoId: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        videoId: video.id,
      },
    },
  });
  const prismaAction = prismaActionByKey[action];
  const meta = getOpportunityDecisionMeta(action);
  const normalizedNotes = input.notes?.trim() || undefined;

  if (
    existing &&
    existing.action === prismaAction &&
    existing.signalId === (relatedSignal?.id ?? null) &&
    (existing.notes ?? undefined) === normalizedNotes
  ) {
    return { ok: true, decision: mapOpportunityDecisionRecord(existing), unchanged: true };
  }

  const decision = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const saved = await tx.opportunityDecision.upsert({
      where: {
        workspaceId_userId_videoId: {
          workspaceId: context.workspaceId,
          userId: context.userId,
          videoId: video.id,
        },
      },
      create: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        videoId: video.id,
        signalId: relatedSignal?.id,
        action: prismaAction,
        label: meta.label,
        notes: normalizedNotes,
      },
      update: {
        signalId: relatedSignal?.id,
        action: prismaAction,
        label: meta.label,
        notes: normalizedNotes,
      },
    });

    await tx.auditEvent.create({
      data: {
        workspaceId: context.workspaceId,
        signalId: relatedSignal?.id,
        type: action === "dismiss" ? "DECISION_REMOVED" : "DECISION_QUEUED",
        label: "opportunity",
        value: meta.shortLabel,
        tone: auditTone(meta.tone),
        message: `${meta.label}: ${video.title}`,
        actor: context.userEmail,
        metadata: {
          videoId: video.id,
          action,
          previousAction: existing ? actionKeyByPrisma[existing.action] : null,
        },
      },
    });

    return saved;
  });

  return { ok: true, decision: mapOpportunityDecisionRecord(decision), unchanged: false };
}
