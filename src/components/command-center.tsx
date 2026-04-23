"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ArrowDownUp,
  AudioLines,
  Bell,
  Bookmark,
  Command,
  Database,
  DatabaseZap,
  FileWarning,
  Filter,
  Flame,
  Gauge,
  Globe2,
  History,
  Inbox,
  LayoutDashboard,
  LockKeyhole,
  Radar,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  TrendingUp,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import { toggleSavedSignalAction } from "@/app/actions";
import { IngestionLab } from "@/components/ingestion-lab";
import { SourcePill } from "@/components/source-pill";
import { StatePanel, LoadingSkeleton } from "@/components/state-panels";
import { TrendCard } from "@/components/trend-card";
import type { CommandCenterData } from "@/lib/persistence/command-center";
import {
  filterSignals,
  rankSignals,
  summarizeSignals,
  type MarketFilter,
  type PriorityFilter,
  type SortMode,
  type TypeFilter,
} from "@/lib/signal-analysis";
import type { SignalPriority, TrendSignal, WorkspaceState } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Command Center", icon: LayoutDashboard, active: true },
  { label: "Radar BR", icon: Radar },
  { label: "US Early Signals", icon: Globe2 },
  { label: "Audios", icon: AudioLines },
  { label: "Formatos", icon: Activity },
  { label: "Hashtags", icon: Tags },
  { label: "Creators", icon: UserRoundCheck },
  { label: "Revival Lab", icon: History },
  { label: "Evidence Inbox", icon: Inbox },
  { label: "Ingestion Lab", icon: DatabaseZap },
  { label: "Upload Lab", icon: LockKeyhole },
  { label: "Compliance", icon: ShieldCheck },
];

const stateOptions: { value: WorkspaceState; label: string }[] = [
  { value: "ready", label: "Live" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
];

const pipelineItems = [
  { title: "Ingestao", body: "manual/oficial", icon: Zap },
  { title: "Normalizacao", body: "dedupe e taxonomia", icon: Activity },
  { title: "Scoring", body: "score + risco", icon: Gauge },
  { title: "Compliance", body: "bloqueios seguros", icon: FileWarning },
];

const marketOptions: { value: MarketFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "BR", label: "Brasil" },
  { value: "US", label: "EUA" },
];

const typeOptions: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "Tudo" },
  { value: "FORMAT", label: "Formatos" },
  { value: "AUDIO", label: "Audios" },
  { value: "HASHTAG", label: "Hashtags" },
  { value: "CREATOR", label: "Creators" },
  { value: "REVIVAL", label: "Revival" },
  { value: "US_TO_BR", label: "US > BR" },
];

const priorityOptions: { value: PriorityFilter; label: string }[] = [
  { value: "ALL", label: "Tudo" },
  { value: "now", label: "Agora" },
  { value: "next", label: "Proximo" },
  { value: "watch", label: "Watch" },
  { value: "hold", label: "Hold" },
];

const sortOptions: { value: SortMode; label: string }[] = [
  { value: "priority", label: "Prioridade" },
  { value: "score", label: "Score" },
  { value: "risk", label: "Risco" },
  { value: "freshness", label: "Frescura" },
];

const priorityLabel: Record<SignalPriority, string> = {
  now: "agora",
  next: "proximo",
  watch: "watch",
  hold: "hold",
};

const sourceDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

function formatSourceDate(dateIso: string) {
  return sourceDateFormatter.format(new Date(dateIso));
}

const fallbackPersistence: CommandCenterData["persistence"] = {
  mode: "error-fallback",
  label: "banco indisponivel",
  detail: "Postgres nao respondeu; nenhum insight ficticio foi carregado.",
};

const fallbackIngestionLab: CommandCenterData["ingestionLab"] = {
  connectors: [],
  requests: [],
  batches: [],
  jobs: [],
  stats: {
    approvedConnectors: 0,
    openRequests: 0,
    failedBatches: 0,
    succeededBatches: 0,
  },
};

function SegmentButton<T extends string>({
  value,
  active,
  onClick,
  children,
}: {
  value: T;
  active: boolean;
  onClick: (value: T) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition duration-200",
        active
          ? "border border-[rgba(199,255,93,0.34)] bg-[rgba(199,255,93,0.12)] text-[color:var(--acid)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border border-transparent text-[color:var(--muted)] hover:border-[color:var(--line)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[color:var(--foreground)]",
      )}
    >
      {children}
    </button>
  );
}

function MetricTile({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "acid" | "aqua" | "coral" | "gold";
}) {
  return (
    <motion.div layout className="app-card-interactive rounded-[var(--radius-md)] p-4">
      <p className="eyebrow">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="metric-number text-3xl font-semibold leading-none">{value}</p>
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-[11px] font-medium",
            tone === "acid" && "bg-[rgba(199,255,93,0.12)] text-[color:var(--acid)]",
            tone === "aqua" && "bg-[rgba(64,224,208,0.12)] text-[color:var(--aqua)]",
            tone === "coral" && "bg-[rgba(255,111,97,0.12)] text-[color:var(--coral)]",
            tone === "gold" && "bg-[rgba(243,201,105,0.12)] text-[color:var(--gold)]",
          )}
        >
          {delta}
        </span>
      </div>
    </motion.div>
  );
}

function MarketBridge({ signals }: { signals: TrendSignal[] }) {
  const brTop = signals.find((signal) => signal.market === "BR");
  const usTop = signals.find((signal) => signal.market === "US");
  const transfer = usTop?.scoreInput.usTransferability ?? 0;

  return (
    <section className="app-panel grid min-w-0 gap-3 rounded-[var(--radius-lg)] p-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_220px]">
      {[brTop, usTop].map((signal, index) => (
        <div
          key={signal?.id ?? index}
          className="app-card-interactive relative min-w-0 overflow-hidden rounded-[var(--radius-md)] p-4"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(64,224,208,0.44)] to-transparent" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {index === 0 ? "top BR agora" : "early signal EUA"}
          </p>
          {signal ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold leading-5">{signal.title}</h2>
                <span className="font-mono text-lg text-[color:var(--foreground)]">{signal.score.value}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{signal.decision}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--muted)]">Sem sinal visivel neste filtro.</p>
          )}
        </div>
      ))}

      <div className="min-w-0 rounded-[var(--radius-md)] border border-[rgba(199,255,93,0.22)] bg-[linear-gradient(180deg,rgba(199,255,93,0.1),rgba(199,255,93,0.045))] p-4 lg:col-span-2 2xl:col-span-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          ponte US &gt; BR
        </div>
        <p className="metric-number mt-3 text-4xl font-semibold leading-none">{transfer}</p>
        <p className="mt-1 text-xs leading-5 text-[color:var(--muted-strong)]">
          Transferencia calculada a partir dos sinais persistidos. So vira acao com fonte oficial ou evidencia BR.
        </p>
      </div>
    </section>
  );
}

function EvidenceInspector({
  signal,
  savedCount,
  storageLabel,
}: {
  signal?: TrendSignal;
  savedCount: number;
  storageLabel: string;
}) {
  if (!signal) {
    return (
      <section className="app-rail-card min-w-0 rounded-[var(--radius-lg)] px-4 py-3.5">
        <p className="text-xs font-medium leading-5 text-[color:var(--muted-strong)]">
          Selecione um sinal para revisar evidencia.
        </p>
      </section>
    );
  }

  return (
    <section className="app-rail-card min-w-0 rounded-[var(--radius-lg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
            Evidence desk
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-6">{signal.title}</h2>
        </div>
        <span className="rounded-full border border-[rgba(199,255,93,0.3)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--acid)]">
          {priorityLabel[signal.priority]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {signal.history.map((item, index) => (
          <div key={`${item.label}-${item.value}-${index}`} className="rounded-[var(--radius-sm)] border border-[color:var(--line)] p-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{item.label}</p>
            <p
              className={cn(
                "mt-1 text-sm font-semibold",
                item.tone === "acid" && "text-[color:var(--acid)]",
                item.tone === "aqua" && "text-[color:var(--aqua)]",
                item.tone === "coral" && "text-[color:var(--coral)]",
                item.tone === "gold" && "text-[color:var(--gold)]",
                item.tone === "violet" && "text-[color:var(--violet)]",
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <SourcePill source={signal.source} />
        <p className="mt-3 text-xs leading-5 text-[color:var(--muted)]">
          {signal.source.coverage}. Gap: {signal.source.gap}.
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        {signal.evidence.map((item) => (
          <div
            key={item.id}
            className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <span className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                {item.quality}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[var(--radius-sm)] border border-[rgba(64,224,208,0.22)] bg-[rgba(64,224,208,0.06)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--aqua)]">
          workspace flow
        </p>
        <p className="mt-2 text-sm leading-5 text-[color:var(--muted-strong)]">
          {savedCount} sinais salvos em {storageLabel}. Proxima acao sugerida: {signal.nextAction}
        </p>
      </div>
    </section>
  );
}

function SavedAndHistory({
  savedSignals,
  revivalSignals,
}: {
  savedSignals: TrendSignal[];
  revivalSignals: TrendSignal[];
}) {
  return (
    <section className="app-rail-card min-w-0 rounded-[var(--radius-lg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--aqua)]">
            Saved / revival
          </p>
          <h2 className="mt-1.5 text-base font-semibold">Fila de decisao</h2>
        </div>
        <Bookmark className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
      </div>

      <div className="mt-3.5 grid gap-2.5">
        {savedSignals.length > 0 ? (
          savedSignals.slice(0, 4).map((signal) => (
            <div
              key={signal.id}
              className="app-rail-item rounded-[var(--radius-md)] border-[rgba(199,255,93,0.18)] bg-[rgba(199,255,93,0.05)] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-medium leading-5">{signal.title}</p>
                <span className="metric-number shrink-0 text-sm text-[color:var(--acid)]">{signal.score.value}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[color:var(--muted)]">{signal.nextAction}</p>
            </div>
          ))
        ) : (
          <div className="app-rail-empty rounded-[var(--radius-md)] px-3 py-2.5 text-xs leading-5">
            Nenhum sinal salvo ainda. Use o marcador dos cards para montar a fila.
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[color:var(--line)] pt-3.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          revival watch
        </div>
        <div className="mt-2.5 grid gap-2">
          {revivalSignals.length > 0 ? (
            revivalSignals.map((signal) => (
              <div key={signal.id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-[color:var(--muted-strong)]">{signal.title}</span>
                <span className="app-pill shrink-0 rounded-full px-2 py-1 text-[11px]">
                  {signal.stage}
                </span>
              </div>
            ))
          ) : (
            <div className="app-rail-empty rounded-[var(--radius-md)] px-3 py-2.5 text-xs leading-5">
              Sem revival ativo nesta leitura.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function CommandCenter({
  signals,
  sources,
  persistence = fallbackPersistence,
  ingestionLab = fallbackIngestionLab,
  tenant,
}: CommandCenterData) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(signals.length > 0 ? "ready" : "empty");
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [selectedSignalId, setSelectedSignalId] = useState(signals[0]?.id);
  const [savedIds, setSavedIds] = useState(() => new Set(signals.filter((signal) => signal.saved).map((signal) => signal.id)));
  const [isSaving, startSavingTransition] = useTransition();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const filters = useMemo(
    () => ({
      query,
      market: marketFilter,
      type: typeFilter,
      priority: priorityFilter,
      sort: sortMode,
    }),
    [marketFilter, priorityFilter, query, sortMode, typeFilter],
  );

  const filteredSignals = useMemo(() => {
    return rankSignals(filterSignals(signals, filters), sortMode);
  }, [filters, signals, sortMode]);

  const summary = useMemo(() => summarizeSignals(signals), [signals]);
  const selectedSignal =
    signals.find((signal) => signal.id === selectedSignalId) ?? filteredSignals[0] ?? signals[0];
  const savedSignals = useMemo(
    () => rankSignals(signals.filter((signal) => savedIds.has(signal.id)), "priority"),
    [savedIds, signals],
  );
  const revivalSignals = useMemo(
    () => signals.filter((signal) => signal.type === "REVIVAL" || signal.stage === "revival"),
    [signals],
  );

  function toggleSaved(signalId: string) {
    const wasSaved = savedIds.has(signalId);

    setSavedIds((current) => {
      const next = new Set(current);

      if (next.has(signalId)) {
        next.delete(signalId);
      } else {
        next.add(signalId);
      }

      return next;
    });

    if (persistence.mode !== "database") {
      return;
    }

    startSavingTransition(async () => {
      const result = await toggleSavedSignalAction(signalId);

      if (!result.ok) {
        setSavedIds((current) => {
          const next = new Set(current);

          if (wasSaved) {
            next.add(signalId);
          } else {
            next.delete(signalId);
          }

          return next;
        });
      }
    });
  }

  function logout() {
    startLogoutTransition(async () => {
      await logoutAction();
    });
  }

  const metricTiles = [
    {
      label: "Sinais visiveis",
      value: String(filteredSignals.length).padStart(2, "0"),
      delta: `${summary.highPriorityCount} prioritarios`,
      tone: "acid" as const,
    },
    {
      label: "BR / US radar",
      value: `${summary.brCount}/${summary.usCount}`,
      delta: persistence.mode === "database" ? "Postgres" : "aguardando DB",
      tone: "aqua" as const,
    },
    {
      label: "Evidencias",
      value: String(summary.evidenceCount).padStart(2, "0"),
      delta: persistence.mode === "database" ? "persistidas" : "sem fixture",
      tone: "gold" as const,
    },
    {
      label: "Score medio",
      value: String(summary.avgScore),
      delta: "score v0.1",
      tone: "coral" as const,
    },
  ];

  return (
    <main className="relative min-h-dvh">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" />

      <div className="relative z-0 mx-auto grid min-h-dvh w-full max-w-[1840px] gap-0 px-2 py-2 sm:px-3 sm:py-3 lg:grid-cols-[244px_minmax(0,1fr)] lg:py-0 xl:grid-cols-[244px_minmax(0,1fr)_330px] 2xl:grid-cols-[264px_minmax(0,1fr)_360px]">
        <aside className="scrollbar-soft hidden min-w-0 border-r border-[rgba(239,233,220,0.11)] bg-[rgba(6,6,5,0.76)] p-4 backdrop-blur-2xl lg:sticky lg:top-0 lg:block lg:h-[100dvh] lg:self-start lg:overflow-y-auto lg:overscroll-contain">
          <div className="flex min-h-full flex-col">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[color:var(--acid)] text-black shadow-[0_0_34px_rgba(199,255,93,0.16)]">
                <Command className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Market Intel</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">TikTok Command Center</p>
              </div>
            </div>

            <nav className="mt-8 grid gap-0.5" aria-label="Navegacao principal">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    className={cn(
                      "relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm text-[color:var(--muted)] transition duration-200",
                      item.active
                        ? "bg-[rgba(255,255,255,0.055)] text-[color:var(--foreground)] before:absolute before:inset-y-2 before:left-0 before:w-px before:rounded-full before:bg-[color:var(--acid)]"
                        : "hover:bg-[rgba(255,255,255,0.035)] hover:text-[color:var(--muted-strong)]",
                    )}
                    type="button"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="app-rail-card mt-auto rounded-[var(--radius-md)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {tenant.workspaceName}
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                {tenant.userEmail} - {tenant.role.toLowerCase()}. Dados isolados por workspace e sessao obrigatoria.
              </p>
              <button
                className="mt-4 rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)] transition hover:border-[rgba(255,111,97,0.36)] hover:text-[color:var(--coral)]"
                type="button"
                onClick={logout}
                disabled={isLoggingOut}
              >
                sair
              </button>
              <Link
                className="ml-2 inline-flex rounded-full border border-[rgba(64,224,208,0.28)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--aqua)] transition hover:bg-[rgba(64,224,208,0.08)]"
                href="/workspace"
              >
                settings
              </Link>
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-[rgba(7,7,6,0.44)] backdrop-blur-xl lg:my-3 lg:rounded-[var(--radius-lg)] lg:border-x lg:border-[rgba(239,233,220,0.12)]">
          <header className="app-hero m-0 rounded-none border-x-0 border-t-0 px-4 py-5 md:px-6 lg:rounded-t-[var(--radius-lg)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[color:var(--acid)] text-black lg:hidden">
                  <Command className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[rgba(199,255,93,0.42)] bg-[rgba(199,255,93,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                      {persistence.mode === "database" ? "live data" : "safe fallback"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        persistence.mode === "database"
                          ? "border-[rgba(64,224,208,0.42)] bg-[rgba(64,224,208,0.12)] text-[color:var(--aqua)]"
                          : "border-[rgba(243,201,105,0.42)] bg-[rgba(243,201,105,0.12)] text-[color:var(--gold)]",
                      )}
                    >
                      {isSaving ? "gravando..." : persistence.label}
                    </span>
                  </div>
                  <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-normal md:text-4xl">
                    Command Center
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
                    {persistence.detail} Workspace: {tenant.workspaceName} - {tenant.role.toLowerCase()}.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <label className="app-control flex min-h-[var(--control-height)] min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-2 text-sm text-[color:var(--muted-strong)] sm:min-w-[320px] xl:w-[390px] xl:flex-none">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar sinais, fontes, creators..."
                    className="min-w-0 flex-1 bg-transparent text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted)]"
                  />
                </label>
                <button className="app-control grid h-[var(--control-height)] w-[var(--control-height)] place-items-center rounded-full text-[color:var(--muted-strong)] hover:text-[color:var(--aqua)]">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Filtros</span>
                </button>
                <button className="app-control grid h-[var(--control-height)] w-[var(--control-height)] place-items-center rounded-full text-[color:var(--muted-strong)] hover:text-[color:var(--aqua)]">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Alertas</span>
                </button>
                <button
                  className="h-[var(--control-height)] rounded-full border border-[color:var(--line)] bg-[var(--control-bg)] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-strong)] transition hover:border-[rgba(255,111,97,0.42)] hover:text-[color:var(--coral)]"
                  type="button"
                  onClick={logout}
                  disabled={isLoggingOut}
                >
                  sair
                </button>
                <Link
                  className="inline-flex h-[var(--control-height)] items-center rounded-full border border-[rgba(64,224,208,0.34)] bg-[rgba(64,224,208,0.08)] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--aqua)] transition hover:bg-[rgba(64,224,208,0.12)]"
                  href="/workspace"
                >
                  workspace
                </Link>
                <Link
                  className="inline-flex h-[var(--control-height)] items-center rounded-full border border-[rgba(199,255,93,0.34)] bg-[rgba(199,255,93,0.1)] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.14)]"
                  href="/trends"
                >
                  trend search
                </Link>
              </div>
            </div>
          </header>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7 px-4 py-7 md:px-6">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
              <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4" aria-label="Metricas operacionais">
                {metricTiles.map((metric) => (
                  <MetricTile key={metric.label} {...metric} />
                ))}
              </section>

              <MarketBridge signals={rankSignals(signals, "priority")} />

              <IngestionLab lab={ingestionLab} signals={signals} sources={sources} />

              <section className="app-panel rounded-[var(--radius-lg)] p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="eyebrow text-[color:var(--acid)]">
                      Estado do workspace
                    </p>
                    <h2 className="mt-2 text-lg font-semibold">Estado operacional</h2>
                  </div>
                  <div className="scrollbar-soft inline-flex w-full overflow-x-auto rounded-full border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] p-1 sm:w-auto">
                    {stateOptions.map((option) => (
                      <SegmentButton
                        key={option.value}
                        value={option.value}
                        active={workspaceState === option.value}
                        onClick={setWorkspaceState}
                      >
                        {option.label}
                      </SegmentButton>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <AnimatePresence mode="wait">
                    {workspaceState === "loading" ? (
                      <motion.div
                        key="loading-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-4"
                      >
                        <StatePanel state="loading" />
                        <LoadingSkeleton />
                      </motion.div>
                    ) : (
                      <StatePanel key={workspaceState} state={workspaceState} />
                    )}
                  </AnimatePresence>
                </div>
              </section>

              <section>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="eyebrow text-[color:var(--aqua)]">
                      Signal desk
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight">Ranking para decisao rapida</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
                      Sinais carregados do Postgres. A tela prioriza leitura, comparacao,
                      risco, evidencia e proxima acao sem fixtures mascaradas.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
                    <Gauge className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />
                    score v0.1
                  </div>
                </div>

                <div className="app-panel mb-4 rounded-[var(--radius-lg)] p-3 shadow-[var(--shadow-lift)]">
                  <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {marketOptions.map((option) => (
                        <SegmentButton
                          key={option.value}
                          value={option.value}
                          active={marketFilter === option.value}
                          onClick={setMarketFilter}
                        >
                          {option.label}
                        </SegmentButton>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {priorityOptions.map((option) => (
                        <SegmentButton
                          key={option.value}
                          value={option.value}
                          active={priorityFilter === option.value}
                          onClick={setPriorityFilter}
                        >
                          {option.label}
                        </SegmentButton>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div className="scrollbar-soft flex gap-2 overflow-x-auto pb-1">
                      {typeOptions.map((option) => (
                        <SegmentButton
                          key={option.value}
                          value={option.value}
                          active={typeFilter === option.value}
                          onClick={setTypeFilter}
                        >
                          {option.label}
                        </SegmentButton>
                      ))}
                    </div>
                    <div className="scrollbar-soft flex max-w-full min-w-0 items-center gap-2 overflow-x-auto rounded-full border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-1">
                      <ArrowDownUp className="ml-2 h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                      {sortOptions.map((option) => (
                        <SegmentButton
                          key={option.value}
                          value={option.value}
                          active={sortMode === option.value}
                          onClick={setSortMode}
                        >
                          {option.label}
                        </SegmentButton>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-3 text-xs text-[color:var(--muted)]">
                    <span className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                      {filteredSignals.length} de {signals.length} sinais visiveis
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setMarketFilter("ALL");
                        setTypeFilter("ALL");
                        setPriorityFilter("ALL");
                        setSortMode("priority");
                      }}
                      className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-[color:var(--muted-strong)] transition hover:text-[color:var(--aqua)]"
                    >
                      resetar filtros
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {workspaceState === "empty" ? (
                    <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--line-strong)] p-8 text-center text-sm text-[color:var(--muted)]">
                      Nenhum sinal exibido porque o estado vazio esta selecionado.
                    </div>
                  ) : workspaceState === "error" ? (
                    <div className="rounded-[var(--radius-lg)] border border-[rgba(255,111,97,0.42)] bg-[rgba(255,111,97,0.07)] p-8 text-sm text-[color:var(--muted-strong)]">
                      Importacao bloqueada no modo erro. O app nao transforma falha de fonte em dado.
                    </div>
                  ) : filteredSignals.length === 0 ? (
                    <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--line-strong)] p-8 text-center text-sm text-[color:var(--muted)]">
                      Nenhum sinal encontrado para esta combinacao de busca e filtros.
                    </div>
                  ) : (
                    filteredSignals.map((signal, index) => (
                      <TrendCard
                        key={signal.id}
                        signal={signal}
                        index={index}
                        selected={selectedSignal?.id === signal.id}
                        isSaved={savedIds.has(signal.id)}
                        onSelect={() => setSelectedSignalId(signal.id)}
                        onToggleSave={() => toggleSaved(signal.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

          </div>
        </section>

        <aside className="mt-6 min-w-0 opacity-95 lg:col-start-2 lg:mb-4 xl:col-start-auto xl:my-4">
          <div className="xl:sticky xl:top-4 xl:h-[calc(100dvh-32px)] xl:self-start">
            <div className="scrollbar-soft grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5 pb-6 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pb-12 xl:pr-3">
              <EvidenceInspector
                signal={selectedSignal}
                savedCount={savedIds.size}
                storageLabel={persistence.mode === "database" ? "Postgres gerenciado" : "fallback isolado"}
              />

              <SavedAndHistory savedSignals={savedSignals} revivalSignals={revivalSignals} />

              <section className="app-rail-card min-w-0 rounded-[var(--radius-lg)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--acid)]">
                      Proveniencia
                    </p>
                    <h2 className="mt-1.5 text-base font-semibold">Fila de fontes</h2>
                  </div>
                  <Database className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                </div>
                <div className="mt-3.5 grid gap-2.5">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="app-rail-item rounded-[var(--radius-md)] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words text-sm font-medium leading-5">{source.title}</p>
                        <SourcePill source={source} compact />
                      </div>
                      <p className="mt-2.5 text-xs leading-5 text-[color:var(--muted)]">
                        {source.coverage}. {source.gap}.
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-[color:var(--muted)]">
                        <span>{source.market}</span>
                        <span>{formatSourceDate(source.collectedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="app-rail-card min-w-0 rounded-[var(--radius-lg)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--aqua)]">
                  Pipeline
                </p>
                <h2 className="mt-1.5 text-base font-semibold">Jobs seguros registrados</h2>
                <div className="mt-3.5 grid gap-2.5">
                  {pipelineItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="flex items-center gap-3 rounded-[var(--radius-md)] px-1 py-0.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[rgba(239,233,220,0.13)] bg-[rgba(0,0,0,0.2)]">
                          <Icon className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-[color:var(--muted)]">{item.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(199,255,93,0.2)] bg-[linear-gradient(180deg,rgba(199,255,93,0.09),rgba(199,255,93,0.04))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--acid)]">
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  Safe mode
                </div>
                <p className="mt-2.5 text-sm leading-6 text-[color:var(--muted-strong)]">
                  O app aceita ingestao manual, propria/licenciada ou oficial rastreavel. Falhas seguem como falhas,
                  e entradas sem fonte aprovada nao viram insight.
                </p>
              </section>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
