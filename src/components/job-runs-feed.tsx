"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Skull,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";

import {
  ApiError,
  listJobRunsApi,
  useApiResource,
  usePolling,
  type JobRunDto,
  type JobRunsListDto,
  type JobStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;
export const jobRunsRefreshEvent = "tmcc:jobs-refresh";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
  exit: { opacity: 0, x: 8, transition: { duration: 0.24, ease } },
};

const statusMeta: Record<
  JobStatus,
  { label: string; tone: "acid" | "aqua" | "gold" | "coral" | "muted" | "violet"; Icon: typeof Loader2; animate?: boolean }
> = {
  QUEUED: { label: "em fila", tone: "muted", Icon: CircleDashed },
  RUNNING: { label: "rodando", tone: "aqua", Icon: Loader2, animate: true },
  SUCCEEDED: { label: "ok", tone: "acid", Icon: CheckCircle2 },
  FAILED: { label: "falhou", tone: "coral", Icon: XCircle },
  DEAD_LETTERED: { label: "dead letter", tone: "coral", Icon: Skull },
  CANCELED: { label: "cancelado", tone: "violet", Icon: AlertOctagon },
};

const toneClass = {
  acid: "text-[color:var(--acid)]",
  aqua: "text-[color:var(--aqua)]",
  gold: "text-[color:var(--gold)]",
  coral: "text-[color:var(--coral)]",
  violet: "text-[color:var(--violet)]",
  muted: "text-[color:var(--muted-strong)]",
} as const;

const toneBadgeClass = {
  acid: "border-[rgba(199,255,93,0.3)] bg-[rgba(199,255,93,0.08)] text-[color:var(--acid)]",
  aqua: "border-[rgba(64,224,208,0.3)] bg-[rgba(64,224,208,0.08)] text-[color:var(--aqua)]",
  gold: "border-[rgba(243,201,105,0.3)] bg-[rgba(243,201,105,0.08)] text-[color:var(--gold)]",
  coral: "border-[rgba(255,111,97,0.32)] bg-[rgba(255,111,97,0.08)] text-[color:var(--coral)]",
  violet: "border-[rgba(169,140,255,0.3)] bg-[rgba(169,140,255,0.08)] text-[color:var(--violet)]",
  muted: "border-[color:var(--line)] bg-[rgba(255,255,255,0.03)] text-[color:var(--muted-strong)]",
} as const;

const relativeFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const syncTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Sao_Paulo",
});

function relativeFrom(iso?: string, nowMs?: number | null) {
  if (!iso) return "—";
  if (!nowMs) return "—";
  const diffMs = nowMs - new Date(iso).getTime();
  const diffSec = Math.round(-diffMs / 1000);
  const absSec = Math.abs(diffSec);
  if (absSec < 60) return relativeFormatter.format(diffSec, "second");
  if (absSec < 3600) return relativeFormatter.format(Math.round(diffSec / 60), "minute");
  if (absSec < 86400) return relativeFormatter.format(Math.round(diffSec / 3600), "hour");
  return relativeFormatter.format(Math.round(diffSec / 86400), "day");
}

function hasActiveJobs(items: JobRunDto[]) {
  return items.some((job) => job.status === "QUEUED" || job.status === "RUNNING");
}

export interface JobRunsFeedProps {
  /** Hidratacao SSR opcional. */
  initialData?: JobRunsListDto;
  /** Timestamp SSR pareado ao initialData para evitar hydration mismatch. */
  initialUpdatedAt?: number;
  /** Filtra por queue (ex: "ingestion"). */
  queue?: string;
  /** Limite de itens (default 12). */
  limit?: number;
  /** Callback quando polling detecta novo estado pra recursos correlatos. */
  onChange?: (items: JobRunDto[]) => void;
  /** Pausa polling. */
  paused?: boolean;
  className?: string;
}

export function JobRunsFeed({
  initialData,
  initialUpdatedAt,
  queue,
  limit = 12,
  onChange,
  paused,
  className,
}: JobRunsFeedProps) {
  const resource = useApiResource<JobRunsListDto>(
    (signal) => listJobRunsApi({ queue, limit }, { signal }),
    [queue, limit],
    { initialData, initialUpdatedAt, telemetryContext: "job-runs-feed" },
  );
  const refetchJobs = resource.refetch;

  useEffect(() => {
    const refresh = () => {
      void refetchJobs().then((data) => {
        if (data) onChange?.(data.items);
      });
    };

    window.addEventListener(jobRunsRefreshEvent, refresh);

    return () => {
      window.removeEventListener(jobRunsRefreshEvent, refresh);
    };
  }, [onChange, refetchJobs]);

  usePolling(
    async () => {
      const data = await resource.refetch();
      if (data) onChange?.(data.items);
    },
    {
      enabled: !paused,
      activeIntervalMs: 3500,
      idleIntervalMs: 18000,
      isActive: () => (resource.data ? hasActiveJobs(resource.data.items) : false),
    },
  );

  const items = resource.data?.items ?? [];
  const active = items.filter((job) => job.status === "QUEUED" || job.status === "RUNNING").length;
  const failed = items.filter((job) => job.status === "FAILED" || job.status === "DEAD_LETTERED").length;
  const succeeded = items.filter((job) => job.status === "SUCCEEDED").length;
  const displayNow = resource.updatedAt ?? initialUpdatedAt ?? null;

  return (
    <section className={cn("app-rail-card relative overflow-hidden rounded-[var(--radius-lg)] p-4", className)}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="card-eyebrow flex items-center gap-2 text-[color:var(--aqua)]">
            <span className={cn("relative inline-flex h-2 w-2")}>
              <span
                className={cn(
                  "absolute inset-0 rounded-full",
                  active > 0 ? "bg-[color:var(--aqua)]" : "bg-[color:var(--muted)]",
                )}
                style={active > 0 ? { animation: "live-pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite" } : undefined}
              />
              <span
                className={cn(
                  "relative h-2 w-2 rounded-full",
                  active > 0 ? "bg-[color:var(--aqua)]" : "bg-[color:var(--muted)]",
                )}
              />
            </span>
            jobs {queue ? `· ${queue}` : ""}
          </p>
          <h2 className="mt-1.5 text-base font-semibold leading-tight">Fila operacional</h2>
        </div>
        <button
          type="button"
          onClick={() => resource.refetch()}
          disabled={resource.isFetching}
          className="app-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)] transition hover:text-[color:var(--aqua)] disabled:opacity-60"
          aria-label="Atualizar jobs"
        >
          <RefreshCw className={cn("h-3 w-3", resource.isFetching && "animate-spin")} aria-hidden="true" />
          {resource.isFetching ? "sync" : "atualizar"}
        </button>
      </header>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatPill label="ativos" value={active} tone="aqua" />
        <StatPill label="ok" value={succeeded} tone="acid" />
        <StatPill label="falhas" value={failed} tone="coral" />
      </div>

      {resource.status === "error" && resource.error ? (
        <ErrorBanner error={resource.error} onRetry={() => resource.refetch()} />
      ) : null}

      <div className="mt-3 grid gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.length === 0 && resource.status === "success" ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease }}
              className="rounded-[var(--radius-md)] border border-dashed border-[rgba(239,233,220,0.12)] bg-[rgba(255,255,255,0.016)] p-5 text-center"
            >
              <motion.div
                aria-hidden="true"
                animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.36, 0.18] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-3 h-9 w-9 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(64,224,208,0.4), transparent 70%)" }}
              />
              <CircleDashed className="mx-auto mb-2 h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
              <p className="text-xs font-semibold text-[color:var(--muted-strong)]">Fila operacional vazia</p>
              <p className="mt-1 text-[11px] leading-5 text-[color:var(--muted)]">
                Dispare uma ingestão para popular a fila de jobs.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                pronto · aguardando job
              </div>
            </motion.div>
          ) : null}

          {items.map((job) => (
            <JobRow key={job.id} job={job} nowMs={displayNow} />
          ))}
        </AnimatePresence>
      </div>

      {resource.updatedAt ? (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          sync {syncTimeFormatter.format(new Date(resource.updatedAt))}
          {resource.requestId ? ` · req ${resource.requestId.slice(0, 8)}` : null}
        </p>
      ) : null}
    </section>
  );
}

function JobRow({ job, nowMs }: { job: JobRunDto; nowMs: number | null }) {
  const meta = statusMeta[job.status];
  const Icon = meta.Icon;
  const isRetry = job.attemptCount > 1 && job.status !== "DEAD_LETTERED";

  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-2 text-sm font-medium leading-5">
            <Icon
              className={cn("h-3.5 w-3.5 shrink-0", toneClass[meta.tone], meta.animate && "animate-spin")}
              aria-hidden="true"
            />
            <span className="min-w-0 truncate">{job.name}</span>
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            {job.queue} · {job.handler}
            {job.stage ? ` · ${job.stage}` : null}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
            toneBadgeClass[meta.tone],
          )}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[color:var(--muted)]">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          criado {relativeFrom(job.createdAt, nowMs)}
        </span>
        {job.startedAt ? (
          <span className="inline-flex items-center gap-1">
            <Play className="h-3 w-3" aria-hidden="true" />
            iniciou {relativeFrom(job.startedAt, nowMs)}
          </span>
        ) : null}
        {job.finishedAt ? (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            terminou {relativeFrom(job.finishedAt, nowMs)}
          </span>
        ) : null}
        {isRetry ? (
          <span className="inline-flex items-center gap-1 text-[color:var(--gold)]">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            tentativa {job.attemptCount}/{job.maxAttempts}
          </span>
        ) : null}
      </div>

      {job.lastError ? (
        <p className="mt-2 rounded-[var(--radius-sm)] border border-[rgba(255,111,97,0.28)] bg-[rgba(255,111,97,0.06)] px-2.5 py-1.5 font-mono text-[11px] leading-5 text-[color:var(--coral)]">
          {job.lastError}
        </p>
      ) : null}
    </motion.div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: "aqua" | "acid" | "coral" }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border px-2.5 py-2 text-left",
        toneBadgeClass[tone],
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">{label}</p>
      <p className="metric-number mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ErrorBanner({
  error,
  onRetry,
}: {
  error: { message: string; code: string; status: number; requestId: string; isTransport: boolean };
  onRetry: () => void;
}) {
  return (
    <div className="mt-3 rounded-[var(--radius-md)] border border-[rgba(255,111,97,0.32)] bg-[rgba(255,111,97,0.06)] p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--coral)]">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        {error.isTransport ? "falha de rede" : `${error.code} · ${error.status}`}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-[color:var(--muted-strong)]">{error.message}</p>
      {!error.isTransport && error.requestId !== "n/a" ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
          req {error.requestId}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.38)] hover:text-[color:var(--aqua)]"
      >
        <RefreshCw className="h-3 w-3" aria-hidden="true" />
        tentar novamente
      </button>
    </div>
  );
}

export { ApiError };
