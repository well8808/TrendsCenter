"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, DatabaseZap, FileInput, Loader2, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";

import {
  handleClientApiError,
  submitIngestionRequestApi,
  type IngestionRequestAckDto,
  type IngestionRequestBody,
} from "@/lib/api";
import { jobRunsRefreshEvent } from "@/components/job-runs-feed";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const controlClass =
  "app-control rounded-[var(--radius-sm)] px-3 py-3 text-sm outline-none placeholder:text-[color:var(--muted)]";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; ack: IngestionRequestAckDto; requestId: string }
  | { kind: "error"; message: string; code: string; status: number; requestId: string; isTransport: boolean };

interface ResultFeedback {
  onAck?: (ack: IngestionRequestAckDto) => void;
}

export function IngestionRequestForm({ onAck }: ResultFeedback) {
  const [, startTransition] = useTransition();
  const [state, setState] = useState<FormState>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body: IngestionRequestBody = {
      type: "OFFICIAL_SNAPSHOT",
      sourceTitle: String(formData.get("sourceTitle") ?? "").trim(),
      sourceKind: String(formData.get("sourceKind") ?? "").trim(),
      sourceOrigin: String(formData.get("sourceOrigin") ?? "").trim() as IngestionRequestBody["sourceOrigin"],
      market: String(formData.get("market") ?? "").trim() as IngestionRequestBody["market"],
      sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || undefined,
      payloadJson: String(formData.get("payloadJson") ?? "").trim(),
    };

    if (!body.sourceTitle || !body.payloadJson) {
      setState({
        kind: "error",
        message: "Nome da fonte e dados do lote sao obrigatorios.",
        code: "BAD_REQUEST",
        status: 400,
        requestId: "n/a",
        isTransport: false,
      });
      return;
    }

    setState({ kind: "submitting" });
    startTransition(async () => {
      try {
        const { data, meta } = await submitIngestionRequestApi(body);
        setState({ kind: "success", ack: data, requestId: meta.requestId });
        onAck?.(data);
        window.dispatchEvent(
          new CustomEvent(jobRunsRefreshEvent, {
            detail: { jobId: data.job.id, requestId: data.request.id },
          }),
        );
        form.reset();
      } catch (error) {
        // Central: normaliza, reporta telemetria e trata 401 (redirect /login).
        const info = handleClientApiError(error, { context: "form:ingestion-request" });
        setState({
          kind: "error",
          message: info.message,
          code: info.code,
          status: info.status,
          requestId: info.requestId,
          isTransport: info.isTransport,
        });
      }
    });
  }

  const submitting = state.kind === "submitting";

  return (
    <section className="app-rail-card rounded-[var(--radius-lg)] p-5 backdrop-blur-2xl">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
        <span
          className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--aqua)]"
          aria-hidden="true"
          style={{ animation: "live-pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite" }}
        />
        <DatabaseZap className="h-4 w-4" aria-hidden="true" />
        entrada de dados
      </div>
      <h2 className="mt-3 text-lg font-semibold">Adicionar dados ao arquivo</h2>
      <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
        Cole dados de uma fonte oficial, propria ou licenciada para transformar em sinais acompanhaveis.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          nome da fonte
          <input className={controlClass} name="sourceTitle" placeholder="Ex: Instagram Reels BR - abril 2026" required />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          link da fonte
          <input className={controlClass} name="sourceUrl" placeholder="https://..." type="url" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            mercado
            <select className={controlClass} name="market" defaultValue="BR">
              <option value="BR">BR</option>
              <option value="US">US</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            origem
            <select className={controlClass} name="sourceOrigin" defaultValue="MANUAL">
              <option value="MANUAL">manual</option>
              <option value="OFFICIAL">oficial</option>
              <option value="OWNED">próprio</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          origem dos dados
          <select className={controlClass} name="sourceKind" defaultValue="MANUAL_RESEARCH">
            <option value="MANUAL_RESEARCH">Pesquisa manual</option>
            <option value="INSTAGRAM_REELS_TRENDS">Instagram Reels</option>
            <option value="INSTAGRAM_PROFESSIONAL_DASHBOARD">Painel profissional</option>
            <option value="INSTAGRAM_GRAPH_API">Conta Instagram conectada</option>
            <option value="META_AD_LIBRARY">Biblioteca de anuncios</option>
            <option value="OWNED_UPLOAD">Arquivo proprio/licenciado</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          dados do lote
          <textarea
            className="min-h-48 resize-y rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[var(--control-bg)] px-3 py-3 font-mono text-xs leading-5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[rgba(64,224,208,0.58)]"
            name="payloadJson"
            placeholder="Cole aqui o lote exportado pela fonte parceira ou oficial"
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition",
            "border-[rgba(237, 73, 86,0.42)] bg-[rgba(237, 73, 86,0.14)] text-[color:var(--acid)] hover:bg-[rgba(237, 73, 86,0.2)] disabled:opacity-70",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              salvando...
            </>
          ) : (
            <>
              <FileInput className="h-4 w-4" aria-hidden="true" />
              adicionar ao arquivo
            </>
          )}
        </button>
      </form>

      <AnimatePresence mode="wait" initial={false}>
        {state.kind === "success" ? <SuccessCard key="ok" state={state} /> : null}
        {state.kind === "error" ? <ErrorCard key="err" state={state} onRetry={() => setState({ kind: "idle" })} /> : null}
      </AnimatePresence>
    </section>
  );
}

function SuccessCard({ state }: { state: Extract<FormState, { kind: "success" }> }) {
  const { ack, requestId } = state;
  const jobTone = ack.job.status === "SUCCEEDED" ? "acid" : "aqua";
  const jobLabel =
    ack.job.status === "QUEUED"
      ? "enfileirado"
      : ack.job.status === "RUNNING"
      ? "processando"
      : ack.job.status === "SUCCEEDED"
      ? "concluído"
      : ack.job.status.toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease }}
      className="mt-4 rounded-[var(--radius-md)] border border-[rgba(237, 73, 86,0.32)] bg-[rgba(237, 73, 86,0.07)] p-4"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {ack.idempotent ? "entrada ja registrada" : "dados recebidos"}
      </p>
      <dl className="mt-3 grid gap-1.5 text-xs leading-5">
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">entrada</dt>
          <dd className="min-w-0 truncate text-[color:var(--muted-strong)]">recebida</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">título</dt>
          <dd className="min-w-0 truncate text-[color:var(--foreground)]">{ack.request.title}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">processamento</dt>
          <dd className={cn("min-w-0 truncate font-mono", jobTone === "acid" ? "text-[color:var(--acid)]" : "text-[color:var(--aqua)]")}>
            {jobLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">codigo</dt>
          <dd className="min-w-0 truncate font-mono text-[color:var(--muted)]">{requestId}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-[color:var(--muted-strong)]">
        Acompanhe o processamento em <strong>Atualizacoes do arquivo</strong>.
      </p>
    </motion.div>
  );
}

function ErrorCard({
  state,
  onRetry,
}: {
  state: Extract<FormState, { kind: "error" }>;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease }}
      className="mt-4 rounded-[var(--radius-md)] border border-[rgba(255,111,97,0.32)] bg-[rgba(255,111,97,0.06)] p-4"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--coral)]">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {state.isTransport ? "falha de rede" : `${state.code} · ${state.status}`}
      </p>
      <p className="mt-2 text-sm leading-5 text-[color:var(--muted-strong)]">{state.message}</p>
      {!state.isTransport && state.requestId !== "n/a" ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
          codigo {state.requestId.slice(0, 8)}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.38)] hover:text-[color:var(--aqua)]"
      >
        <RefreshCw className="h-3 w-3" aria-hidden="true" />
        fechar alerta
      </button>
    </motion.div>
  );
}
