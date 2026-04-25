/**
 * Endpoints e tipos espelhando os services backend.
 * Fonte única de verdade pro que o frontend pode consumir.
 * Se um service backend mudar de forma, adapte aqui — nunca criar contrato paralelo.
 */

import { apiGet, apiPost, type ApiRequestOptions } from "@/lib/api/client";
import type { TrendSearchData, TrendDetail } from "@/lib/trends/search";

/* ---------- Workspace ---------- */

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  actor: {
    userId: string;
    email: string;
    name: string | null;
    role: string;
    membershipStatus: string;
  };
  permissions: Record<string, boolean>;
  stats: {
    members: number;
    pendingInvites: number;
    signals: number;
    sources: number;
    videos: number;
    jobRuns: number;
    outboxItems: number;
  };
}

export function getCurrentWorkspaceApi(options: Pick<ApiRequestOptions, "signal" | "cache" | "next"> = {}) {
  return apiGet<WorkspaceDto>("/api/v1/workspaces/current", options);
}

/* ---------- Trends ---------- */

export interface TrendsSearchParams {
  q?: string;
  market?: "ALL" | "BR" | "US";
  sort?: "score" | "growth" | "recency";
}

export function listTrendsApi(params: TrendsSearchParams = {}, options: Pick<ApiRequestOptions, "signal"> = {}) {
  return apiGet<TrendSearchData>("/api/v1/trends", {
    searchParams: { query: params.q, market: params.market, sort: params.sort },
    ...options,
  });
}

export function getTrendByIdApi(id: string, options: Pick<ApiRequestOptions, "signal"> = {}) {
  return apiGet<TrendDetail>(`/api/v1/trends/${encodeURIComponent(id)}`, options);
}

/* ---------- Jobs ---------- */

export type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "DEAD_LETTERED" | "CANCELED";

export interface JobRunDto {
  id: string;
  queue: string;
  handler: string;
  name: string;
  status: JobStatus;
  stage: string | null;
  requestId: string | null;
  importBatchId: string | null;
  dedupeKey: string | null;
  attemptCount: number;
  maxAttempts: number;
  createdBy: string | null;
  availableAt: string;
  startedAt?: string;
  finishedAt?: string;
  lastError?: string;
  deadLetteredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobRunsListDto {
  items: JobRunDto[];
}

export interface ListJobRunsParams {
  limit?: number;
  status?: JobStatus[];
  queue?: string;
}

export function listJobRunsApi(params: ListJobRunsParams = {}, options: Pick<ApiRequestOptions, "signal"> = {}) {
  return apiGet<JobRunsListDto>("/api/v1/jobs/runs", {
    searchParams: {
      limit: params.limit,
      status: params.status?.join(","),
      queue: params.queue,
    },
    ...options,
  });
}

/* ---------- Ingestion ---------- */

export type IngestionRequestBody =
  | {
      type: "OFFICIAL_SNAPSHOT";
      sourceTitle: string;
      sourceKind: string;
      sourceOrigin: "MANUAL" | "OFFICIAL" | "OWNED";
      market: "BR" | "US";
      sourceUrl?: string;
      payloadJson: string;
    }
  | {
      type: "SIGNAL_CREATE";
      signalTitle: string;
      summary: string;
      signalType: string;
      market: "BR" | "US";
      audience: string;
      sourceTitle: string;
      sourceKind: string;
      sourceOrigin: "MANUAL" | "OFFICIAL" | "OWNED";
      evidenceTitle: string;
      evidenceUrl?: string;
      evidenceNote: string;
    }
  | {
      type: "EVIDENCE_APPEND";
      signalId: string;
      sourceId: string;
      signalTitle: string;
      market: "BR" | "US";
      sourceOrigin: "MANUAL" | "OFFICIAL" | "OWNED";
      sourceTitle: string;
      evidenceTitle: string;
      evidenceUrl?: string;
      evidenceNote: string;
    };

export interface IngestionRequestAckDto {
  request: {
    id: string;
    requestKey: string;
    type: string;
    status: string;
    title: string;
    market: string;
    origin: string;
    submittedAt: string;
  };
  job: {
    id: string;
    queue: string;
    handler: string;
    status: JobStatus;
    attemptCount: number;
    availableAt: string;
  };
  idempotent: boolean;
}

export function submitIngestionRequestApi(body: IngestionRequestBody, options: Pick<ApiRequestOptions, "signal"> = {}) {
  return apiPost<IngestionRequestAckDto>("/api/v1/ingestion/requests", body, options);
}

/* ---------- Health ---------- */

export interface HealthDto {
  status: "ok" | "degraded" | "down";
  checks: Record<string, { status: "ok" | "degraded" | "down"; detail?: string }>;
}

export function getHealthApi(options: Pick<ApiRequestOptions, "signal"> = {}) {
  return apiGet<HealthDto>("/api/health", options);
}
