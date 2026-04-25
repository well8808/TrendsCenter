import type { IngestRequestType, Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";

export interface QueueIngestionRequestInput {
  workspaceId: string;
  requestKey: string;
  type: IngestRequestType;
  market: "BR" | "US";
  origin: "MANUAL" | "OFFICIAL" | "OWNED";
  title: string;
  submittedBy: string;
  payload: Prisma.InputJsonValue;
  connectorId?: string;
  sourceId?: string;
  signalId?: string;
}

export async function findIngestRequestByWorkspaceKey(workspaceId: string, requestKey: string) {
  return getPrisma().ingestRequest.findUnique({
    where: {
      workspaceId_requestKey: {
        workspaceId,
        requestKey,
      },
    },
  });
}

export async function findIngestRequestById(id: string) {
  return getPrisma().ingestRequest.findUnique({
    where: { id },
  });
}

export async function queueIngestRequest(input: QueueIngestionRequestInput) {
  return getPrisma().ingestRequest.upsert({
    where: {
      workspaceId_requestKey: {
        workspaceId: input.workspaceId,
        requestKey: input.requestKey,
      },
    },
    update: {
      status: "QUEUED",
      error: null,
      payload: input.payload,
      connectorId: input.connectorId,
      sourceId: input.sourceId,
      signalId: input.signalId,
      processedAt: null,
      completedAt: null,
    },
    create: {
      workspaceId: input.workspaceId,
      requestKey: input.requestKey,
      type: input.type,
      status: "QUEUED",
      market: input.market,
      origin: input.origin,
      connectorId: input.connectorId,
      sourceId: input.sourceId,
      signalId: input.signalId,
      title: input.title,
      submittedBy: input.submittedBy,
      payload: input.payload,
    },
  });
}

export async function markIngestRequestRunning(id: string) {
  await getPrisma().ingestRequest.update({
    where: { id },
    data: {
      status: "RUNNING",
      processedAt: new Date(),
      error: null,
    },
  });
}

export async function markIngestRequestSucceeded(id: string, patch: Prisma.IngestRequestUncheckedUpdateInput = {}) {
  await getPrisma().ingestRequest.update({
    where: { id },
    data: {
      status: "SUCCEEDED",
      processedAt: new Date(),
      completedAt: new Date(),
      error: null,
      ...patch,
    },
  });
}

export async function markIngestRequestFailed(id: string, error: string) {
  await getPrisma().ingestRequest.update({
    where: { id },
    data: {
      status: "FAILED",
      processedAt: new Date(),
      error,
    },
  });
}
