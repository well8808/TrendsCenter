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
  Globe2,
  Inbox,
  LayoutDashboard,
  Radar,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import { toggleSavedSignalAction } from "@/app/actions";
import { GSAPCounter } from "@/components/gsap-counter";
import { GSAPHeroReveal, GSAPWordSplit } from "@/components/gsap-hero-reveal";
import { GSAPScrollEntrance, GSAPSectionReveal } from "@/components/gsap-scroll-entrance";
import { GSAPTileReveal } from "@/components/gsap-tile-reveal";
import { HeroOrb3D } from "@/components/hero-orb-3d";
import { IngestionLab } from "@/components/ingestion-lab";
import { ParticleField } from "@/components/particle-field";
import { SourcePill } from "@/components/source-pill";
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
import type { SignalPriority, TrendSignal, TrendSourceRecord, WorkspaceState } from "@/lib/types";
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
  { label: "Reels Center", icon: LayoutDashboard, key: "cc" },
  { label: "Radar BR", icon: Radar, key: "radar-br" },
  { label: "Sinais EUA", icon: Globe2, key: "us" },
  { label: "Fontes", icon: Database, key: "instagram-sources" },
];

const navCategoryItems = [
  { label: "Áudios", icon: AudioLines, key: "audios" },
  { label: "Formatos", icon: Activity, key: "formatos" },
  { label: "Hashtags", icon: Tags, key: "hashtags" },
];

const navOpsItems = [
  { label: "Adicionar dados", icon: DatabaseZap, key: "ingestion" },
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
  { value: "CREATOR", label: "Perfis" },
  { value: "REVIVAL", label: "Revival" },
  { value: "US_TO_BR", label: "US > BR" },
];

const priorityOptions: { value: PriorityFilter; label: string }[] = [
  { value: "ALL", label: "Tudo" },
  { value: "now", label: "Agora" },
  { value: "next", label: "Próximo" },
  { value: "watch", label: "Observar" },
  { value: "hold", label: "Aguardar" },
];

const sortOptions: { value: SortMode; label: string }[] = [
  { value: "priority", label: "Prioridade" },
  { value: "score", label: "Potencial" },
  { value: "risk", label: "Risco" },
  { value: "freshness", label: "Recencia" },
];

const priorityLabel: Record<SignalPriority, string> = {
  now: "agora",
  next: "próximo",
  watch: "observar",
  hold: "aguardar",
};

const trendSourceDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const trendSourceTypeLabel: Record<TrendSourceRecord["sourceType"], string> = {
  reel: "Reels",
  audio: "Audio",
  creator: "Perfis",
  hashtag: "Hashtags",
  account_insights: "Conta profissional",
  meta_ad_library: "Anuncios Meta",
  manual: "Manual",
};

const trendSourceStatusLabel: Record<TrendSourceRecord["status"], string> = {
  active: "ativo",
  paused: "pausado",
  error: "erro",
};

function formatTrendSourceDate(dateIso?: string) {
  return dateIso ? trendSourceDateFormatter.format(new Date(dateIso)) : "Ainda não verificado";
}

function roleLabel(role: string) {
  if (role === "OWNER") return "dono";
  if (role === "ADMIN") return "gestor";
  return "operador";
}

const fallbackPersistence: CommandCenterData["persistence"] = {
  mode: "error-fallback",
  label: "dados indisponiveis",
  detail: "A base real nao respondeu; nenhum insight ficticio foi carregado.",
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

const fallbackReelStats: CommandCenterData["reelStats"] = {
  total: 0,
  br: 0,
  us: 0,
  avgScore: 0,
  evidenceCount: 0,
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
                  className="absolute inset-0 -z-10 rounded-full border border-[rgba(237, 73, 86,0.34)] bg-[rgba(237, 73, 86,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
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

const metricToneConfig = {
  acid:  { bg: "rgba(237,73,86,0.11)",    border: "rgba(237,73,86,0.32)",    text: "var(--hot)",   top: "rgba(237,73,86,0.6)",    glow: "rgba(237,73,86,0.14)"  },
  aqua:  { bg: "rgba(88,200,190,0.09)",   border: "rgba(88,200,190,0.28)",   text: "var(--aqua)",  top: "rgba(88,200,190,0.55)",   glow: "rgba(88,200,190,0.11)" },
  gold:  { bg: "rgba(230,183,101,0.09)",  border: "rgba(230,183,101,0.28)",  text: "var(--gold)",  top: "rgba(230,183,101,0.55)",  glow: "rgba(230,183,101,0.11)"},
  coral: { bg: "rgba(255,111,97,0.09)",   border: "rgba(255,111,97,0.28)",   text: "var(--coral)", top: "rgba(255,111,97,0.55)",   glow: "rgba(255,111,97,0.11)" },
};

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
  const isPlainNumber = /^\d+$/.test(value);
  const c = metricToneConfig[tone];

  return (
    <motion.div
      variants={tileVariants}
      whileHover={{ y: -2, scale: 1.015 }}
      transition={{ duration: 0.16, ease }}
      className="group relative overflow-hidden rounded-[var(--radius-md)] border p-5"
      style={{
        background: `linear-gradient(145deg, ${c.bg} 0%, rgba(255,255,255,0.006) 100%)`,
        borderColor: c.border,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 52px ${c.glow}`,
      }}
    >
      {/* Accent line top */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c.top}, transparent)` }}
      />
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="metric-value-hero mt-3" style={{ color: c.text }}>
        {isPlainNumber ? (
          <GSAPCounter value={rawValue} delay={0.38 + index * 0.09} pad={value.length} />
        ) : (
          value
        )}
      </p>
      <p className="mt-2 text-[11px] leading-4 text-[color:var(--muted)]">{delta}</p>
    </motion.div>
  );
}

/* ---------- Market bridge ---------- */

/* Three market-bridge cards — each has distinct identity:
 * BR    → acid + HOT NOW pulse
 * US    → aqua + US→BR arrow animation
 * BRIDGE → violet + transfer % hero number */

// MarketBridge cards — antes: cada um tinha cor própria de borda+bg+blob
// blur+gradient line top. Três blocos saturados disputando a mesma faixa
// horizontal. Agora: estrutura uniforme em fundo neutro, cor reservada
// para o eyebrow e o número. O sinal HOT/NOW segue em vermelho como
// único accent forte. Resultado: o olho lê BR > US > BRIDGE em sequência,
// não três cards berrando ao mesmo tempo.

function MarketBridgeBR({ signal }: { signal?: TrendSignal }) {
  return (
    <motion.div
      variants={bridgeItemVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease }}
      className="relative min-w-0 overflow-hidden rounded-[var(--radius-md)] border p-4"
      style={{
        background: "linear-gradient(145deg, rgba(237,73,86,0.11) 0%, rgba(255,255,255,0.008) 100%)",
        borderColor: "rgba(237,73,86,0.32)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 48px rgba(237,73,86,0.12)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(237,73,86,0.6), transparent)" }} />
      <div aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
        style={{ background: "rgba(237,73,86,0.10)" }} />
      <div className="flex items-center justify-between gap-2">
        <p className="card-eyebrow text-[color:var(--hot)]">top BR agora</p>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hot)]">
          <span className="relative inline-flex h-1.5 w-1.5" aria-hidden="true">
            <span className="signal-now-pulse absolute inset-0 rounded-full bg-[color:var(--hot)]" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-[color:var(--hot)]" />
          </span>
          hot · agora
        </span>
      </div>
      {signal ? (
        <>
          <h2 className="mt-3 min-w-0 break-words text-[15px] font-semibold leading-snug tracking-tight">
            {signal.title}
          </h2>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="metric-value-xl text-[color:var(--hot)]">
              <GSAPCounter value={signal.score.value} delay={0.4} />
            </p>
            <span className="font-mono text-[11px] text-[color:var(--muted)]">/100</span>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[color:var(--muted-strong)]">{signal.decision}</p>
        </>
      ) : (
        <p className="mt-3 text-[13px] text-[color:var(--muted)]">Sem sinal BR no filtro atual.</p>
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
      className="relative min-w-0 overflow-hidden rounded-[var(--radius-md)] border p-4"
      style={{
        background: "linear-gradient(145deg, rgba(88,200,190,0.09) 0%, rgba(255,255,255,0.008) 100%)",
        borderColor: "rgba(88,200,190,0.28)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 48px rgba(88,200,190,0.09)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(88,200,190,0.55), transparent)" }} />
      <div aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
        style={{ background: "rgba(88,200,190,0.07)" }} />
      <div className="flex items-center justify-between gap-2">
        <p className="card-eyebrow text-[color:var(--aqua)]">early signal EUA</p>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
          <span>US</span>
          <motion.span
            aria-hidden="true"
            className="inline-block"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          >
            <ArrowUpRight className="h-3 w-3 -rotate-90 text-[color:var(--aqua)]" />
          </motion.span>
          <span>BR</span>
        </span>
      </div>
      {signal ? (
        <>
          <h2 className="mt-3 min-w-0 break-words text-[15px] font-semibold leading-snug tracking-tight">
            {signal.title}
          </h2>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="metric-value-xl text-[color:var(--aqua)]">
              <GSAPCounter value={signal.score.value} delay={0.5} />
            </p>
            <span className="font-mono text-[11px] text-[color:var(--muted)]">/100</span>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[color:var(--muted-strong)]">{signal.decision}</p>
        </>
      ) : (
        <p className="mt-3 text-[13px] text-[color:var(--muted)]">Sem early signal dos EUA no recorte.</p>
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
      className="relative min-w-0 overflow-hidden rounded-[var(--radius-md)] border p-4 lg:col-span-2 xl:col-span-1"
      style={{
        background: "linear-gradient(145deg, rgba(157,131,236,0.10) 0%, rgba(255,255,255,0.008) 100%)",
        borderColor: "rgba(157,131,236,0.30)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 48px rgba(157,131,236,0.10)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(157,131,236,0.58), transparent)" }} />
      <div aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
        style={{ background: "rgba(157,131,236,0.08)" }} />
      <div className="flex items-center justify-between gap-2">
        <p className="card-eyebrow text-[color:var(--violet)]">ponte US → BR</p>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
          transferibilidade
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="metric-value-hero text-[color:var(--violet)]">
          <GSAPCounter value={transfer} delay={0.6} />
        </p>
        <span className="font-mono text-sm text-[color:var(--muted)]">%</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.04)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${transfer}%` }}
          transition={{ duration: 0.9, delay: 0.7, ease }}
          className="h-full rounded-full bg-[color:var(--violet)]"
        />
      </div>
      <p className="mt-3 text-[12px] leading-5 text-[color:var(--muted-strong)]">
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
      className="app-panel grid min-w-0 gap-3 rounded-[var(--radius-lg)] p-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_260px]"
    >
      <MarketBridgeBR signal={brTop} />
      <MarketBridgeUS signal={usTop} />
      <MarketBridgeTransfer transfer={transfer} />
    </motion.section>
  );
}

/* ---------- Real Instagram source registry ---------- */

function InstagramSourcesPanel({ sources }: { sources: TrendSourceRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const activeCount = sources.filter((s) => s.status === "active").length;

  return (
    <section
      id="instagram-sources"
      className="min-w-0 rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.018)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Fontes</h2>
          <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">
            {sources.length === 0
              ? "Nenhuma fonte registrada"
              : `${activeCount} ativas de ${sources.length}`}
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-[11px] text-[color:var(--muted)] transition hover:border-[rgba(225,48,108,0.32)] hover:text-[color:var(--foreground)]"
          href="/sources"
        >
          Ver tudo
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {sources.length > 0 && (
        <div className="mt-3 grid gap-1.5">
          {sources.slice(0, 4).map((source) => {
            const isOpen = expandedId === source.id;
            return (
              <article
                key={source.id}
                className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : source.id)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <div className="min-w-0">
                    <p className="break-words text-[13px] font-medium leading-5 text-[color:var(--foreground)]">
                      {source.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">
                      {trendSourceTypeLabel[source.sourceType]} · {source.region}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px]",
                      source.status === "active"
                        ? "bg-[rgba(34,197,94,0.12)] text-[color:var(--success)]"
                        : source.status === "error"
                        ? "bg-[rgba(255,77,77,0.12)] text-[color:var(--coral)]"
                        : "bg-[rgba(255,255,255,0.05)] text-[color:var(--muted)]",
                    )}
                  >
                    {trendSourceStatusLabel[source.status]}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease }}
                      className="overflow-hidden border-t border-[color:var(--line)] bg-[rgba(0,0,0,0.12)] px-3 py-2.5 text-[11px] text-[color:var(--muted)]"
                    >
                      <p className="break-all font-mono leading-4 text-[color:var(--muted-strong)]">
                        {source.sourceUrl}
                      </p>
                      <p className="mt-1.5">
                        Atualizado em {formatTrendSourceDate(source.updatedAt)}
                      </p>
                      <a
                        className="mt-2 inline-flex items-center gap-1 text-[color:var(--foreground)] transition hover:text-[color:var(--ig-3)]"
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir fonte
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </article>
            );
          })}
          {sources.length > 4 ? (
            <Link
              className="mt-1 inline-flex justify-center rounded-full border border-dashed border-[color:var(--line)] py-1.5 text-[11px] text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
              href="/sources"
            >
              + {sources.length - 4} fontes
            </Link>
          ) : null}
        </div>
      )}
    </section>
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
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.018)] p-5"
      >
        <div className="grid place-items-center gap-3 py-4 text-center">
          <Inbox className="h-5 w-5 text-[color:var(--muted)]" aria-hidden="true" />
          <h2 className="text-base font-semibold">Selecione um sinal</h2>
          <p className="max-w-xs text-[12px] leading-5 text-[color:var(--muted)]">
            Toque em qualquer card pra abrir evidências, fonte e histórico aqui.
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.018)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-[color:var(--muted)]">Evidências</p>
          <h2 className="mt-1 break-words text-base font-semibold leading-6">{signal.title}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-[rgba(225,48,108,0.08)] px-2.5 py-1 text-[11px] text-[color:var(--foreground)]">
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--aqua)]">proxima decisao</p>
        <p className="mt-2 text-sm leading-5 text-[color:var(--muted-strong)]">
          {savedCount} sinais salvos em {storageLabel}. Proxima acao sugerida: {signal.nextAction}
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
    <section className="min-w-0 rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.018)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Lista de acao</h2>
          <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">
            Salvos e retornando
          </p>
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
                className="app-rail-item rounded-[var(--radius-md)] border-[rgba(237, 73, 86,0.18)] bg-[rgba(237, 73, 86,0.05)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium leading-5">{signal.title}</p>
                  <span className="metric-number shrink-0 text-sm font-semibold text-[color:var(--acid)]">
                    <GSAPCounter value={signal.score.value} delay={0.1 * idx} duration={0.6} />
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[color:var(--muted)]">{signal.nextAction}</p>
              </motion.div>
            ))
          ) : (
            <motion.div
              key="empty-saved"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease }}
              className="rounded-[var(--radius-md)] border border-dashed border-[rgba(237, 73, 86,0.14)] bg-[rgba(237, 73, 86,0.03)] p-4 text-center"
            >
              <Bookmark className="mx-auto h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
              <p className="mt-2 text-xs font-semibold text-[color:var(--muted-strong)]">Lista vazia</p>
              <p className="mt-1 text-[11px] leading-4 text-[color:var(--muted)]">
                Salve um sinal para montar sua proxima rodada de acao.
              </p>
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
            <div className="rounded-[var(--radius-sm)] border border-dashed border-[rgba(169,140,255,0.16)] bg-[rgba(169,140,255,0.04)] px-3 py-3 text-center">
              <RotateCcw className="mx-auto h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
              <p className="mt-1.5 text-[11px] leading-4 text-[color:var(--muted)]">Sem revival ativo nesta leitura.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Sidebar ---------- */

function SidebarNavGroup({
  label,
  items,
  activeKey,
  hoverKey,
  setHoverKey,
  onNavigate,
}: {
  label?: string;
  items: { label: string; icon: typeof LayoutDashboard; key: string }[];
  activeKey: string;
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
  onNavigate: (key: string) => void;
}) {
  return (
    <div className="grid gap-0.5">
      {label ? (
        <p className="mb-1.5 mt-3 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
          {label}
        </p>
      ) : null}
      {items.map((item) => {
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
              "nav-item relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm transition-colors duration-200",
              isActive
                ? "text-[color:var(--foreground)]"
                : "text-[color:var(--muted)] hover:text-[color:var(--muted-strong)]",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active"
                transition={{ type: "spring", stiffness: 520, damping: 44 }}
                className="nav-active-fill absolute inset-0 -z-10 rounded-[var(--radius-md)]"
              />
            )}
            {isActive && <span aria-hidden="true" className="nav-item-indicator" />}
            {!isActive && isHover && (
              <motion.span
                layoutId="sidebar-hover"
                transition={{ type: "spring", stiffness: 520, damping: 44 }}
                className="absolute inset-0 -z-10 rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.025)]"
              />
            )}
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

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
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(8,8,7,0.6)] p-3"
        >
          <div className="brand-mark relative grid h-10 w-10 place-items-center rounded-[var(--radius-md)]">
            <Command className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none tracking-tight">Market Intel</p>
            <p className="mt-1.5 truncate text-[11px] text-[color:var(--muted)]">
              {tenant.workspaceName}
            </p>
          </div>
        </motion.div>

        <LayoutGroup id="sidebar-nav">
          <nav className="mt-6 grid gap-0.5" aria-label="Navegação principal">
            <SidebarNavGroup
              items={navItems}
              activeKey={activeKey}
              hoverKey={hoverKey}
              setHoverKey={setHoverKey}
              onNavigate={onNavigate}
            />
            <SidebarNavGroup
              label="Categorias"
              items={navCategoryItems}
              activeKey={activeKey}
              hoverKey={hoverKey}
              setHoverKey={setHoverKey}
              onNavigate={onNavigate}
            />
            <SidebarNavGroup
              label="Operações"
              items={navOpsItems}
              activeKey={activeKey}
              hoverKey={hoverKey}
              setHoverKey={setHoverKey}
              onNavigate={onNavigate}
            />
          </nav>
        </LayoutGroup>

        <motion.div variants={itemVariants} className="mt-auto pt-6">
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.018)] p-3">
            <p className="truncate text-[11px] text-[color:var(--muted-strong)]">
              {tenant.userEmail}
            </p>
            <p className="mt-1 truncate text-[11px] text-[color:var(--muted)]">
              {roleLabel(tenant.role)}
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                className="inline-flex flex-1 items-center justify-center rounded-full border border-[color:var(--line)] px-3 py-2 text-xs text-[color:var(--muted-strong)] transition hover:border-[rgba(225,48,108,0.32)] hover:text-[color:var(--foreground)]"
                href="/workspace"
              >
                Ajustes
              </Link>
              <button
                className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] px-3 py-2 text-xs text-[color:var(--muted)] transition hover:border-[rgba(255,111,97,0.36)] hover:text-[color:var(--coral)] disabled:opacity-60"
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
              >
                Sair
              </button>
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
  trendSources = [],
  persistence = fallbackPersistence,
  ingestionLab = fallbackIngestionLab,
  reelStats = fallbackReelStats,
  tenant,
}: CommandCenterData) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(signals.length > 0 ? "ready" : "empty");
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [activeNavKey, setActiveNavKey] = useState("cc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState(signals[0]?.id);
  const [savedIds, setSavedIds] = useState(() => new Set(signals.filter((signal) => signal.saved).map((signal) => signal.id)));
  const [, startSavingTransition] = useTransition();
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
  const hasSignals = signals.length > 0;
  const activeCount = hasSignals ? filteredSignals.length : reelStats.total;
  const brCount = hasSignals ? summary.brCount : reelStats.br;
  const usCount = hasSignals ? summary.usCount : reelStats.us;
  const evidenceCount = summary.evidenceCount || reelStats.evidenceCount;
  const averageScore = summary.avgScore || reelStats.avgScore;

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

    if (key === "instagram-sources") {
      scrollToSection("instagram-sources");
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
      label: hasSignals ? "Sinais ativos" : "Reels indexados",
      value: String(activeCount).padStart(2, "0"),
      rawValue: activeCount,
      delta: hasSignals ? `${summary.highPriorityCount} em prioridade alta` : "na biblioteca de Reels",
      tone: "acid" as const,
    },
    {
      label: "Radar BR / US",
      value: `${brCount}/${usCount}`,
      rawValue: brCount,
      delta: hasSignals ? "sinais por mercado" : "Reels por mercado",
      tone: "aqua" as const,
    },
    {
      label: "Evidências",
      value: String(evidenceCount).padStart(2, "0"),
      rawValue: evidenceCount,
      delta: "fontes verificadas",
      tone: "gold" as const,
    },
    {
      label: "Potencial medio",
      value: String(averageScore),
      rawValue: averageScore,
      delta: "média ponderada",
      tone: "coral" as const,
    },
  ];

  return (
    <main className="relative min-h-dvh">
      <ParticleField opacity={0.28} count={55} />
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" />

      <div className="relative z-0 mx-auto grid min-h-dvh w-full max-w-[1840px] gap-0 px-2 py-2 sm:px-3 sm:py-3 lg:grid-cols-[244px_minmax(0,1fr)] lg:py-0 xl:grid-cols-[244px_minmax(0,1fr)_330px] 2xl:grid-cols-[264px_minmax(0,1fr)_360px]">
        <Sidebar activeKey={activeNavKey} tenant={tenant} onLogout={logout} onNavigate={navigateDashboard} isLoggingOut={isLoggingOut} />

        <section id="command-center-top" className="min-w-0 bg-[rgba(7,7,6,0.52)] backdrop-blur-xl lg:my-3 lg:rounded-[var(--radius-lg)] lg:border-x lg:border-[rgba(239,233,220,0.14)]">
          {/* HERO / HEADER — t=0.10, y:-12→0 */}
          <motion.header
            variants={headerVariants}
            initial="hidden"
            animate="show"
            className="app-hero relative m-0 overflow-hidden rounded-none border-x-0 border-t-0 px-5 py-8 md:px-8 md:py-10 lg:rounded-t-[var(--radius-lg)]"
          >
            {/* Atmospheric gradient */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 80% 60% at 10% -20%, rgba(131,58,180,0.16) 0%, transparent 60%),
                  radial-gradient(ellipse 70% 55% at 92% 110%, rgba(225,48,108,0.14) 0%, transparent 55%),
                  radial-gradient(ellipse 100% 80% at 50% 50%, rgba(247,119,55,0.05) 0%, transparent 70%),
                  radial-gradient(ellipse 40% 30% at 75% 0%, rgba(157,131,236,0.10) 0%, transparent 50%)
                `,
              }}
            />
            <HeroOrb3D
              size="md"
              className="absolute right-0 top-0 hidden opacity-60 sm:block md:opacity-80"
            />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="brand-mark grid h-10 w-10 place-items-center rounded-[var(--radius-md)] lg:hidden">
                  <Command className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <GSAPHeroReveal
                    className="text-[28px] font-semibold leading-tight tracking-[-0.02em] md:text-[38px]"
                    delay={0.15}
                  >
                    <GSAPWordSplit text="Reels" />
                    {" "}
                    <GSAPWordSplit text="Center" className="gradient-text-ig" />
                  </GSAPHeroReveal>
                  <motion.p
                    variants={itemVariants}
                    className="mt-1.5 flex items-center gap-2 text-[13px] leading-5 text-[color:var(--muted)]"
                  >
                    <span className="live-dot" aria-hidden="true" />
                    <span>
                      monitorando{" "}
                      <span className="text-[color:var(--muted-strong)]">{tenant.workspaceName}</span>
                      {persistence.mode !== "database" && (
                        <>
                          {" · "}
                          <span className="text-[color:var(--gold)]">modo seguro</span>
                        </>
                      )}
                    </span>
                  </motion.p>
                </div>
              </motion.div>

              <motion.div variants={sectionVariants} className="flex items-center gap-2 xl:justify-end">
                <motion.label
                  variants={itemVariants}
                  className="app-control flex min-h-[var(--control-height)] min-w-0 flex-1 items-center gap-2 rounded-full px-4 py-2 text-sm text-[color:var(--muted-strong)] sm:min-w-[280px] xl:w-[360px] xl:flex-none"
                >
                  <Search className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar sinais, perfis..."
                    className="min-w-0 flex-1 bg-transparent text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted)]"
                  />
                  <span className="hidden font-mono text-[10px] tracking-[0.14em] text-[color:var(--muted)] sm:inline">
                    ⌘K
                  </span>
                </motion.label>
                <motion.button
                  type="button"
                  onClick={() => scrollToSection("alerts-rail")}
                  variants={itemVariants}
                  aria-label="Alertas"
                  className="app-control relative grid h-[var(--control-height)] w-[var(--control-height)] place-items-center rounded-full text-[color:var(--muted-strong)] hover:text-[color:var(--foreground)]"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[color:var(--ig-3)]" />
                </motion.button>
                <motion.div variants={itemVariants}>
                  <Link
                    className="cta-ig inline-flex h-[var(--control-height)] items-center gap-1.5 rounded-full px-5 text-[13px] font-medium"
                    href="/trends"
                  >
                    Encontrar Reels
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {persistence.mode !== "database" && (
              <motion.p
                variants={itemVariants}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(243,201,105,0.32)] bg-[rgba(243,201,105,0.06)] px-3 py-1.5 text-[11px] text-[color:var(--gold)]"
              >
                {persistence.detail}
              </motion.p>
            )}
          </motion.header>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 md:px-6">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
              {/* METRICS */}
              <section
                className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
                aria-label="Métricas operacionais"
              >
                {metricTiles.map((metric, idx) => (
                  <GSAPTileReveal key={metric.label} index={idx}>
                    <MetricTile {...metric} index={idx} />
                  </GSAPTileReveal>
                ))}
              </section>

              {signals.length > 0 && signals.some((s) => s.market === "US") ? (
                <MarketBridge signals={rankSignals(signals, "priority")} />
              ) : null}

              {/* SIGNAL DESK — t=0.30, cards stagger 0.08 */}
              <motion.section
                id="signal-desk"
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.3 }}
              >
                <GSAPSectionReveal className="mb-4">
                  <h2 className="text-xl font-semibold leading-tight tracking-[-0.015em] md:text-[26px]">
                    <span className="gradient-text-ig">Oportunidades</span>{" "}
                    priorizadas
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                    Veja o potencial, confira a origem e escolha a proxima acao.
                  </p>
                </GSAPSectionReveal>

                <motion.div
                  id="signal-filters"
                  variants={itemVariants}
                  className="mb-4 rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.018)] p-3 backdrop-blur-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedFilters((v) => !v)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                          showAdvancedFilters || typeFilter !== "ALL"
                            ? "border-[rgba(225,48,108,0.32)] bg-[rgba(225,48,108,0.08)] text-[color:var(--foreground)]"
                            : "border-[color:var(--line)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                        )}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                        Filtros
                        {typeFilter !== "ALL" && (
                          <span className="ml-0.5 inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--ig-3)]" />
                        )}
                      </button>
                      <div className="hidden items-center gap-1.5 md:inline-flex">
                        <ArrowDownUp className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                        <select
                          value={sortMode}
                          onChange={(e) => setSortMode(e.target.value as SortMode)}
                          aria-label="Ordenação"
                          className="rounded-full border border-[color:var(--line)] bg-transparent px-2.5 py-1.5 text-xs text-[color:var(--muted-strong)] outline-none transition hover:text-[color:var(--foreground)]"
                        >
                          {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {showAdvancedFilters ? (
                      <motion.div
                        key="advanced-filters"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 border-t border-[color:var(--line)] pt-3">
                          <p className="mb-2 text-[11px] text-[color:var(--muted)]">Categoria do sinal</p>
                          <div className="scrollbar-soft overflow-x-auto pb-0.5">
                            <SegmentGroup
                              groupId="type-filter"
                              options={typeOptions}
                              value={typeFilter}
                              onChange={setTypeFilter}
                              ariaLabel="Tipo"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-3 text-xs text-[color:var(--muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="metric-number text-[color:var(--foreground)]">
                        <GSAPCounter value={filteredSignals.length} delay={0.15} duration={0.6} />
                      </span>
                      <span>de {signals.length} sinais</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setMarketFilter("ALL");
                        setTypeFilter("ALL");
                        setPriorityFilter("ALL");
                        setSortMode("priority");
                        setShowAdvancedFilters(false);
                      }}
                      className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-[color:var(--muted)] transition hover:border-[rgba(225,48,108,0.32)] hover:text-[color:var(--foreground)]"
                    >
                      Limpar
                    </button>
                  </div>
                </motion.div>

                <GSAPScrollEntrance className="grid gap-3" stagger={0.07} y={24}>
                  <AnimatePresence mode="popLayout">
                    {workspaceState === "empty" ? (
                      <EmptyState
                        key="empty"
                        variant="empty"
                        title={reelStats.total > 0 ? "Reels importados" : "Sem oportunidades ainda"}
                        body={
                          reelStats.total > 0
                            ? "A biblioteca ja tem Reels reais. Abra Encontrar Reels para analisar videos; os sinais estrategicos ainda nao foram gerados."
                            : "Conecte uma conta, adicione uma fonte oficial ou importe dados licenciados para iniciar o radar."
                        }
                        hint={reelStats.total > 0 ? "ver biblioteca em /trends" : "adicione dados ao radar"}
                      />
                    ) : workspaceState === "error" ? (
                      <EmptyState
                        key="error"
                        variant="error"
                        title="Entrada bloqueada"
                        body="A fonte respondeu com erro. Corrija a origem antes de transformar isso em insight."
                        hint="revisar atualizacoes"
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
                        <div key={signal.id} className="gse-item">
                          <TrendCard
                            signal={signal}
                            index={index}
                            selected={selectedSignal?.id === signal.id}
                            isSaved={savedIds.has(signal.id)}
                            onSelect={() => setSelectedSignalId(signal.id)}
                            onToggleSave={() => toggleSaved(signal.id)}
                          />
                        </div>
                      ))
                    )}
                  </AnimatePresence>
                </GSAPScrollEntrance>
              </motion.section>

              <motion.section
                id="ingestion-lab"
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.45 }}
              >
                <IngestionLab lab={ingestionLab} signals={signals} sources={sources} />
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
                    storageLabel={persistence.mode === "database" ? "dados reais" : "modo seguro"}
                  />
                </div>
              </motion.div>

              <motion.div variants={sectionVariants}>
                <SavedAndHistory savedSignals={savedSignals} revivalSignals={revivalSignals} />
              </motion.div>

              <motion.div variants={sectionVariants}>
                <InstagramSourcesPanel sources={trendSources} />
              </motion.div>
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
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.36, ease }}
        className="mx-auto mb-4 grid h-12 w-12 place-items-center"
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
