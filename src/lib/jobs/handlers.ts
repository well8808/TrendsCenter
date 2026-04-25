import type { JobRun } from "@prisma/client";

import { attachManualEvidence, createManualSignalWithEvidence } from "@/lib/ingestion/service";
import type { JobExecutionResult } from "@/lib/jobs/contracts";
import { jobHandlers } from "@/lib/jobs/contracts";
import {
  findIngestRequestById,
  markIngestRequestRunning,
  markIngestRequestSucceeded,
} from "@/lib/repositories/ingestion-request-repository";
import { buildSystemTenantContext } from "@/lib/services/auth-context-service";
import { ingestTrendVideos } from "@/lib/trends/ingestion";

function requestPayload(value: unknown) {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export async function runJobHandler(job: JobRun): Promise<JobExecutionResult> {
  if (job.handler !== jobHandlers.ingestionRequestProcess) {
    return {
      status: "dead_lettered",
      message: `Handler nao suportado: ${job.handler}`,
    };
  }

  const requestIdFromPayload = requestPayload(job.payload).requestId;
  const requestId = job.requestId ?? (typeof requestIdFromPayload === "string" ? requestIdFromPayload : undefined);

  if (!requestId) {
    return {
      status: "dead_lettered",
      message: "Job sem requestId associado.",
    };
  }

  const request = await findIngestRequestById(requestId);

  if (!request) {
    return {
      status: "dead_lettered",
      message: "IngestRequest nao encontrada para este job.",
    };
  }

  if (request.status === "SUCCEEDED") {
    return {
      status: "succeeded",
      message: "IngestRequest ja concluida anteriormente.",
      details: { requestId: request.id, idempotent: true },
    };
  }

  await markIngestRequestRunning(request.id);
  const payload = requestPayload(request.payload);
  const input = requestPayload(payload.input);
  const context = await buildSystemTenantContext(request.workspaceId, request.submittedBy);

  if (payload.kind === "OFFICIAL_SNAPSHOT") {
    const result = await ingestTrendVideos(
      {
        sourceTitle: String(input.sourceTitle ?? ""),
        sourceKind: String(input.sourceKind ?? "") as never,
        sourceOrigin: String(input.sourceOrigin ?? "") as never,
        market: String(input.market ?? "BR") as never,
        sourceUrl: typeof input.sourceUrl === "string" ? input.sourceUrl : undefined,
        payloadJson: String(input.payloadJson ?? ""),
        submittedBy: request.submittedBy,
      },
      context,
    );

    if (!result.ok) {
      return {
        status: "retryable_failure",
        message: result.message,
      };
    }

    await markIngestRequestSucceeded(request.id);

    return {
      status: "succeeded",
      message: result.message,
      details: {
        requestId: request.id,
        importedVideoIds: result.importedVideoIds,
      },
    };
  }

  if (payload.kind === "SIGNAL_CREATE") {
    const result = await createManualSignalWithEvidence(
      {
        title: String(input.signalTitle ?? ""),
        summary: String(input.summary ?? ""),
        type: String(input.signalType ?? "") as never,
        market: String(input.market ?? "BR") as never,
        audience: String(input.audience ?? ""),
        sourceTitle: String(input.sourceTitle ?? ""),
        sourceKind: String(input.sourceKind ?? "") as never,
        sourceOrigin: String(input.sourceOrigin ?? "") as never,
        evidenceTitle: String(input.evidenceTitle ?? ""),
        evidenceUrl: typeof input.evidenceUrl === "string" ? input.evidenceUrl : undefined,
        evidenceNote: String(input.evidenceNote ?? ""),
        submittedBy: request.submittedBy,
      },
      context,
    );

    if (!result.ok) {
      return {
        status: "retryable_failure",
        message: result.message,
      };
    }

    await markIngestRequestSucceeded(request.id, {
      signalId: result.signalId,
    });

    return {
      status: "succeeded",
      message: result.message,
      details: {
        requestId: request.id,
        signalId: result.signalId,
        evidenceId: result.evidenceId,
      },
    };
  }

  if (payload.kind === "EVIDENCE_APPEND") {
    const result = await attachManualEvidence(
      {
        signalId: String(input.signalId ?? ""),
        sourceId: String(input.sourceId ?? ""),
        evidenceTitle: String(input.evidenceTitle ?? ""),
        evidenceUrl: typeof input.evidenceUrl === "string" ? input.evidenceUrl : undefined,
        evidenceNote: String(input.evidenceNote ?? ""),
        submittedBy: request.submittedBy,
      },
      context,
    );

    if (!result.ok) {
      return {
        status: "retryable_failure",
        message: result.message,
      };
    }

    await markIngestRequestSucceeded(request.id, {
      signalId: result.signalId,
    });

    return {
      status: "succeeded",
      message: result.message,
      details: {
        requestId: request.id,
        signalId: result.signalId,
        evidenceId: result.evidenceId,
      },
    };
  }

  return {
    status: "dead_lettered",
    message: `Payload kind nao suportado: ${String(payload.kind ?? "undefined")}`,
  };
}
