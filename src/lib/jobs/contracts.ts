import type { IngestRequestType } from "@prisma/client";

export const jobQueues = {
  ingestion: "ingestion",
  system: "system",
} as const;

export type JobQueueName = (typeof jobQueues)[keyof typeof jobQueues];

export const jobHandlers = {
  ingestionRequestProcess: "ingestion.request.process",
} as const;

export type JobHandlerName = (typeof jobHandlers)[keyof typeof jobHandlers];

export interface IngestionJobPayload {
  requestId: string;
  requestType: IngestRequestType;
}

export interface JobExecutionResult {
  status: "succeeded" | "retryable_failure" | "dead_lettered";
  message: string;
  details?: Record<string, unknown>;
}
