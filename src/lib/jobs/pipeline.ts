export type JobQueueName = "manual-ingest" | "normalize" | "score" | "audit";

export interface SafeJobEnvelope {
  queue: JobQueueName;
  name: string;
  mode: "demo" | "manual" | "official";
  sourceId?: string;
  signalId?: string;
  createdBy: "system" | "operator";
  externalNetwork: false;
  notes: string;
}

export const phase3AQueues: Array<{ queue: JobQueueName; purpose: string }> = [
  { queue: "manual-ingest", purpose: "Registrar snapshots manuais ou oficiais aprovados." },
  { queue: "normalize", purpose: "Preparar dedupe, taxonomia e ligacao de evidencia." },
  { queue: "score", purpose: "Recalcular score de sinais com modelo versionado." },
  { queue: "audit", purpose: "Registrar mudancas relevantes e fronteiras de compliance." },
];

export function createManualIngestEnvelope(sourceId: string, notes: string): SafeJobEnvelope {
  return {
    queue: "manual-ingest",
    name: "manual-demo-ingest",
    mode: "manual",
    sourceId,
    createdBy: "operator",
    externalNetwork: false,
    notes,
  };
}
