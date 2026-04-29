"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  FileInput,
  GitBranch,
  Link2,
  Loader2,
  Plus,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

import type { CommandCenterData } from "@/lib/persistence/command-center";
import type { SourceRecord, TrendSignal } from "@/lib/types";
import { cn } from "@/lib/utils";

type ActionResult = {
  ok: boolean;
  message: string;
  signalId?: string;
  evidenceId?: string;
  batchId?: string;
  requestId?: string;
  jobId?: string;
  dedupedSignal?: boolean;
  dedupedEvidence?: boolean;
};

type ManualIngestionPayload =
  | {
      type: "SIGNAL_CREATE";
      signalTitle: string;
      summary: string;
      signalType: string;
      market: string;
      audience: string;
      sourceTitle: string;
      sourceKind: string;
      sourceOrigin: string;
      evidenceTitle: string;
      evidenceUrl?: string;
      evidenceNote: string;
    }
  | {
      type: "EVIDENCE_APPEND";
      signalId: string;
      sourceId: string;
      signalTitle: string;
      market: string;
      sourceOrigin: string;
      sourceTitle: string;
      evidenceTitle: string;
      evidenceUrl?: string;
      evidenceNote: string;
    };

const signalTypes = [
  ["FORMAT", "Formato"],
  ["AUDIO", "Áudio"],
  ["HASHTAG", "Hashtag"],
  ["CREATOR", "Creator"],
  ["REVIVAL", "Revival"],
  ["US_TO_BR", "US > BR"],
] as const;

const sourceKinds = [
  ["MANUAL_RESEARCH", "Manual research"],
  ["INSTAGRAM_REELS_TRENDS", "Instagram Reels"],
  ["INSTAGRAM_PROFESSIONAL_DASHBOARD", "Instagram Insights"],
  ["INSTAGRAM_GRAPH_API", "Instagram Graph API"],
  ["META_AD_LIBRARY", "Meta Ad Library"],
  ["OWNED_UPLOAD", "Owned upload"],
] as const;

const operationDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Sao_Paulo",
});

function formatOperationDateTime(dateIso: string | null | undefined) {
  return dateIso ? operationDateTimeFormatter.format(new Date(dateIso)) : "sem fim";
}

function statusTone(status: string) {
  if (status === "SUCCEEDED" || status === "APPROVED") {
    return "border-[rgba(237, 73, 86,0.32)] bg-[rgba(237, 73, 86,0.09)] text-[color:var(--acid)]";
  }

  if (status === "FAILED" || status === "BLOCKED") {
    return "border-[rgba(255,111,97,0.36)] bg-[rgba(255,111,97,0.09)] text-[color:var(--coral)]";
  }

  if (status === "RUNNING" || status === "QUEUED") {
    return "border-[rgba(64,224,208,0.32)] bg-[rgba(64,224,208,0.09)] text-[color:var(--aqua)]";
  }

  return "border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] text-[color:var(--muted-strong)]";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
      {label}
      {children}
    </label>
  );
}

const fieldClass =
  "app-control w-full min-w-0 rounded-[var(--radius-sm)] px-3 py-3 text-sm normal-case tracking-normal outline-none placeholder:text-[color:var(--muted)]";

function ResultBadge({ result }: { result?: ActionResult }) {
  if (!result) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border px-3 py-2 text-sm",
        result.ok
          ? "border-[rgba(237, 73, 86,0.28)] bg-[rgba(237, 73, 86,0.075)] text-[color:var(--muted-strong)]"
          : "border-[rgba(255,111,97,0.34)] bg-[rgba(255,111,97,0.075)] text-[color:var(--muted-strong)]",
      )}
    >
      <div className="flex items-center gap-2">
        {result.ok ? (
          <CheckCircle2 className="h-4 w-4 text-[color:var(--acid)]" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-[color:var(--coral)]" aria-hidden="true" />
        )}
        <span>{result.message}</span>
      </div>
    </div>
  );
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

async function queueIngestionRequest(payload: ManualIngestionPayload): Promise<ActionResult> {
  const response = await fetch("/api/v1/ingestion/requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        data?: {
          request: {
            id: string;
            type: string;
            status: string;
            title: string;
          };
          job: {
            id: string;
            status: string;
          };
          idempotent: boolean;
        };
        error?: { message?: string };
      }
    | null;

  if (!response.ok || !body?.ok || !body.data) {
    return {
      ok: false,
      message: body?.error?.message ?? "Falha ao registrar ingestão manual.",
    };
  }

  return {
    ok: true,
    message: body.data.idempotent
      ? `Ingestão já registrada; job ${body.data.job.status.toLowerCase()} reaproveitado.`
      : `Ingestão enfileirada; job ${body.data.job.status.toLowerCase()} criado.`,
    requestId: body.data.request.id,
    jobId: body.data.job.id,
  };
}

function MetricChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "acid" | "aqua" | "coral" | "gold";
}) {
  return (
    <div className="app-card-interactive rounded-[var(--radius-md)] p-3">
      <p className="eyebrow text-[10px]">{label}</p>
      <p
        className={cn(
          "metric-number mt-2 text-xl font-semibold",
          tone === "acid" && "text-[color:var(--acid)]",
          tone === "aqua" && "text-[color:var(--aqua)]",
          tone === "coral" && "text-[color:var(--coral)]",
          tone === "gold" && "text-[color:var(--gold)]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function IngestionLab({
  lab,
  signals,
  sources,
}: {
  lab: CommandCenterData["ingestionLab"];
  signals: TrendSignal[];
  sources: SourceRecord[];
}) {
  const router = useRouter();
  const signalFormRef = useRef<HTMLFormElement>(null);
  const evidenceFormRef = useRef<HTMLFormElement>(null);
  const [signalResult, setSignalResult] = useState<ActionResult>();
  const [evidenceResult, setEvidenceResult] = useState<ActionResult>();
  const [isCreating, setIsCreating] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);

  async function submitSignal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsCreating(true);
    setSignalResult(undefined);

    try {
      const result = await queueIngestionRequest({
        type: "SIGNAL_CREATE",
        signalTitle: formValue(formData, "signalTitle"),
        summary: formValue(formData, "summary") || "Sinal criado manualmente; aguarda evidências adicionais.",
        signalType: formValue(formData, "signalType"),
        market: formValue(formData, "market"),
        audience: formValue(formData, "audience") || "Operação interna",
        sourceTitle: formValue(formData, "sourceTitle"),
        sourceKind: formValue(formData, "sourceKind"),
        sourceOrigin: formValue(formData, "sourceOrigin"),
        evidenceTitle: formValue(formData, "evidenceTitle"),
        evidenceUrl: formValue(formData, "evidenceUrl") || undefined,
        evidenceNote: formValue(formData, "evidenceNote"),
      });
      setSignalResult(result);

      if (result.ok) {
        signalFormRef.current?.reset();
        router.refresh();
      }
    } catch (error) {
      setSignalResult({
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao registrar ingestão manual.",
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const signalId = formValue(formData, "signalId");
    const sourceId = formValue(formData, "sourceId");
    const selectedSignal = signals.find((signal) => signal.id === signalId);
    const selectedSource = sources.find((source) => source.id === sourceId);

    setIsAttaching(true);
    setEvidenceResult(undefined);

    if (!selectedSignal || !selectedSource) {
      setEvidenceResult({
        ok: false,
        message: "Selecione um sinal e uma fonte antes de anexar evidência.",
      });
      setIsAttaching(false);
      return;
    }

    try {
      const result = await queueIngestionRequest({
        type: "EVIDENCE_APPEND",
        signalId,
        sourceId,
        signalTitle: selectedSignal.title,
        market: selectedSignal.market,
        sourceOrigin: selectedSource.origin,
        sourceTitle: selectedSource.title,
        evidenceTitle: formValue(formData, "appendEvidenceTitle"),
        evidenceUrl: formValue(formData, "appendEvidenceUrl") || undefined,
        evidenceNote: formValue(formData, "appendEvidenceNote"),
      });
      setEvidenceResult(result);

      if (result.ok) {
        evidenceFormRef.current?.reset();
        router.refresh();
      }
    } catch (error) {
      setEvidenceResult({
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao anexar evidência.",
      });
    } finally {
      setIsAttaching(false);
    }
  }

  const signalOptions = signals.slice(0, 12);
  const sourceOptions = sources.slice(0, 12);

  return (
    <section className="app-panel min-w-0 rounded-[var(--radius-lg)] p-4 md:p-5">
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
            <DatabaseZap className="h-4 w-4" aria-hidden="true" />
            Ingestion Lab
          </div>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">Operação rastreável</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted-strong)]">
            Entrada segura para sinais, evidências e fontes aprovadas. Sem scraping, sem conector externo frágil e sem transformar falha em insight.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[460px]">
          <MetricChip label="connectors ok" value={String(lab.stats.approvedConnectors)} tone="acid" />
          <MetricChip label="requests abertos" value={String(lab.stats.openRequests)} tone="aqua" />
          <MetricChip label="batches ok" value={String(lab.stats.succeededBatches)} tone="gold" />
          <MetricChip label="falhas" value={String(lab.stats.failedBatches)} tone="coral" />
        </div>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.form
          ref={signalFormRef}
          onSubmit={submitSignal}
          className="app-card-interactive rounded-[var(--radius-lg)] p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                novo sinal
              </p>
              <h3 className="mt-1 text-base font-semibold">Criar com evidência vinculada</h3>
            </div>
            <FileInput className="h-5 w-5 text-[color:var(--muted)]" aria-hidden="true" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="título do sinal">
              <input className={fieldClass} name="signalTitle" placeholder="Manual: formato em 3 cortes" required />
            </Field>
            <Field label="audiência">
              <input className={fieldClass} name="audience" placeholder="Dança, beleza, lifestyle" />
            </Field>
            <Field label="mercado">
              <select className={fieldClass} name="market" defaultValue="BR">
                <option value="BR">Brasil</option>
                <option value="US">EUA early signal</option>
              </select>
            </Field>
            <Field label="tipo">
              <select className={fieldClass} name="signalType" defaultValue="FORMAT">
                {signalTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="fonte">
              <input className={fieldClass} name="sourceTitle" placeholder="Review manual BR" required />
            </Field>
            <Field label="superfície">
              <select className={fieldClass} name="sourceKind" defaultValue="MANUAL_RESEARCH">
                {sourceKinds.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="origem">
              <select className={fieldClass} name="sourceOrigin" defaultValue="MANUAL">
                <option value="MANUAL">manual</option>
                <option value="OFFICIAL">oficial registrado</option>
                <option value="OWNED">próprio/licenciado</option>
              </select>
            </Field>
            <Field label="evidência">
              <input className={fieldClass} name="evidenceTitle" placeholder="Observação de cluster" required />
            </Field>
            <Field label="url opcional">
              <input className={fieldClass} name="evidenceUrl" placeholder="https://..." type="url" />
            </Field>
            <Field label="nota">
              <input className={fieldClass} name="evidenceNote" placeholder="Evidência manual, sem coleta automática" required />
            </Field>
          </div>

          <Field label="resumo">
            <textarea
              className={cn(fieldClass, "min-h-20 resize-none")}
              name="summary"
              placeholder="Resumo operacional do que foi observado e por que deve entrar no radar."
            />
          </Field>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ResultBadge result={signalResult} />
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-full border border-[rgba(237, 73, 86,0.38)] bg-[rgba(237, 73, 86,0.11)] px-4 py-2 text-sm font-semibold text-[color:var(--acid)] transition hover:bg-[rgba(237, 73, 86,0.16)] disabled:opacity-60"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              registrar ingestão
            </button>
          </div>
        </motion.form>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <form
            ref={evidenceFormRef}
            onSubmit={submitEvidence}
            className="app-card-interactive rounded-[var(--radius-lg)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
                  anexar evidência
                </p>
                <h3 className="mt-1 text-base font-semibold">Vincular a sinal existente</h3>
              </div>
              <Link2 className="h-5 w-5 text-[color:var(--muted)]" aria-hidden="true" />
            </div>

            <div className="mt-4 grid gap-3">
              <Field label="sinal">
                <select className={fieldClass} name="signalId" defaultValue={signalOptions[0]?.id}>
                  {signalOptions.map((signal) => (
                    <option key={signal.id} value={signal.id}>
                      {signal.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="fonte">
                <select className={fieldClass} name="sourceId" defaultValue={sourceOptions[0]?.id}>
                  {sourceOptions.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="evidência">
                <input className={fieldClass} name="appendEvidenceTitle" placeholder="Nova nota de prova" required />
              </Field>
              <Field label="url opcional">
                <input className={fieldClass} name="appendEvidenceUrl" placeholder="https://..." type="url" />
              </Field>
              <Field label="nota">
                <input className={fieldClass} name="appendEvidenceNote" placeholder="O que esta evidência confirma ou limita" required />
              </Field>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ResultBadge result={evidenceResult} />
              <button
                type="submit"
                disabled={isAttaching || signalOptions.length === 0 || sourceOptions.length === 0}
                className="inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-full border border-[rgba(243,201,105,0.38)] bg-[rgba(243,201,105,0.11)] px-4 py-2 text-sm font-semibold text-[color:var(--gold)] transition hover:bg-[rgba(243,201,105,0.16)] disabled:opacity-60"
              >
                {isAttaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                anexar
              </button>
            </div>
          </form>

          <div className="app-rail-card rounded-[var(--radius-lg)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
              <RadioTower className="h-4 w-4" aria-hidden="true" />
              connectors aprovados
            </div>
            <div className="mt-3 grid gap-2">
              {lab.connectors.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[rgba(64,224,208,0.2)] bg-[rgba(64,224,208,0.03)] px-3 py-4 text-center">
                  <RadioTower className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                  <p className="text-xs font-semibold text-[color:var(--muted-strong)]">Nenhum connector registrado</p>
                  <p className="text-[11px] leading-4 text-[color:var(--muted)]">Adicione uma fonte aprovada para habilitar ingestão automática.</p>
                </div>
              ) : (
                lab.connectors.slice(0, 4).map((connector) => (
                  <div key={connector.id} className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{connector.title}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">{connector.kind} - {connector.origin}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em]", statusTone(connector.status))}>
                      {connector.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="app-rail-card rounded-[var(--radius-lg)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
            <GitBranch className="h-4 w-4" aria-hidden="true" />
            lineage recente
          </div>
          <div className="mt-4 grid gap-3">
            {lab.batches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[rgba(237, 73, 86,0.16)] bg-[rgba(237, 73, 86,0.03)] p-4 text-center">
                <GitBranch className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                <p className="text-xs font-semibold text-[color:var(--muted-strong)]">Nenhum batch processado</p>
                <p className="text-[11px] leading-4 text-[color:var(--muted)]">O lineage aparece aqui assim que o primeiro job for concluído.</p>
              </div>
            ) : (
              lab.batches.slice(0, 4).map((batch) => (
                <div key={batch.id} className="app-card rounded-[var(--radius-md)] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{batch.title}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {batch.kind} - {batch.market} - {formatOperationDateTime(batch.createdAt)}
                      </p>
                    </div>
                    <span className={cn("rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em]", statusTone(batch.status))}>
                      {batch.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted-strong)]">
                    <span>{batch.requestTitle ?? "request"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                    <span>{batch.sourceTitle ?? "source"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                    <span>{batch.snapshotCount} snapshot</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                    <span>{batch.signalTitles[0] ?? "signal"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                    <span>{batch.evidenceTitles.length} evid.</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {batch.steps.map((step) => (
                      <div key={`${batch.id}-${step.name}`} className={cn("rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.1em]", statusTone(step.status))}>
                        {step.name}
                      </div>
                    ))}
                  </div>
                  {batch.error && (
                    <p className="mt-3 rounded-[var(--radius-sm)] border border-[rgba(255,111,97,0.28)] bg-[rgba(255,111,97,0.06)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--coral)]">
                      {batch.error}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="app-rail-card rounded-[var(--radius-lg)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              últimos jobs
            </div>
            <div className="mt-3 grid gap-2">
              {lab.jobs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[rgba(243,201,105,0.18)] bg-[rgba(243,201,105,0.03)] px-3 py-4 text-center">
                  <ClipboardList className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                  <p className="text-xs font-semibold text-[color:var(--muted-strong)]">Nenhum job registrado</p>
                  <p className="text-[11px] leading-4 text-[color:var(--muted)]">Jobs aparecem após a primeira ingestão enfileirada.</p>
                </div>
              ) : (
                lab.jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{job.name}</p>
                      <span className={cn("rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em]", statusTone(job.status))}>
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {job.stage ?? "stage"} - {formatOperationDateTime(job.finishedAt)}
                    </p>
                    {job.error && (
                      <p className="mt-2 rounded-[var(--radius-sm)] border border-[rgba(255,111,97,0.28)] bg-[rgba(255,111,97,0.06)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--coral)]">
                        {job.error}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[rgba(237, 73, 86,0.2)] bg-[rgba(237, 73, 86,0.065)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              boundary
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
              Ingestão aceita somente entrada manual, própria/licenciada ou superfície oficial registrada. Qualquer falha permanece visível como falha.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
