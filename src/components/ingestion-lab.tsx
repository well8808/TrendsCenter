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
import { type FormEvent, useRef, useState, useTransition } from "react";

import { attachManualEvidenceAction, createManualSignalAction } from "@/app/actions";
import type { CommandCenterData } from "@/lib/persistence/command-center";
import type { SourceRecord, TrendSignal } from "@/lib/types";
import { cn } from "@/lib/utils";

type ActionResult = {
  ok: boolean;
  message: string;
  signalId?: string;
  batchId?: string;
  dedupedSignal?: boolean;
  dedupedEvidence?: boolean;
};

const signalTypes = [
  ["FORMAT", "Formato"],
  ["AUDIO", "Audio"],
  ["HASHTAG", "Hashtag"],
  ["CREATOR", "Creator"],
  ["REVIVAL", "Revival"],
  ["US_TO_BR", "US > BR"],
] as const;

const sourceKinds = [
  ["MANUAL_RESEARCH", "Manual research"],
  ["CREATIVE_CENTER_TRENDS", "Creative Center"],
  ["TOP_ADS", "Top Ads"],
  ["KEYWORD_INSIGHTS", "Keyword Insights"],
  ["COMMERCIAL_MUSIC_LIBRARY", "Commercial Music"],
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
    return "border-[rgba(199,255,93,0.32)] bg-[rgba(199,255,93,0.09)] text-[color:var(--acid)]";
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
  "min-h-10 w-full min-w-0 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.2)] px-3 py-2 text-sm normal-case tracking-normal text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[rgba(64,224,208,0.42)]";

function ResultBadge({ result }: { result?: ActionResult }) {
  if (!result) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border px-3 py-2 text-sm",
        result.ok
          ? "border-[rgba(199,255,93,0.28)] bg-[rgba(199,255,93,0.075)] text-[color:var(--muted-strong)]"
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
    <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)] p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
      <p
        className={cn(
          "mt-2 font-mono text-xl font-semibold",
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
  const [isCreating, startCreating] = useTransition();
  const [isAttaching, startAttaching] = useTransition();

  function submitSignal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startCreating(async () => {
      const result = await createManualSignalAction(formData);
      setSignalResult(result);

      if (result.ok) {
        signalFormRef.current?.reset();
        router.refresh();
      }
    });
  }

  function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startAttaching(async () => {
      const result = await attachManualEvidenceAction(formData);
      setEvidenceResult(result);

      if (result.ok) {
        evidenceFormRef.current?.reset();
        router.refresh();
      }
    });
  }

  const signalOptions = signals.slice(0, 12);
  const sourceOptions = sources.slice(0, 12);

  return (
    <section className="min-w-0 rounded-[var(--radius-lg)] border border-[rgba(64,224,208,0.22)] bg-[linear-gradient(135deg,rgba(64,224,208,0.08),rgba(255,255,255,0.035))] p-4 md:p-5">
      <div className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
            <DatabaseZap className="h-4 w-4" aria-hidden="true" />
            Ingestion Lab
          </div>
          <h2 className="mt-2 text-xl font-semibold">Operacao manual/oficial rastreavel</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
            Entrada segura para sinais, evidencias e fontes aprovadas. Sem scraping, sem conector externo fragil e sem transformar falha em insight.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 2xl:min-w-[460px]">
          <MetricChip label="connectors ok" value={String(lab.stats.approvedConnectors)} tone="acid" />
          <MetricChip label="requests abertos" value={String(lab.stats.openRequests)} tone="aqua" />
          <MetricChip label="batches ok" value={String(lab.stats.succeededBatches)} tone="gold" />
          <MetricChip label="falhas" value={String(lab.stats.failedBatches)} tone="coral" />
        </div>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
        <motion.form
          ref={signalFormRef}
          onSubmit={submitSignal}
          className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                novo sinal
              </p>
              <h3 className="mt-1 text-base font-semibold">Criar com evidencia vinculada</h3>
            </div>
            <FileInput className="h-5 w-5 text-[color:var(--muted)]" aria-hidden="true" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="titulo do sinal">
              <input className={fieldClass} name="signalTitle" placeholder="Manual: formato em 3 cortes" required />
            </Field>
            <Field label="audiencia">
              <input className={fieldClass} name="audience" placeholder="Danca, beleza, lifestyle" />
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
            <Field label="superficie">
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
                <option value="OWNED">proprio/licenciado</option>
              </select>
            </Field>
            <Field label="evidencia">
              <input className={fieldClass} name="evidenceTitle" placeholder="Observacao de cluster" required />
            </Field>
            <Field label="url opcional">
              <input className={fieldClass} name="evidenceUrl" placeholder="https://..." type="url" />
            </Field>
            <Field label="nota">
              <input className={fieldClass} name="evidenceNote" placeholder="Evidencia manual, sem coleta automatica" required />
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
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(199,255,93,0.38)] bg-[rgba(199,255,93,0.11)] px-4 py-2 text-sm font-semibold text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.16)] disabled:opacity-60"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              registrar ingestao
            </button>
          </div>
        </motion.form>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <form
            ref={evidenceFormRef}
            onSubmit={submitEvidence}
            className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
                  anexar evidencia
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
              <Field label="evidencia">
                <input className={fieldClass} name="appendEvidenceTitle" placeholder="Nova nota de prova" required />
              </Field>
              <Field label="url opcional">
                <input className={fieldClass} name="appendEvidenceUrl" placeholder="https://..." type="url" />
              </Field>
              <Field label="nota">
                <input className={fieldClass} name="appendEvidenceNote" placeholder="O que esta evidencia confirma ou limita" required />
              </Field>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ResultBadge result={evidenceResult} />
              <button
                type="submit"
                disabled={isAttaching || signalOptions.length === 0 || sourceOptions.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(243,201,105,0.38)] bg-[rgba(243,201,105,0.11)] px-4 py-2 text-sm font-semibold text-[color:var(--gold)] transition hover:bg-[rgba(243,201,105,0.16)] disabled:opacity-60"
              >
                {isAttaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                anexar
              </button>
            </div>
          </form>

          <div className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
              <RadioTower className="h-4 w-4" aria-hidden="true" />
              connectors aprovados
            </div>
            <div className="mt-3 grid gap-2">
              {lab.connectors.length === 0 ? (
                <p className="rounded-[var(--radius-sm)] border border-[color:var(--line)] px-3 py-2 text-sm text-[color:var(--muted)]">
                  Nenhum connector registrado.
                </p>
              ) : (
                lab.connectors.slice(0, 4).map((connector) => (
                  <div key={connector.id} className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[color:var(--line)] px-3 py-2">
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

      <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
            <GitBranch className="h-4 w-4" aria-hidden="true" />
            lineage recente
          </div>
          <div className="mt-4 grid gap-3">
            {lab.batches.length === 0 ? (
              <p className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.035)] p-3 text-sm text-[color:var(--muted)]">
                Nenhum batch processado ainda.
              </p>
            ) : (
              lab.batches.slice(0, 4).map((batch) => (
                <div key={batch.id} className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.035)] p-3">
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
                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                    {batch.steps.map((step) => (
                      <div key={`${batch.id}-${step.name}`} className={cn("rounded-full border px-2 py-1 text-center text-[10px] uppercase tracking-[0.1em]", statusTone(step.status))}>
                        {step.name}
                      </div>
                    ))}
                  </div>
                  {batch.error && (
                    <p className="mt-3 text-xs text-[color:var(--coral)]">{batch.error}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              ultimos jobs
            </div>
            <div className="mt-3 grid gap-2">
              {lab.jobs.length === 0 ? (
                <p className="rounded-[var(--radius-sm)] border border-[color:var(--line)] px-3 py-2 text-sm text-[color:var(--muted)]">
                  Nenhum job registrado.
                </p>
              ) : (
                lab.jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="rounded-[var(--radius-sm)] border border-[color:var(--line)] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{job.name}</p>
                      <span className={cn("rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em]", statusTone(job.status))}>
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {job.stage ?? "stage"} - {formatOperationDateTime(job.finishedAt)}
                    </p>
                    {job.error && <p className="mt-1 text-xs text-[color:var(--coral)]">{job.error}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[rgba(199,255,93,0.2)] bg-[rgba(199,255,93,0.065)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              boundary
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
              Ingestao aceita somente entrada manual, propria/licenciada ou superficie oficial registrada. Qualquer falha permanece visivel como falha.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
