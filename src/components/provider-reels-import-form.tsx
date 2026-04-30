"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  Loader2,
  RadioTower,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { jobRunsRefreshEvent } from "@/components/job-runs-feed";
import {
  handleClientApiError,
  getProviderReelsImportStatusApi,
  submitProviderReelsImportApi,
  type ProviderReelsImportDto,
  type ProviderReelsImportMode,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const controlClass =
  "app-control rounded-[var(--radius-sm)] px-3 py-3 text-sm outline-none placeholder:text-[color:var(--muted)]";

type FormState =
  | { kind: "idle" }
  | ({ kind: "submitting"; mode: ProviderReelsImportMode; sourceTitle?: string } & ImportRunMeta)
  | ({ kind: "pending"; data: ProviderReelsImportDto; requestId: string } & ImportRunMeta)
  | { kind: "success"; data: ProviderReelsImportDto; requestId: string; elapsedMs?: number }
  | { kind: "error"; message: string; code: string; status: number; requestId: string; isTransport: boolean };

interface ImportRunMeta {
  startedAt: number;
  pollCount: number;
  targetCount: number;
  urlCount: number;
}

function parseUrls(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function modeLabel(mode: ProviderReelsImportMode) {
  return mode === "profile_reels" ? "perfis monitorados" : "links de Reels";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}

function estimateImportDurationMs(meta: Pick<ImportRunMeta, "targetCount" | "urlCount">, mode: ProviderReelsImportMode) {
  if (mode === "profile_reels") {
    return clamp(45_000 + meta.targetCount * 3_000, 55_000, 150_000);
  }

  return clamp(35_000 + meta.urlCount * 4_000, 40_000, 120_000);
}

function useClock(active: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1_000);

    return () => window.clearInterval(timer);
  }, [active]);

  return now;
}

function progressSnapshot(
  state: Extract<FormState, { kind: "submitting" | "pending" }>,
  now: number,
) {
  const mode = state.kind === "pending" ? state.data.mode : state.mode;
  const estimatedMs = estimateImportDurationMs(state, mode);
  const elapsedMs = Math.max(0, now - state.startedAt);
  const progress = state.kind === "submitting"
    ? clamp(8 + Math.round((elapsedMs / 12_000) * 10), 8, 18)
    : clamp(18 + Math.round((elapsedMs / estimatedMs) * 76), 18, 94);
  const remainingMs = Math.max(0, estimatedMs - elapsedMs);
  const stage =
    state.kind === "submitting"
      ? "Criando job seguro"
      : state.pollCount <= 1
        ? "Snapshot iniciado"
        : elapsedMs > estimatedMs
          ? "Tempo estimado passou; mantendo checagem"
          : "Bright Data preparando snapshot";

  return { elapsedMs, estimatedMs, progress, remainingMs, stage };
}

function secondsUntilNextPoll(data: ProviderReelsImportDto, now: number) {
  const nextAt = Date.parse(data.checkedAt) + (data.nextPollMs ?? 6_000);

  if (!Number.isFinite(nextAt)) {
    return undefined;
  }

  return Math.max(0, Math.ceil((nextAt - now) / 1000));
}

export function ProviderReelsImportForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mode, setMode] = useState<ProviderReelsImportMode>("profile_reels");
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.kind !== "pending") return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const { data, meta } = await getProviderReelsImportStatusApi(state.data.jobId, {
          signal: controller.signal,
        });

        window.dispatchEvent(
          new CustomEvent(jobRunsRefreshEvent, {
            detail: { jobId: data.jobId, provider: data.provider, status: data.collectionStatus },
          }),
        );

        if (data.collectionStatus === "imported") {
          setState({ kind: "success", data, requestId: meta.requestId, elapsedMs: Date.now() - state.startedAt });
          router.refresh();
          formRef.current?.reset();
          return;
        }

        if (data.collectionStatus === "failed") {
          setState({
            kind: "error",
            message: data.lastError ?? data.message,
            code: "BRIGHT_DATA_IMPORT_FAILED",
            status: 503,
            requestId: meta.requestId,
            isTransport: false,
          });
          return;
        }

        setState({
          kind: "pending",
          data,
          requestId: meta.requestId,
          startedAt: state.startedAt,
          pollCount: state.pollCount + 1,
          targetCount: state.targetCount,
          urlCount: state.urlCount,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const info = handleClientApiError(error, { context: "form:provider-reels-import:poll" });
        setState({
          kind: "error",
          message: info.message,
          code: info.code,
          status: info.status,
          requestId: info.requestId,
          isTransport: info.isTransport,
        });
      }
    }, state.data.nextPollMs ?? 6_000);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [router, state]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const urls = parseUrls(formData.get("urls"));
    const rawMaxPerProfile = Number(formData.get("maxPerProfile") ?? 10);
    const maxPerProfile = Number.isFinite(rawMaxPerProfile) ? clamp(Math.round(rawMaxPerProfile), 1, 30) : 10;
    const market = String(formData.get("market") ?? "BR") === "US" ? "US" : "BR";
    const sourceTitle = String(formData.get("sourceTitle") ?? "").trim();
    const runMeta: ImportRunMeta = {
      startedAt: Date.now(),
      pollCount: 0,
      targetCount: mode === "profile_reels" ? urls.length * maxPerProfile : urls.length,
      urlCount: urls.length,
    };

    if (urls.length === 0) {
      setState({
        kind: "error",
        message: "Informe ao menos um perfil ou link de Reel para iniciar a coleta.",
        code: "BAD_REQUEST",
        status: 400,
        requestId: "n/a",
        isTransport: false,
      });
      return;
    }

    setState({ kind: "submitting", mode, sourceTitle: sourceTitle || undefined, ...runMeta });
    startTransition(async () => {
      try {
        const { data, meta } = await submitProviderReelsImportApi({
          provider: "bright_data",
          mode,
          market,
          urls,
          maxPerProfile,
          sourceTitle: sourceTitle || undefined,
        });

        if (data.collectionStatus === "imported") {
          setState({ kind: "success", data, requestId: meta.requestId, elapsedMs: Date.now() - runMeta.startedAt });
        } else {
          setState({ kind: "pending", data, requestId: meta.requestId, ...runMeta });
        }
        window.dispatchEvent(
          new CustomEvent(jobRunsRefreshEvent, {
            detail: { jobId: data.jobId, provider: data.provider, status: data.collectionStatus },
          }),
        );
        router.refresh();
      } catch (error) {
        const info = handleClientApiError(error, { context: "form:provider-reels-import" });
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

  const busy = state.kind === "submitting" || state.kind === "pending";

  return (
    <section className="app-rail-card rounded-[var(--radius-lg)] p-5 backdrop-blur-2xl">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--hot)]">
        <span
          className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--hot)]"
          aria-hidden="true"
          style={{ animation: "live-pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite" }}
        />
        <RadioTower className="h-4 w-4" aria-hidden="true" />
        automacao de Reels
      </div>
      <h2 className="mt-3 text-lg font-semibold">Coletar de fonte licenciada</h2>
      <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
        Use Bright Data configurado no servidor. O radar salva metadados, metricas e evidencia; nao baixa midia nem cria insight sem origem.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          modo
          <select
            className={controlClass}
            name="mode"
            value={mode}
            onChange={(event) => setMode(event.currentTarget.value as ProviderReelsImportMode)}
          >
            <option value="profile_reels">Perfis: coletar Reels recentes</option>
            <option value="reel_urls">Links: coletar Reels especificos</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            mercado
            <select className={controlClass} name="market" defaultValue="BR">
              <option value="BR">BR</option>
              <option value="US">US</option>
            </select>
          </label>
          <label
            className={cn(
              "grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]",
              mode === "reel_urls" && "opacity-55",
            )}
          >
            por perfil
            <input
              className={controlClass}
              name="maxPerProfile"
              type="number"
              min={1}
              max={30}
              defaultValue={10}
              disabled={mode === "reel_urls"}
            />
          </label>
        </div>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          nome da coleta
          <input
            className={controlClass}
            name="sourceTitle"
            placeholder="Ex: Reels BR - creators adultos 18+"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          {mode === "profile_reels" ? "perfis do Instagram" : "links dos Reels"}
          <textarea
            className="min-h-32 resize-y rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[var(--control-bg)] px-3 py-3 font-mono text-xs leading-5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[rgba(64,224,208,0.58)]"
            name="urls"
            placeholder={
              mode === "profile_reels"
                ? "https://www.instagram.com/perfil/\nhttps://www.instagram.com/outroperfil/"
                : "https://www.instagram.com/reel/CODE/\nhttps://www.instagram.com/reel/OUTROCODE/"
            }
            required
          />
        </label>

        <div className="rounded-[var(--radius-md)] border border-[rgba(64,224,208,0.18)] bg-[rgba(64,224,208,0.045)] p-3 text-xs leading-5 text-[color:var(--muted-strong)]">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--aqua)]" aria-hidden="true" />
            Analise 18+ entra so como sinal de marketing, formato, linguagem e funil. Conteudo inseguro ou idade ambigua continua bloqueado na ingestao.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition",
            "border-[rgba(64,224,208,0.42)] bg-[rgba(64,224,208,0.12)] text-[color:var(--aqua)] hover:bg-[rgba(64,224,208,0.18)] disabled:opacity-70",
          )}
        >
          {state.kind === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              coletando...
            </>
          ) : state.kind === "pending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              aguardando...
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" aria-hidden="true" />
              coletar Reels
            </>
          )}
        </button>
      </form>

      <AnimatePresence mode="wait" initial={false}>
        {state.kind === "submitting" ? <SubmittingCard key="submitting" state={state} /> : null}
        {state.kind === "pending" ? <PendingCard key="pending" state={state} /> : null}
        {state.kind === "success" ? <SuccessCard key="ok" state={state} /> : null}
        {state.kind === "error" ? <ErrorCard key="err" state={state} onRetry={() => setState({ kind: "idle" })} /> : null}
      </AnimatePresence>
    </section>
  );
}

function ProgressMeter({
  state,
  title,
  message,
}: {
  state: Extract<FormState, { kind: "submitting" | "pending" }>;
  title: string;
  message: string;
}) {
  const now = useClock(true);
  const snapshot = progressSnapshot(state, now);
  const mode = state.kind === "pending" ? state.data.mode : state.mode;
  const nextPoll = state.kind === "pending" ? secondsUntilNextPoll(state.data, now) : undefined;
  const sourceTitle = state.kind === "pending" ? state.data.sourceTitle : state.sourceTitle ?? "coleta Bright Data";
  const jobLabel = state.kind === "pending" ? state.data.jobId.slice(0, 8) : "criando";
  const targetLabel = mode === "profile_reels"
    ? `${state.urlCount} perfil${state.urlCount === 1 ? "" : "s"} / ate ${state.targetCount} Reels`
    : `${state.urlCount} link${state.urlCount === 1 ? "" : "s"} de Reel`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease }}
      className="mt-4 rounded-[var(--radius-md)] border border-[rgba(64,224,208,0.32)] bg-[rgba(64,224,208,0.06)] p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {title}
          </p>
          <p className="mt-2 text-sm leading-5 text-[color:var(--muted-strong)]">{message}</p>
        </div>
        <span className="rounded-full border border-[rgba(64,224,208,0.24)] px-2 py-1 font-mono text-[10px] text-[color:var(--aqua)]">
          {snapshot.progress}%
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(239,233,220,0.08)]">
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--aqua),var(--acid))]"
          initial={false}
          animate={{ width: `${snapshot.progress}%` }}
          transition={{ duration: 0.55, ease }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] leading-5 text-[color:var(--muted)]">
        <div className="rounded-[var(--radius-sm)] border border-[rgba(239,233,220,0.08)] bg-[rgba(255,255,255,0.02)] px-2.5 py-2">
          <p className="uppercase tracking-[0.14em]">tempo</p>
          <p className="mt-1 font-mono text-[color:var(--foreground)]">{formatDuration(snapshot.elapsedMs)}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[rgba(239,233,220,0.08)] bg-[rgba(255,255,255,0.02)] px-2.5 py-2">
          <p className="uppercase tracking-[0.14em]">estimado</p>
          <p className="mt-1 font-mono text-[color:var(--foreground)]">
            {snapshot.remainingMs > 0 ? `~${formatDuration(snapshot.remainingMs)}` : "finalizando"}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid gap-1.5 text-xs leading-5">
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">etapa</dt>
          <dd className="min-w-0 text-right text-[color:var(--foreground)]">{snapshot.stage}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">alvo</dt>
          <dd className="min-w-0 truncate text-[color:var(--muted-strong)]">{targetLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">fonte</dt>
          <dd className="min-w-0 truncate text-[color:var(--foreground)]">{sourceTitle}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">job</dt>
          <dd className="font-mono text-[color:var(--aqua)]">{jobLabel}</dd>
        </div>
        {typeof nextPoll === "number" ? (
          <div className="flex justify-between gap-3">
            <dt className="text-[color:var(--muted)]">proxima checagem</dt>
            <dd className="font-mono text-[color:var(--muted-strong)]">{nextPoll}s</dd>
          </div>
        ) : null}
      </dl>

      <ol className="mt-4 grid gap-2 text-[11px] text-[color:var(--muted)]">
        {[
          { label: "job criado no radar", done: state.kind === "pending" },
          { label: "snapshot Bright Data em preparo", done: state.kind === "pending" && state.pollCount > 0 },
          { label: "normalizacao e score entram quando o snapshot fica pronto", done: false },
        ].map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px]",
                item.done
                  ? "border-[rgba(64,224,208,0.55)] bg-[rgba(64,224,208,0.14)] text-[color:var(--aqua)]"
                  : "border-[rgba(239,233,220,0.16)] text-[color:var(--muted)]",
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

function SubmittingCard({ state }: { state: Extract<FormState, { kind: "submitting" }> }) {
  return (
    <ProgressMeter
      state={state}
      title="preparando coleta"
      message="Criando o job e enviando o pedido para a Bright Data."
    />
  );
}

function PendingCard({ state }: { state: Extract<FormState, { kind: "pending" }> }) {
  return (
    <ProgressMeter
      state={state}
      title="coleta em andamento"
      message={state.data.message}
    />
  );
}

function SuccessCard({ state }: { state: Extract<FormState, { kind: "success" }> }) {
  const batchLabel = state.data.batchId ? state.data.batchId.slice(0, 8) : "n/a";
  const serverElapsedMs = Date.parse(state.data.updatedAt) - Date.parse(state.data.createdAt);
  const elapsedMs = state.elapsedMs ?? (Number.isFinite(serverElapsedMs) ? serverElapsedMs : undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease }}
      className="mt-4 rounded-[var(--radius-md)] border border-[rgba(64,224,208,0.32)] bg-[rgba(64,224,208,0.07)] p-4"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        coleta recebida
      </p>
      <dl className="mt-3 grid gap-1.5 text-xs leading-5">
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">fonte</dt>
          <dd className="min-w-0 truncate text-[color:var(--foreground)]">{state.data.sourceTitle}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">modo</dt>
          <dd className="min-w-0 truncate text-[color:var(--muted-strong)]">{modeLabel(state.data.mode)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">Reels indexados</dt>
          <dd className="font-mono text-[color:var(--aqua)]">{state.data.importedCount}</dd>
        </div>
        {typeof elapsedMs === "number" ? (
          <div className="flex justify-between gap-3">
            <dt className="text-[color:var(--muted)]">tempo total</dt>
            <dd className="font-mono text-[color:var(--muted-strong)]">{formatDuration(elapsedMs)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">lote</dt>
          <dd className="font-mono text-[color:var(--muted)]">{batchLabel}</dd>
        </div>
      </dl>
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
        {state.isTransport ? "falha de rede" : `${state.code} - ${state.status}`}
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
