import type { JobRun, JobStatus, Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";

export interface EnqueueJobInput {
  workspaceId: string;
  queue: string;
  handler: string;
  name: string;
  createdBy: string;
  dedupeKey?: string;
  requestId?: string;
  importBatchId?: string;
  availableAt?: Date;
  maxAttempts?: number;
  payload?: Prisma.InputJsonValue;
}

export interface ClaimDueJobsOptions {
  workspaceId?: string;
  queue?: string;
  handler?: string;
}

export async function enqueueJob(input: EnqueueJobInput) {
  if (input.dedupeKey) {
    const existing = await getPrisma().jobRun.findUnique({
      where: {
        workspaceId_dedupeKey: {
          workspaceId: input.workspaceId,
          dedupeKey: input.dedupeKey,
        },
      },
    });

    if (existing) {
      return existing;
    }
  }

  return getPrisma().jobRun.create({
    data: {
      workspaceId: input.workspaceId,
      queue: input.queue,
      handler: input.handler,
      name: input.name,
      createdBy: input.createdBy,
      dedupeKey: input.dedupeKey,
      requestId: input.requestId,
      importBatchId: input.importBatchId,
      status: "QUEUED",
      availableAt: input.availableAt ?? new Date(),
      maxAttempts: input.maxAttempts ?? 5,
      payload: input.payload,
    },
  });
}

export async function listRecentJobRuns(workspaceId: string, options: { limit: number; statuses?: JobStatus[]; queue?: string }) {
  return getPrisma().jobRun.findMany({
    where: {
      workspaceId,
      status: options.statuses ? { in: options.statuses } : undefined,
      queue: options.queue,
    },
    orderBy: [{ createdAt: "desc" }],
    take: options.limit,
  });
}

export async function getJobRunById(id: string) {
  return getPrisma().jobRun.findUnique({
    where: { id },
  });
}

export async function claimDueJobs(
  limit: number,
  claimToken: string,
  leaseExpiresAt: Date,
  options: ClaimDueJobsOptions = {},
) {
  const now = new Date();
  const claimableWhere = {
    workspaceId: options.workspaceId,
    queue: options.queue,
    handler: options.handler,
    OR: [
      {
        status: { in: ["QUEUED", "FAILED"] as JobStatus[] },
        availableAt: { lte: now },
        OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
      },
      {
        status: "RUNNING" as JobStatus,
        leaseExpiresAt: { lt: now },
      },
    ],
  };
  const candidates = await getPrisma().jobRun.findMany({
    where: claimableWhere,
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
  const claimed: JobRun[] = [];

  for (const candidate of candidates) {
    const result = await getPrisma().jobRun.updateMany({
      where: {
        id: candidate.id,
        ...claimableWhere,
      },
      data: {
        status: "RUNNING",
        claimToken,
        leaseExpiresAt,
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });

    if (result.count === 1) {
      const claimedRun = await getPrisma().jobRun.findUnique({ where: { id: candidate.id } });

      if (claimedRun) {
        claimed.push(claimedRun);
      }
    }
  }

  return claimed;
}

export async function markJobRunSucceeded(id: string, claimToken: string, patch: Prisma.JobRunUpdateInput = {}) {
  await getPrisma().jobRun.updateMany({
    where: { id, claimToken },
    data: {
      status: "SUCCEEDED",
      finishedAt: new Date(),
      leaseExpiresAt: null,
      claimToken: null,
      error: null,
      lastError: null,
      ...patch,
    },
  });
}

export async function markJobRunRetryableFailure(
  id: string,
  claimToken: string,
  nextAttemptAt: Date,
  lastError: string,
  patch: Prisma.JobRunUpdateInput = {},
) {
  await getPrisma().jobRun.updateMany({
    where: { id, claimToken },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      availableAt: nextAttemptAt,
      leaseExpiresAt: null,
      claimToken: null,
      error: lastError,
      lastError,
      ...patch,
    },
  });
}

export async function markJobRunDeadLettered(
  id: string,
  claimToken: string,
  lastError: string,
  patch: Prisma.JobRunUpdateInput = {},
) {
  await getPrisma().jobRun.updateMany({
    where: { id, claimToken },
    data: {
      status: "DEAD_LETTERED",
      finishedAt: new Date(),
      deadLetteredAt: new Date(),
      leaseExpiresAt: null,
      claimToken: null,
      error: lastError,
      lastError,
      ...patch,
    },
  });
}
