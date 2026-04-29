"use client";

import { AnimatePresence, animate, motion, useMotionValue, type Variants } from "motion/react";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  BookmarkPlus,
  CheckCircle2,
  Layers3,
  ShieldAlert,
  Zap,
} from "lucide-react";

import { MiniTrendLine } from "@/components/mini-trend-line";
import { SourcePill } from "@/components/source-pill";
import type { ScoreInput, TrendSignal } from "@/lib/types";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const statusLabel = {
  rising: "subindo",
  returning: "retornando",
  watch: "observar",
  blocked: "bloqueado",
};

const typeLabel = {
  AUDIO: "audio",
  FORMAT: "formato",
  HASHTAG: "hashtag",
  CREATOR: "creator",
  REVIVAL: "revival",
  US_TO_BR: "US para BR",
};

const priorityLabel = {
  now: "prioridade agora",
  next: "próximo teste",
  watch: "watchlist",
  hold: "aguardar",
};

const riskLabel = {
  low: "risco baixo",
  medium: "risco médio",
  high: "risco alto",
};

const stageLabel = {
  emerging: "emergindo",
  accelerating: "acelerando",
  proving: "provando",
  revival: "revival",
  monitor: "monitorar",
};

function scoreTone(score: number) {
  if (score >= 78) return "var(--acid)";
  if (score >= 52) return "var(--gold)";
  return "var(--aqua)";
}

function scoreTier(score: number): { label: string; tone: "acid" | "gold" | "aqua" } {
  if (score >= 78) return { label: "HOT", tone: "acid" };
  if (score >= 52) return { label: "WARM", tone: "gold" };
  return { label: "COOL", tone: "aqua" };
}

function priorityTone(priority: keyof typeof priorityLabel) {
  if (priority === "now") {
    return "border-[rgba(237, 73, 86,0.38)] bg-[rgba(237, 73, 86,0.12)] text-[color:var(--acid)]";
  }
  if (priority === "next") {
    return "border-[rgba(243,201,105,0.32)] bg-[rgba(243,201,105,0.1)] text-[color:var(--gold)]";
  }
  if (priority === "watch") {
    return "border-[rgba(64,224,208,0.3)] bg-[rgba(64,224,208,0.09)] text-[color:var(--aqua)]";
  }
  return "border-[rgba(169,140,255,0.3)] bg-[rgba(169,140,255,0.09)] text-[color:var(--violet)]";
}

const factorConfig: Array<{ key: keyof ScoreInput; label: string }> = [
  { key: "velocity7d", label: "veloc." },
  { key: "brazilFit", label: "fit BR" },
  { key: "formatRepeatability", label: "repete" },
  { key: "evidenceQuality", label: "evid." },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.44,
      ease,
      when: "beforeChildren",
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease } },
};

const pillVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 4 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease } },
};

function AnimatedNumber({
  value,
  delay = 0,
  duration = 0.9,
}: {
  value: number;
  delay?: number;
  duration?: number;
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

  return <>{display}</>;
}

function ScoreRing({
  score,
  color,
  delay,
  isNow,
}: {
  score: number;
  color: string;
  delay: number;
  isNow: boolean;
}) {
  const tier = scoreTier(score);

  // Score visual reduzido: número + /100 como ancoragem única.
  // O tier label só aparece quando é HOT/NOW para reservar o impacto vermelho.
  // Removidos: label "score" eyebrow, barra de progresso (redundante com número),
  // glow blur (somava poluição em listas).
  return (
    <motion.div variants={itemVariants} className="flex flex-col items-end gap-2">
      <div className="relative flex items-baseline justify-end gap-1.5">
        <p className="score-value" style={{ color: isNow ? color : "var(--foreground)" }}>
          <AnimatedNumber value={score} delay={delay} />
        </p>
        <span className="font-mono text-[11px] font-medium text-[color:var(--muted)]">
          /100
        </span>
      </div>
      {isNow ? (
        <div className="inline-flex items-center gap-1.5">
          <span className="relative inline-flex h-1.5 w-1.5" aria-hidden="true">
            <span className="signal-now-pulse absolute inset-0 rounded-full bg-[color:var(--hot)]" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-[color:var(--hot)]" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--hot)]">
            hot · agora
          </span>
        </div>
      ) : (
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
          {tier.label.toLowerCase()}
        </span>
      )}
    </motion.div>
  );
}

function SignalPulse() {
  return (
    <span
      className="relative inline-flex h-2.5 w-2.5 items-center justify-center"
      aria-hidden="true"
    >
      <span className="signal-now-pulse absolute inset-0 rounded-full bg-[color:var(--acid)]" />
      <span className="signal-now-core absolute inset-[3px] rounded-full bg-[color:var(--acid)]" />
    </span>
  );
}

export function TrendCard({
  signal,
  index,
  selected,
  isSaved,
  onSelect,
  onToggleSave,
}: {
  signal: TrendSignal;
  index: number;
  selected: boolean;
  isSaved: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
}) {
  const tone =
    signal.type === "AUDIO" ? "aqua" : signal.market === "US" ? "gold" : "acid";
  const scoreColor = scoreTone(signal.score.value);
  const isNow = signal.priority === "now";
  const baseDelay = index * 0.05;
  const scoreDelay = baseDelay + 0.2;
  const [showDetails, setShowDetails] = useState(false);
  const scoreTierInfo = scoreTier(signal.score.value);

  return (
    <motion.article
      layout
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ delay: baseDelay }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-2xl)] border bg-[rgba(255,255,255,0.018)] backdrop-blur-xl transition-colors",
        selected
          ? "border-[rgba(225,48,108,0.32)]"
          : "border-[color:var(--line)] hover:border-[rgba(255,255,255,0.14)]",
      )}
    >
      {isNow ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(225,48,108,0.22), transparent 65%)" }}
        />
      ) : null}

      <div className="relative grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_180px]">
        <button
          className="w-full min-w-0 whitespace-normal text-left"
          type="button"
          onClick={onSelect}
        >
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--muted)]"
          >
            <span className="font-medium text-[color:var(--muted-strong)]">{signal.market}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>{typeLabel[signal.type]}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>{statusLabel[signal.status]}</span>
          </motion.div>

          <motion.h3
            variants={itemVariants}
            className="mt-2 break-words text-xl font-semibold leading-[1.15] tracking-tight text-[color:var(--foreground)] md:text-[22px]"
          >
            {signal.title}
          </motion.h3>

          <motion.p
            variants={itemVariants}
            className="mt-2 max-w-3xl break-words text-[14px] leading-6 text-[color:var(--muted-strong)]"
          >
            {signal.summary}
          </motion.p>

          <motion.div
            className="mt-3 flex flex-wrap items-center gap-2"
            variants={itemVariants}
          >
            <motion.span
              variants={pillVariants}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                priorityTone(signal.priority),
              )}
            >
              {isNow ? (
                <>
                  <SignalPulse />
                  <Zap className="h-3 w-3" aria-hidden="true" />
                </>
              ) : null}
              {priorityLabel[signal.priority]}
            </motion.span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]",
                signal.score.riskAdjusted
                  ? "bg-[rgba(243,201,105,0.1)] text-[color:var(--gold)]"
                  : "bg-[rgba(34,197,94,0.1)] text-[color:var(--success)]",
              )}
            >
              {signal.score.riskAdjusted ? (
                <ShieldAlert className="h-3 w-3" aria-hidden="true" />
              ) : (
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
              )}
              {riskLabel[signal.riskLevel]}
            </span>
          </motion.div>
        </button>

        <div className="grid content-start gap-3 xl:justify-items-end">
          <div className="flex items-center justify-between gap-4 xl:grid xl:justify-items-end xl:text-right">
            <ScoreRing
              score={signal.score.value}
              color={scoreColor}
              delay={scoreDelay}
              isNow={isNow}
            />
          </div>
          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onToggleSave}
            className={cn(
              "inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-full border px-4 text-[13px] font-medium transition xl:w-[140px]",
              isSaved
                ? "border-[rgba(225,48,108,0.32)] bg-[rgba(225,48,108,0.08)] text-[color:var(--foreground)]"
                : "border-[color:var(--line)] text-[color:var(--muted-strong)] hover:border-[rgba(225,48,108,0.32)] hover:text-[color:var(--foreground)]",
            )}
          >
            {isSaved ? (
              <Bookmark className="h-3.5 w-3.5" />
            ) : (
              <BookmarkPlus className="h-3.5 w-3.5" />
            )}
            {isSaved ? "Salvo" : "Salvar"}
          </motion.button>
        </div>
      </div>

      <div className="border-t border-[color:var(--line)] px-5 py-3 md:px-6">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-[12px] text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
        >
          <span className="flex items-center gap-2">
            <SourcePill source={signal.source} compact />
            <span className="hidden text-[color:var(--muted)] sm:inline">
              {stageLabel[signal.stage]} · força {signal.strength}
            </span>
          </span>
          <span className="flex items-center gap-1">
            {showDetails ? "Ocultar detalhes" : "Ver detalhes"}
            <ArrowUpRight
              className={cn(
                "h-3 w-3 transition-transform",
                showDetails ? "rotate-90" : "rotate-0",
              )}
              aria-hidden="true"
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showDetails ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease }}
            className="overflow-hidden border-t border-[color:var(--line)] bg-[rgba(0,0,0,0.12)]"
          >
            <div className="grid gap-5 p-5 md:p-6 lg:grid-cols-[1.2fr_1fr_0.9fr]">
              <div className="min-w-0">
                <p className="text-[11px] text-[color:var(--muted)]">Decisão</p>
                <p className="mt-1.5 break-words text-[13px] font-medium leading-5 text-[color:var(--foreground)]">
                  {signal.decision}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[color:var(--muted)]">Próxima ação</p>
                <p className="mt-1.5 break-words text-[13px] leading-5 text-[color:var(--muted-strong)]">
                  {signal.nextAction}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[color:var(--muted)]">Janela</p>
                <p className="mt-1.5 break-words text-[13px] leading-5 text-[color:var(--muted-strong)]">
                  {signal.trendWindow}
                </p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-[color:var(--line)] p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_180px]">
              <div className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-4">
                  {factorConfig.map((factor) => {
                    const value = signal.scoreInput[factor.key];
                    return (
                      <div key={factor.key}>
                        <div className="flex items-center justify-between text-[11px] text-[color:var(--muted)]">
                          <span>{factor.label}</span>
                          <span className="metric-number text-[color:var(--muted-strong)]">
                            {value}
                          </span>
                        </div>
                        <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 0.5, ease }}
                            className="h-full rounded-full"
                            style={{ background: scoreColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {signal.scoreDrivers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {signal.scoreDrivers.slice(0, 4).map((driver) => (
                      <span
                        key={driver}
                        className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,255,255,0.025)] px-2.5 py-1 text-[11px] text-[color:var(--muted-strong)]"
                      >
                        <CheckCircle2
                          className="h-3 w-3 text-[color:var(--success)]"
                          aria-hidden="true"
                        />
                        {driver}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <MiniTrendLine tone={tone} />
            </div>

            {(signal.evidence.length > 0 || signal.tags.length > 0) && (
              <div className="grid gap-3 border-t border-[color:var(--line)] p-5 md:p-6">
                {signal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {signal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[rgba(255,255,255,0.025)] px-2.5 py-1 text-[11px] text-[color:var(--muted-strong)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {signal.evidence.slice(0, 2).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={onSelect}
                    className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] bg-[rgba(0,0,0,0.2)] px-3 py-2.5 text-left transition hover:bg-[rgba(225,48,108,0.06)]"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-[12px] font-medium text-[color:var(--foreground)]">
                        <Layers3
                          className="h-3.5 w-3.5 text-[color:var(--muted)]"
                          aria-hidden="true"
                        />
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[color:var(--muted)]">
                        {item.sourceLabel}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted)]"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* tier marker for screen readers / future analytics */}
      <span className="sr-only">{scoreTierInfo.label}</span>
    </motion.article>
  );
}
