"use client";

import Link from "next/link";
import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useMotionValue,
  type Variants,
} from "motion/react";
import {
  Activity,
  ArrowDownUp,
  ArrowUpRight,
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
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import { toggleSavedSignalAction } from "@/app/actions";
import { IngestionLab } from "@/components/ingestion-lab";
import { JobRunsFeed } from "@/components/job-runs-feed";
import { SourcePill } from "@/components/source-pill";
import { StatePanel, LoadingSkeleton } from "@/components/state-panels";
import { TrendCard } from "@/components/trend-card";
import type { JobRunsListDto } from "@/lib/api";
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

const ease = [0.22, 1, 0.36, 1] as const;

/* Page entrance sequence — exact spec:
 * t=0.00 sidebar  x:-20→0 · 0.4s
 * t=0.10 header   y:-12→0 · 0.4s
 * t=0.20 tiles    y: 16→0 · stagger 0.06 × 4
 * t=0.30 cards    y: 20→0 · stagger 0.08
 * t=0.40 rail     x:+20→0 · 0.4s
 */

const sidebarVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease, delay: 0, staggerChildren: 0.04, delayChildren: 0.15 } },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease, delay: 0.1, staggerChildren: 0.04, delayChildren: 0.15 } },
};

const tilesContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

const bridgeContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } },
};

const bridgeItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease } },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease, staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const railVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease, delay: 0.4, staggerChildren: 0.05, delayChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease } },
};

const navItems = [
  { label: "Command Center", icon: LayoutDashboard, active: true, key: "cc" },
  { label: "Radar BR", icon: Radar, key: "radar-br" },
  { label: "US Early Signals", icon: Globe2, key: "us" },
  { label: "Áudios", icon: AudioLines, key: "audios" },
  { label: "Formatos", icon: Activity, key: "formatos" },
  { label: "Hashtags", icon: Tags, key: "hashtags" },
  { label: "Creators", icon: UserRoundCheck, key: "creators" },
  { label: "Revival Lab", icon: History, key: "revival" },
  { label: "Evidence Inbox", icon: Inbox, key: "evidence" },
  { label: "Ingestion Lab", icon: DatabaseZap, key: "ingestion" },
  { label: "Upload Lab", icon: LockKeyhole, key: "upload" },
  { label: "Compliance", icon: ShieldCheck, key: "compliance" },
];

const stateOptions: { value: WorkspaceState; label: string }[] = [
  { value: "ready", label: "Live" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
];

const marketOptions: { value: MarketFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "BR", label: "Brasil" },
  { value: "US", label: "EUA" },
];

const typeOptions: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "Tudo" },
  { value: "FORMAT", label: "Formatos" },
  { value: "AUDIO", label: "Áudios" },
  { value: "HASHTAG", label: "Hashtags" },
  { value: "CREATOR", label: "Creators" },
  { value: "REVIVAL", label: "Revival" },
  { value: "US_TO_BR", label: "US > BR" },
];

const priorityOptions: { value: PriorityFilter; label: string }[] = [
  { value: "ALL", label: "Tudo" },
  { value: "now", label: "Agora" },
  { value: "next", label: "Próximo" },
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
  next: "próximo",
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
  label: "banco indisponível",
  detail: "Postgres não respondeu; nenhum insight fictício foi carregado.",
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

/* ---------- Counter primitive ---------- */

function AnimatedNumber({
  value,
  delay = 0,
  duration = 0.9,
  format,
  pad,
}: {
  value: number;
  delay?: number;
  duration?: number;
  format?: (v: number) => string;
  pad?: number;
}) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration, delay, ease });
    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [count, value, delay, duration]);

  const text = format ? format(display) : pad ? String(display).padStart(pad, "0") : String(display);
  return <>{text}</>;
}

/* ---------- Live indicator ---------- */

function LiveDot({ tone = "success" }: { tone?: "success" | "acid" | "aqua" | "coral" }) {
  const color = {
    success: "var(--success)",
    acid: "var(--acid)",
    aqua: "var(--aqua)",
    coral: "var(--coral)",
  }[tone];
  return (
    <span className="relative inline-flex h-2 w-2 items-center justify-center" aria-hidden="true">
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: color, animation: "live-pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite" }}
      />
      <span className="relative h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

/* ---------- Segment with sliding indicator ---------- */

function SegmentGroup<T extends string>({
  groupId,
  options,
  value,
  onChange,
  ariaLabel,
}: {
  groupId: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <LayoutGroup id={groupId}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex min-w-0 flex-wrap gap-1 rounded-full border border-[color:var(--line)] bg-[rgba(0,0,0,0.26)] p-1"
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative z-0 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200",
                active ? "text-[color:var(--acid)]" : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`seg-${groupId}`}
                  transition={{ type: "spring", stiffness: 520, damping: 44 }}
                  className="absolute inset-0 -z-10 rounded-full border border-[rgba(199,255,93,0.34)] bg-[rgba(199,255,93,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* ---------- Metric tile ---------- */

function MetricTile({
  label,
  value,
  rawValue,
  delta,
  tone,
  index,
}: {
  label: string;
  value: string;
  rawValue: number;
  delta: string;
  tone: "acid" | "aqua" | "coral" | "gold";
  index: number;
}) {
  const toneMap = {
    acid: {
      bg: "rgba(199,255,93,0.12)",
      text: "var(--acid)",
      border: "rgba(199,255,93,0.22)",
      glow: "rgba(199,255,93,0.18)",
    },
    aqua: {
      bg: "rgba(64,224,208,0.12)",
      text: "var(--aqua)",
      border: "rgba(64,224,208,0.22)",
      glow: "rgba(64,224,208,0.15)",
    },
    gold: {
      bg: "rgba(243,201,105,0.12)",
      text: "var(--gold)",
      border: "rgba(243,201,105,0.22)",
      glow: "rgba(243,201,105,0.15)",
    },
    coral: {
      bg: "rgba(255,111,97,0.12)",
      text: "var(--coral)",
      border: "rgba(255,111,97,0.22)",
      glow: "rgba(255,111,97,0.15)",
    },
  }[tone];

  const isPlainNumber = /^\d+$/.test(value);

  return (
    <motion.div
      variants={tileVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.16, ease }}
      className="group relative overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[var(--card-bg)] p-5"
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-3xl"
        style={{ background: toneMap.glow }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ duration: 0.6, delay: 0.25 + index * 0.05, ease }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-4 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${toneMap.border}, transparent)`,
        }}
      />
      <div className="relative flex min-h-[2.5rem] items-start justify-between gap-3">
        <p className="card-eyebrow flex-1 leading-[1.4]" style={{ color: toneMap.text }}>
          {label}
        </p>
        <span
          className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ borderColor: toneMap.border, background: toneMap.bg, color: toneMap.text }}
        >
          {delta}
        </span>
      </div>
      <div className="relative mt-4 flex items-baseline gap-2">
        <p className="metric-value-hero text-[color:var(--foreground)]">
          {isPlainNumber ? <AnimatedNumber value={rawValue} delay={0.28 + index * 0.06} pad={value.length} /> : value}
        </p>
      </div>
      <div className="relative mt-3 h-0.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${toneMap.text}, transparent)` }}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2.4, delay: 0.4 + index * 0.06, ease: "linear", repeat: Infinity, repeatDelay: 1.6 }}
        />
      </div>
    </motion.div>
  );
}

/* ---------- Market bridge ---------- */

/* Three market-bridge cards — each has distinct identity:
 * BR    → acid + HOT NOW pulse
 * US    → aqua + US→BR arrow animation
 * BRIDGE → violet + transfer % hero number */

function MarketBridgeBR({ signal }: { signal?: TrendSignal }) {
  return (
    <motion.div
      variants={bridgeItemVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease }}
      className="relative min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[rgba(199,255,93,0.28)] bg-[linear-gradient(180deg,rgba(199,255,93,0.07),rgba(7,7,6,0.32))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]"
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(199,255,93,0.18)] blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.6, delay: 0.4, ease }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(199,255,93,0.48)] to-transparent" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="card-eyebrow text-[color:var(--acid)]">top BR agora</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(199,255,93,0.36)] bg-[rgba(199,255,93,0.1)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--acid)]">
          <span className="relative inline-flex h-1.5 w-1.5" aria-hidden="true">
            <span className="signal-now-pulse absolute inset-0 rounded-full bg-[color:var(--acid)]" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-[color:var(--acid)]" />
          </span>
          HOT · NOW
        </span>
      </div>
      {signal ? (
        <>
          <h2 className="relative mt-3 min-w-0 break-words text-base font-semibold leading-snug tracking-tight">
            {signal.title}
          </h2>
          <div className="relative mt-3 flex items-baseline gap-3">
            <p className="metric-value-xl text-[color:var(--foreground)]">
              <AnimatedNumber value={signal.score.value} delay={0.4} />
            </p>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">/100</span>
          </div>
          <p className="relative mt-2 text-xs leading-5 text-[color:var(--muted-strong)]">{signal.decision}</p>
        </>
      ) : (
        <p className="relative mt-3 text-sm text-[color:var(--muted)]">Sem sinal BR no filtro atual.</p>
      )}
    </motion.div>
  );
}

function MarketBridgeUS({ signal }: { signal?: TrendSignal }) {
  return (
    <motion.div
      variants={bridgeItemVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease }}
      className="relative min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[rgba(64,224,208,0.26)] bg-[linear-gradient(180deg,rgba(64,224,208,0.06),rgba(7,7,6,0.32))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]"
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(64,224,208,0.16)] blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.6, delay: 0.5, ease }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(64,224,208,0.44)] to-transparent" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="card-eyebrow text-[color:var(--aqua)]">early signal EUA</p>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
          <span>US</span>
          <motion.span
            aria-hidden="true"
            className="inline-block"
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
          >
            <ArrowUpRight className="h-3 w-3 -rotate-90" />
          </motion.span>
          <span>BR</span>
        </span>
      </div>
      {signal ? (
        <>
          <h2 className="relative mt-3 min-w-0 break-words text-base font-semibold leading-snug tracking-tight">
            {signal.title}
          </h2>
          <div className="relative mt-3 flex items-baseline gap-3">
            <p className="metric-value-xl text-[color:var(--foreground)]">
              <AnimatedNumber value={signal.score.value} delay={0.5} />
            </p>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">/100</span>
          </div>
          <p className="relative mt-2 text-xs leading-5 text-[color:var(--muted-strong)]">{signal.decision}</p>
        </>
      ) : (
        <p className="relative mt-3 text-sm text-[color:var(--muted)]">Sem early signal dos EUA no recorte.</p>
      )}
    </motion.div>
  );
}

function MarketBridgeTransfer({ transfer }: { transfer: number }) {
  return (
    <motion.div
      variants={bridgeItemVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease }}
      className="relative min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[rgba(169,140,255,0.28)] bg-[linear-gradient(180deg,rgba(169,140,255,0.08),rgba(7,7,6,0.32))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] lg:col-span-2 2xl:col-span-1"
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-[rgba(169,140,255,0.22)] blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 0.6, delay: 0.6, ease }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(169,140,255,0.48)] to-transparent" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="card-eyebrow text-[color:var(--violet)]">ponte US → BR</p>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--violet)]">
          transferibilidade
        </span>
      </div>
      <div className="relative mt-4 flex items-baseline gap-3">
        <p className="metric-value-hero text-[color:var(--foreground)]">
          <AnimatedNumber value={transfer} delay={0.6} />
        </p>
        <span className="font-mono text-sm uppercase tracking-[0.2em] text-[color:var(--violet)]">%</span>
      </div>
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${transfer}%` }}
          transition={{ duration: 0.9, delay: 0.7, ease }}
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--violet),var(--aqua))]"
        />
      </div>
      <p className="relative mt-3 text-xs leading-5 text-[color:var(--muted-strong)]">
        Transferência calculada dos sinais persistidos. Só vira ação com fonte oficial ou evidência BR.
      </p>
    </motion.div>
  );
}

function MarketBridge({ signals }: { signals: TrendSignal[] }) {
  const brTop = signals.find((signal) => signal.market === "BR");
  const usTop = signals.find((signal) => signal.market === "US");
  const transfer = usTop?.scoreInput.usTransferability ?? 0;

  return (
    <motion.section
      variants={bridgeContainerVariants}
      initial="hidden"
      animate="show"
      className="app-panel grid min-w-0 gap-3 rounded-[var(--radius-lg)] p-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_260px]"
    >
      <MarketBridgeBR signal={brTop} />
      <MarketBridgeUS signal={usTop} />
      <MarketBridgeTransfer transfer={transfer} />
    </motion.section>
  );
}

/* ---------- Evidence inspector (right rail top) ---------- */

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
      <section className="app-rail-card relative min-w-0 overflow-hidden rounded-[var(--radius-lg)] p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[rgba(64,224,208,0.08)] blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.24)]">
            <Inbox className="h-4 w-4 text-[color:var(--aqua)]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="card-eyebrow text-[color:var(--aqua)]">Evidence desk</p>
            <h2 className="mt-1.5 text-sm font-semibold leading-5">Nenhum sinal selecionado</h2>
            <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
              Clique em um card do signal desk para abrir evidências, fonte e histórico aqui.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="app-rail-card min-w-0 overflow-hidden rounded-[var(--radius-lg)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--acid)]">
            <LiveDot tone="acid" />
            Evidence desk
          </p>
          <h2 className="mt-2 break-words text-lg font-semibold leading-6">{signal.title}</h2>
        </div>
        <span className="shrink-0 rounded-full border border-[rgba(199,255,93,0.3)] bg-[rgba(199,255,93,0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)]">
          {priorityLabel[signal.priority]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {signal.history.map((item, idx) => (
          <motion.div
            key={`${item.label}-${item.value}-${idx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.08 * idx, ease }}
            className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-2"
          >
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
          </motion.div>
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
            className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.2)] p-3"
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

      <div className="mt-4 rounded-[var(--radius-sm)] border border-[rgba(64,224,208,0.24)] bg-[rgba(64,224,208,0.07)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--aqua)]">workspace flow</p>
        <p className="mt-2 text-sm leading-5 text-[color:var(--muted-strong)]">
          {savedCount} sinais salvos em {storageLabel}. Próxima ação sugerida: {signal.nextAction}
        </p>
      </div>
    </motion.section>
  );
}

/* ---------- Saved + revival ---------- */

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
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--aqua)]">
            <LiveDot tone="aqua" />
            Saved / revival
          </p>
          <h2 className="mt-1.5 text-base font-semibold">Fila de decisão</h2>
        </div>
        <Bookmark className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
      </div>

      <div className="mt-3.5 grid gap-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {savedSignals.length > 0 ? (
            savedSignals.slice(0, 4).map((signal, idx) => (
              <motion.div
                key={signal.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.96 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease }}
                className="app-rail-item rounded-[var(--radius-md)] border-[rgba(199,255,93,0.18)] bg-[rgba(199,255,93,0.05)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium leading-5">{signal.title}</p>
                  <span className="metric-number shrink-0 text-sm font-semibold text-[color:var(--acid)]">
                    <AnimatedNumber value={signal.score.value} delay={0.1 * idx} duration={0.6} />
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[color:var(--muted)]">{signal.nextAction}</p>
              </motion.div>
            ))
          ) : (
            <motion.div
              key="empty-saved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="app-rail-empty rounded-[var(--radius-md)] px-3 py-2.5 text-xs leading-5"
            >
              Nenhum sinal salvo ainda. Marque um card pra montar a fila.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 border-t border-[color:var(--line)] pt-3.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          revival watch
        </div>
        <div className="mt-2.5 grid gap-2">
          {revivalSignals.length > 0 ? (
            revivalSignals.map((signal, idx) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * idx, ease }}
                className="flex min-w-0 items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-[color:var(--muted-strong)]">{signal.title}</span>
                <span className="app-pill shrink-0 rounded-full px-2 py-1 text-[11px]">{signal.stage}</span>
              </motion.div>
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

/* ---------- Sidebar ---------- */

function Sidebar({
  activeKey,
  tenant,
  onLogout,
  onNavigate,
  isLoggingOut,
}: {
  activeKey: string;
  tenant: CommandCenterData["tenant"];
  onLogout: () => void;
  onNavigate: (key: string) => void;
  isLoggingOut: boolean;
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  return (
    <motion.aside
      variants={sidebarVariants}
      initial="hidden"
      animate="show"
      className="app-surface-console scrollbar-soft hidden min-w-0 p-4 backdrop-blur-2xl lg:sticky lg:top-0 lg:block lg:h-[100dvh] lg:self-start lg:overflow-y-auto lg:overscroll-contain"
    >
      <div className="flex min-h-full flex-col">
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(8,8,7,0.6)] p-3"
        >
          <div className="relative grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[color:var(--acid)] text-black shadow-[0_0_32px_rgba(199,255,93,0.3)]">
            <Command className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070706] bg-[color:var(--success)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none tracking-tight">Market Intel</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              <LiveDot />
              tiktok / ops
            </p>
          </div>
        </motion.div>

        <LayoutGroup id="sidebar-nav">
          <nav className="mt-6 grid gap-0.5" aria-label="Navegação principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeKey;
              const isHover = hoverKey === item.key;
              return (
                <motion.button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  onHoverStart={() => setHoverKey(item.key)}
                  onHoverEnd={() => setHoverKey(null)}
                  variants={itemVariants}
                  className={cn(
                    "nav-item relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm transition-colors duration-200",
                    isActive
                      ? "text-[color:var(--foreground)]"
                      : "text-[color:var(--muted)] hover:text-[color:var(--muted-strong)]",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={{ type: "spring", stiffness: 520, damping: 44 }}
                      className="absolute inset-0 -z-10 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.055)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    />
                  )}
                  {isActive && <span aria-hidden="true" className="nav-item-indicator" />}
                  {!isActive && isHover && (
                    <motion.span
                      layoutId="sidebar-hover"
                      transition={{ type: "spring", stiffness: 520, damping: 44 }}
                      className="absolute inset-0 -z-10 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.028)]"
                    />
                  )}
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[color:var(--acid)]")} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      live
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </LayoutGroup>

        <motion.div variants={itemVariants} className="mt-auto">
          <div className="divider-gradient mb-4" />
          <div className="app-rail-card rounded-[var(--radius-md)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)]">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{tenant.workspaceName}</span>
            </div>
            <p className="mt-3 break-all text-xs leading-5 text-[color:var(--muted)]">{tenant.userEmail}</p>
            <p className="mt-1.5 text-xs leading-5 text-[color:var(--muted)]">
              {tenant.role.toLowerCase()} · sessão isolada por workspace.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)] transition hover:border-[rgba(255,111,97,0.36)] hover:text-[color:var(--coral)] disabled:opacity-60"
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
              >
                sair
              </button>
              <Link
                className="inline-flex rounded-full border border-[rgba(64,224,208,0.28)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--aqua)] transition hover:bg-[rgba(64,224,208,0.08)]"
                href="/workspace"
              >
                settings
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
}

/* ---------- Main component ---------- */

export function CommandCenter({
  signals,
  sources,
  persistence = fallbackPersistence,
  ingestionLab = fallbackIngestionLab,
  tenant,
  initialJobRuns,
  initialJobRunsFetchedAt,
}: CommandCenterData & { initialJobRuns?: JobRunsListDto; initialJobRunsFetchedAt?: number }) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(signals.length > 0 ? "ready" : "empty");
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [activeNavKey, setActiveNavKey] = useState("cc");
  const [selectedSignalId, setSelectedSignalId] = useState(signals[0]?.id);
  const [savedIds, setSavedIds] = useState(() => new Set(signals.filter((signal) => signal.saved).map((signal) => signal.id)));
  const [isSaving, startSavingTransition] = useTransition();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const filters = useMemo(
    () => ({ query, market: marketFilter, type: typeFilter, priority: priorityFilter, sort: sortMode }),
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
      if (next.has(signalId)) next.delete(signalId);
      else next.add(signalId);
      return next;
    });

    if (persistence.mode !== "database") return;

    startSavingTransition(async () => {
      const result = await toggleSavedSignalAction(signalId);
      if (!result.ok) {
        setSavedIds((current) => {
          const next = new Set(current);
          if (wasSaved) next.add(signalId);
          else next.delete(signalId);
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

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetSignalFilters() {
    setQuery("");
    setMarketFilter("ALL");
    setTypeFilter("ALL");
    setPriorityFilter("ALL");
    setSortMode("priority");
  }

  function navigateDashboard(key: string) {
    setActiveNavKey(key);
    setWorkspaceState("ready");

    if (key === "cc") {
      resetSignalFilters();
      scrollToSection("command-center-top");
      return;
    }

    if (key === "radar-br") {
      resetSignalFilters();
      setMarketFilter("BR");
      scrollToSection("signal-desk");
      return;
    }

    if (key === "us") {
      resetSignalFilters();
      setMarketFilter("US");
      scrollToSection("signal-desk");
      return;
    }

    if (key === "audios" || key === "formatos" || key === "hashtags" || key === "creators" || key === "revival") {
      resetSignalFilters();
      const typeByKey: Partial<Record<string, TypeFilter>> = {
        audios: "AUDIO",
        formatos: "FORMAT",
        hashtags: "HASHTAG",
        creators: "CREATOR",
        revival: "REVIVAL",
      };
      setTypeFilter(typeByKey[key] ?? "ALL");
      scrollToSection("signal-desk");
      return;
    }

    if (key === "evidence") {
      scrollToSection("evidence-desk");
      return;
    }

    if (key === "ingestion" || key === "upload") {
      scrollToSection("ingestion-lab");
      return;
    }

    if (key === "compliance") {
      scrollToSection("safe-mode");
    }
  }

  const metricTiles = [
    {
      label: "Sinais visíveis",
      value: String(filteredSignals.length).padStart(2, "0"),
      rawValue: filteredSignals.length,
      delta: `${summary.highPriorityCount} hot`,
      tone: "acid" as const,
    },
    {
      label: "Radar BR + US",
      value: `${summary.brCount}/${summary.usCount}`,
      rawValue: summary.brCount,
      delta: persistence.mode === "database" ? "Postgres" : "fallback",
      tone: "aqua" as const,
    },
    {
      label: "Evidências",
      value: String(summary.evidenceCount).padStart(2, "0"),
      rawValue: summary.evidenceCount,
      delta: persistence.mode === "database" ? "persistidas" : "sem fixture",
      tone: "gold" as const,
    },
    {
      label: "Score médio",
      value: String(summary.avgScore),
      rawValue: summary.avgScore,
      delta: "score v0.1",
      tone: "coral" as const,
    },
  ];

  return (
    <main className="relative min-h-dvh">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" />

      <div className="relative z-0 mx-auto grid min-h-dvh w-full max-w-[1840px] gap-0 px-2 py-2 sm:px-3 sm:py-3 lg:grid-cols-[244px_minmax(0,1fr)] lg:py-0 xl:grid-cols-[244px_minmax(0,1fr)_330px] 2xl:grid-cols-[264px_minmax(0,1fr)_360px]">
        <Sidebar activeKey={activeNavKey} tenant={tenant} onLogout={logout} onNavigate={navigateDashboard} isLoggingOut={isLoggingOut} />

        <section id="command-center-top" className="min-w-0 bg-[rgba(7,7,6,0.44)] backdrop-blur-xl lg:my-3 lg:rounded-[var(--radius-lg)] lg:border-x lg:border-[rgba(239,233,220,0.12)]">
          {/* HERO / HEADER — t=0.10, y:-12→0 */}
          <motion.header
            variants={headerVariants}
            initial="hidden"
            animate="show"
            className="app-hero relative m-0 overflow-hidden rounded-none border-x-0 border-t-0 px-4 py-5 md:px-6 lg:rounded-t-[var(--radius-lg)]"
          >
            <div
              aria-hidden="true"
              className="scan-line pointer-events-none absolute inset-0 opacity-60"
            />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <motion.div variants={itemVariants} className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[color:var(--acid)] text-black shadow-[0_0_30px_rgba(199,255,93,0.25)] lg:hidden">
                  <Command className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <motion.div variants={sectionVariants} className="flex flex-wrap items-center gap-2">
                    <motion.span
                      variants={itemVariants}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(199,255,93,0.42)] bg-[rgba(199,255,93,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]"
                    >
                      <LiveDot tone="acid" />
                      {persistence.mode === "database" ? "live data" : "safe fallback"}
                    </motion.span>
                    <motion.span
                      variants={itemVariants}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        persistence.mode === "database"
                          ? "border-[rgba(64,224,208,0.42)] bg-[rgba(64,224,208,0.12)] text-[color:var(--aqua)]"
                          : "border-[rgba(243,201,105,0.42)] bg-[rgba(243,201,105,0.12)] text-[color:var(--gold)]",
                      )}
                    >
                      {isSaving ? "gravando..." : persistence.label}
                    </motion.span>
                    <motion.span
                      variants={itemVariants}
                      className="hidden items-center gap-1.5 rounded-full border border-[color:var(--line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)] sm:inline-flex"
                    >
                      tenant / {tenant.workspaceName.toLowerCase()}
                    </motion.span>
                  </motion.div>
                  <motion.h1
                    variants={itemVariants}
                    className="mt-3 text-3xl font-semibold leading-[1.02] tracking-tight md:text-5xl"
                  >
                    Command Center
                  </motion.h1>
                  <motion.p
                    variants={itemVariants}
                    className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]"
                  >
                    {persistence.detail} Workspace: {tenant.workspaceName} — {tenant.role.toLowerCase()}.
                  </motion.p>
                </div>
              </motion.div>

              <motion.div variants={sectionVariants} className="flex flex-wrap items-center gap-2 xl:justify-end">
                <motion.label
                  variants={itemVariants}
                  className="app-control flex min-h-[var(--control-height)] min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-2 text-sm text-[color:var(--muted-strong)] sm:min-w-[320px] xl:w-[390px] xl:flex-none"
                >
                  <Search className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar sinais, fontes, creators..."
                    className="min-w-0 flex-1 bg-transparent text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted)]"
                  />
                  <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)] sm:inline">
                    ⌘ K
                  </span>
                </motion.label>
                <motion.button
                  type="button"
                  onClick={() => scrollToSection("signal-filters")}
                  variants={itemVariants}
                  className="app-control grid h-[var(--control-height)] w-[var(--control-height)] place-items-center rounded-full text-[color:var(--muted-strong)] hover:text-[color:var(--aqua)]"
                >
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Filtros</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => scrollToSection("alerts-rail")}
                  variants={itemVariants}
                  className="app-control relative grid h-[var(--control-height)] w-[var(--control-height)] place-items-center rounded-full text-[color:var(--muted-strong)] hover:text-[color:var(--aqua)]"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[color:var(--acid)] shadow-[0_0_8px_rgba(199,255,93,0.8)]" />
                  <span className="sr-only">Alertas</span>
                </motion.button>
                <motion.button
                  variants={itemVariants}
                  className="h-[var(--control-height)] rounded-full border border-[color:var(--line)] bg-[var(--control-bg)] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-strong)] transition hover:border-[rgba(255,111,97,0.42)] hover:text-[color:var(--coral)]"
                  type="button"
                  onClick={logout}
                  disabled={isLoggingOut}
                >
                  sair
                </motion.button>
                <motion.div variants={itemVariants}>
                  <Link
                    className="inline-flex h-[var(--control-height)] items-center rounded-full border border-[rgba(199,255,93,0.34)] bg-[rgba(199,255,93,0.1)] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.18)]"
                    href="/trends"
                  >
                    trend search
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.header>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7 px-4 py-7 md:px-6">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
              {/* METRICS — t=0.20, stagger 0.06 × 4 */}
              <motion.section
                variants={tilesContainerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4"
                aria-label="Métricas operacionais"
              >
                {metricTiles.map((metric, idx) => (
                  <MetricTile key={metric.label} {...metric} index={idx} />
                ))}
              </motion.section>

              <MarketBridge signals={rankSignals(signals, "priority")} />

              <motion.section
                id="ingestion-lab"
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.45 }}
              >
                <IngestionLab lab={ingestionLab} signals={signals} sources={sources} />
              </motion.section>

              {/* WORKSPACE STATE */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.5 }}
                className="app-panel rounded-[var(--radius-lg)] p-4 md:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="eyebrow text-[color:var(--acid)]">Estado do workspace</p>
                    <h2 className="mt-2 text-lg font-semibold">Estado operacional</h2>
                  </div>
                  <SegmentGroup
                    groupId="workspace-state"
                    options={stateOptions}
                    value={workspaceState}
                    onChange={setWorkspaceState}
                    ariaLabel="Estado operacional"
                  />
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
              </motion.section>

              {/* SIGNAL DESK — t=0.30, cards stagger 0.08 */}
              <motion.section
                id="signal-desk"
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  variants={sectionVariants}
                  className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
                >
                  <div>
                    <p className="flex items-center gap-2 eyebrow text-[color:var(--aqua)]">
                      <LiveDot tone="aqua" />
                      Signal desk
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight">Ranking para decisão rápida</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
                      Sinais carregados do Postgres. A tela prioriza leitura, comparação, risco, evidência e próxima ação.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
                    <Gauge className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />
                    score v0.1
                  </div>
                </motion.div>

                <motion.div
                  id="signal-filters"
                  variants={itemVariants}
                  className="app-panel mb-4 rounded-[var(--radius-lg)] p-3 shadow-[var(--shadow-lift)]"
                >
                  <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <SegmentGroup
                      groupId="market-filter"
                      options={marketOptions}
                      value={marketFilter}
                      onChange={setMarketFilter}
                      ariaLabel="Mercado"
                    />
                    <SegmentGroup
                      groupId="priority-filter"
                      options={priorityOptions}
                      value={priorityFilter}
                      onChange={setPriorityFilter}
                      ariaLabel="Prioridade"
                    />
                  </div>

                  <div className="mt-3 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div className="scrollbar-soft overflow-x-auto pb-1">
                      <SegmentGroup
                        groupId="type-filter"
                        options={typeOptions}
                        value={typeFilter}
                        onChange={setTypeFilter}
                        ariaLabel="Tipo"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDownUp className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                      <SegmentGroup
                        groupId="sort-filter"
                        options={sortOptions}
                        value={sortMode}
                        onChange={setSortMode}
                        ariaLabel="Ordenação"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-3 text-xs text-[color:var(--muted)]">
                    <span className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                      <span className="metric-number">
                        <AnimatedNumber value={filteredSignals.length} delay={0.15} duration={0.6} />
                      </span>
                      <span>de</span>
                      <span className="metric-number">{signals.length}</span>
                      <span>sinais visíveis</span>
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
                      className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.38)] hover:text-[color:var(--aqua)]"
                    >
                      resetar filtros
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
                  }}
                  initial="hidden"
                  animate="show"
                  className="grid gap-3"
                >
                  <AnimatePresence mode="popLayout">
                    {workspaceState === "empty" ? (
                      <EmptyState
                        key="empty"
                        variant="empty"
                        title="Sem sinais para operar"
                        body="Fontes oficiais, manuais e própria/licenciada alimentam o ranking. Sem ingestão, sem ranking."
                        hint="envie um lote em Ingestion Lab →"
                      />
                    ) : workspaceState === "error" ? (
                      <EmptyState
                        key="error"
                        variant="error"
                        title="Ingestão bloqueada"
                        body="A fonte respondeu com erro. Falha não vira dado — corrija a origem antes de re-rodar o import."
                        hint="revisar últimos jobs em Pipeline →"
                      />
                    ) : filteredSignals.length === 0 ? (
                      <EmptyState
                        key="filtered"
                        variant="filtered"
                        title="Nenhum sinal para este recorte"
                        body="Combinação de filtros sem match. Reduza um critério ou limpe tudo para voltar ao ranking completo."
                        hint={`${signals.length} sinais ignorados pelos filtros`}
                        onReset={() => {
                          setQuery("");
                          setMarketFilter("ALL");
                          setTypeFilter("ALL");
                          setPriorityFilter("ALL");
                          setSortMode("priority");
                        }}
                      />
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
                  </AnimatePresence>
                </motion.div>
              </motion.section>
            </div>
          </div>
        </section>

        {/* RIGHT RAIL — t=0.40, x:+20→0 */}
        <motion.aside
          id="alerts-rail"
          variants={railVariants}
          initial="hidden"
          animate="show"
          className="mt-6 min-w-0 opacity-95 lg:col-start-2 lg:mb-4 xl:col-start-auto xl:my-4"
        >
          <div className="xl:sticky xl:top-4 xl:h-[calc(100dvh-32px)] xl:self-start">
            <div className="scrollbar-soft grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5 pb-6 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pb-12 xl:pr-3">
              <motion.div variants={sectionVariants}>
                <div id="evidence-desk">
                  <EvidenceInspector
                    signal={selectedSignal}
                    savedCount={savedIds.size}
                    storageLabel={persistence.mode === "database" ? "Postgres gerenciado" : "fallback isolado"}
                  />
                </div>
              </motion.div>

              <motion.div variants={sectionVariants}>
                <SavedAndHistory savedSignals={savedSignals} revivalSignals={revivalSignals} />
              </motion.div>

              <motion.section
                variants={sectionVariants}
                className="app-rail-card min-w-0 rounded-[var(--radius-lg)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--acid)]">
                      <LiveDot tone="acid" />
                      Proveniência
                    </p>
                    <h2 className="mt-1.5 text-base font-semibold">Fila de fontes</h2>
                  </div>
                  <Database className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                </div>
                <div className="mt-3.5 grid gap-2.5">
                  {sources.map((source, idx) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.32, delay: 0.05 * idx, ease }}
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
                        <span className="font-mono uppercase tracking-[0.16em]">{source.market}</span>
                        <span className="font-mono">{formatSourceDate(source.collectedAt)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              <motion.div variants={sectionVariants}>
                <JobRunsFeed
                  initialData={initialJobRuns}
                  initialUpdatedAt={initialJobRunsFetchedAt}
                  limit={10}
                />
              </motion.div>

              <motion.section
                id="safe-mode"
                variants={sectionVariants}
                className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(199,255,93,0.2)] bg-[linear-gradient(180deg,rgba(199,255,93,0.09),rgba(199,255,93,0.04))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-[rgba(199,255,93,0.14)] blur-3xl"
                />
                <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--acid)]">
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  Safe mode
                </div>
                <p className="relative mt-2.5 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Ingestão manual, própria/licenciada ou oficial rastreável. Falhas seguem como falhas — entradas sem fonte não viram insight.
                </p>
                <p className="relative mt-3 inline-flex items-center gap-2 rounded-full border border-[rgba(199,255,93,0.22)] bg-[rgba(0,0,0,0.24)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--acid)]">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  ops-guard ativo
                </p>
              </motion.section>
            </div>
          </div>
        </motion.aside>
      </div>
    </main>
  );
}

/* ---------- Empty state (list-specific) ---------- */

function EmptyState({
  variant,
  title,
  body,
  hint,
  onReset,
}: {
  variant: "empty" | "error" | "filtered";
  title: string;
  body: string;
  hint?: string;
  onReset?: () => void;
}) {
  const tone = variant === "error" ? "coral" : variant === "filtered" ? "aqua" : "gold";
  const Icon = variant === "error" ? FileWarning : variant === "filtered" ? Filter : DatabaseZap;
  const borderStyle =
    variant === "error"
      ? "border-[rgba(255,111,97,0.38)] bg-[rgba(255,111,97,0.06)]"
      : "border-dashed border-[color:var(--line-strong)] bg-[rgba(255,255,255,0.018)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease }}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border p-10 text-center",
        borderStyle,
      )}
    >
      {/* breathing orb — spec: scale 1→1.02→1, 3s loop */}
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.02, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border"
        style={{
          borderColor: `color-mix(in srgb, var(--${tone}) 32%, transparent)`,
          background: `radial-gradient(circle, color-mix(in srgb, var(--${tone}) 18%, transparent), transparent 70%)`,
        }}
      >
        <Icon className="h-6 w-6" style={{ color: `var(--${tone})` }} aria-hidden="true" />
      </motion.div>
      <h3 className={cn("text-xl font-semibold tracking-tight", `text-[color:var(--${tone})]`)}>{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:var(--muted-strong)]">{body}</p>
      {hint ? (
        <p className="mx-auto mt-3 inline-flex max-w-md rounded-full border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          {hint}
        </p>
      ) : null}
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-full border border-[color:var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.38)] hover:text-[color:var(--aqua)]"
        >
          limpar filtros
        </button>
      ) : null}
    </motion.div>
  );
}
