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
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { jobRunsRefreshEvent } from "@/components/job-runs-feed";
import {
  handleClientApiError,
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
  | { kind: "submitting" }
  | { kind: "success"; data: ProviderReelsImportDto; requestId: string }
  | { kind: "error"; message: string; code: string; status: number; requestId: string; isTransport: boolean };

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

export function ProviderReelsImportForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mode, setMode] = useState<ProviderReelsImportMode>("profile_reels");
  const [state, setState] = useState<FormState>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const urls = parseUrls(formData.get("urls"));
    const maxPerProfile = Number(formData.get("maxPerProfile") ?? 10);
    const market = String(formData.get("market") ?? "BR") === "US" ? "US" : "BR";
    const sourceTitle = String(formData.get("sourceTitle") ?? "").trim();

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

    setState({ kind: "submitting" });
    startTransition(async () => {
      try {
        const { data, meta } = await submitProviderReelsImportApi({
          provider: "bright_data",
          mode,
          market,
          urls,
          maxPerProfile: Number.isFinite(maxPerProfile) ? maxPerProfile : undefined,
          sourceTitle: sourceTitle || undefined,
        });

        setState({ kind: "success", data, requestId: meta.requestId });
        window.dispatchEvent(
          new CustomEvent(jobRunsRefreshEvent, {
            detail: { batchId: data.batchId, provider: data.provider },
          }),
        );
        router.refresh();
        form.reset();
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

  const submitting = state.kind === "submitting";

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

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
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
          disabled={submitting}
          className={cn(
            "inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition",
            "border-[rgba(64,224,208,0.42)] bg-[rgba(64,224,208,0.12)] text-[color:var(--aqua)] hover:bg-[rgba(64,224,208,0.18)] disabled:opacity-70",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              coletando...
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
        {state.kind === "success" ? <SuccessCard key="ok" state={state} /> : null}
        {state.kind === "error" ? <ErrorCard key="err" state={state} onRetry={() => setState({ kind: "idle" })} /> : null}
      </AnimatePresence>
    </section>
  );
}

function SuccessCard({ state }: { state: Extract<FormState, { kind: "success" }> }) {
  const batchLabel = state.data.batchId ? state.data.batchId.slice(0, 8) : "n/a";

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
