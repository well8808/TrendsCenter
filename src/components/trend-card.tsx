"use client";

import { animate, motion, useMotionValue, type Variants } from "motion/react";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  BookmarkPlus,
  CheckCircle2,
  Clock3,
  Layers3,
  ShieldAlert,
  Sparkles,
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
  next: "proximo teste",
  watch: "watchlist",
  hold: "aguardar",
};

const riskLabel = {
  low: "risco baixo",
  medium: "risco medio",
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
  if (score >= 68) return "var(--acid)";
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
    return "border-[rgba(199,255,93,0.38)] bg-[rgba(199,255,93,0.12)] text-[color:var(--acid)]";
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

  return (
    <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
      <p className="card-eyebrow" style={{ color }}>
        score
      </p>
      <div className="relative flex items-baseline justify-center gap-1">
        <motion.span
          aria-hidden="true"
          className="absolute inset-[-24px] -z-10 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${color}, transparent 65%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isNow ? 0.45 : 0.22 }}
          transition={{ duration: 0.7, delay: delay + 0.15, ease }}
        />
        <p className="score-value text-[color:var(--foreground)]">
          <AnimatedNumber value={score} delay={delay} />
        </p>
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
          /100
        </span>
      </div>
      <div className="relative h-1.5 w-28 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, delay, ease }}
          className="relative h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 40%, transparent))`,
          }}
        >
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-5 rounded-full bg-white/45 blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.9, delay: delay + 0.1, ease }}
          />
        </motion.div>
      </div>
      {isNow ? (
        <div className="relative inline-flex items-center gap-1.5">
          <span className="relative inline-flex h-2 w-2" aria-hidden="true">
            <span className="signal-now-pulse absolute inset-0 rounded-full bg-[color:var(--acid)]" />
            <span className="relative h-2 w-2 rounded-full bg-[color:var(--acid)]" />
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--acid)]">
            {tier.label} · NOW
          </span>
        </div>
      ) : (
        <motion.span
          variants={itemVariants}
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em]",
            tier.tone === "acid" && "border-[rgba(199,255,93,0.38)] bg-[rgba(199,255,93,0.1)] text-[color:var(--acid)]",
            tier.tone === "gold" && "border-[rgba(243,201,105,0.38)] bg-[rgba(243,201,105,0.1)] text-[color:var(--gold)]",
            tier.tone === "aqua" && "border-[rgba(64,224,208,0.38)] bg-[rgba(64,224,208,0.1)] text-[color:var(--aqua)]",
          )}
        >
          {tier.label}
        </motion.span>
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
  const baseDelay = index * 0.06;
  const scoreDelay = baseDelay + 0.28;

  return (
    <motion.article
      layout
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ delay: baseDelay }}
      whileHover={{ y: -3 }}
      className={cn(
        "app-card-interactive group relative overflow-hidden rounded-[var(--radius-lg)] p-0",
        selected
          ? "border-[rgba(199,255,93,0.48)] shadow-[0_24px_90px_rgba(199,255,93,0.09)]"
          : "border-[color:var(--line)]",
      )}
    >
      {isNow ? (
        <>
          <div
            aria-hidden="true"
            className="trend-card-now-border pointer-events-none absolute -inset-px rounded-[calc(var(--radius-lg)+1px)] opacity-50 blur-[1px]"
            style={{
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              padding: "1px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[rgba(199,255,93,0.12)] blur-3xl"
          />
        </>
      ) : null}

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at 20% 0%, ${scoreColor}0f, transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[rgba(199,255,93,0.62)] to-transparent opacity-0 transition group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(239,233,220,0.32)] to-transparent" />

      <div className="relative grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_200px]">
        <button
          className="w-full min-w-0 whitespace-normal text-left"
          type="button"
          onClick={onSelect}
        >
          <motion.p
            variants={itemVariants}
            className="card-eyebrow flex items-center gap-2"
          >
            <span className="font-mono tabular-nums">#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true" className="h-px w-4 bg-[color:var(--line-strong)]" />
            <span style={{ color: "var(--acid)" }}>{signal.market}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>{typeLabel[signal.type]}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span style={{ color: "var(--aqua)" }}>{statusLabel[signal.status]}</span>
          </motion.p>

          <motion.h3
            variants={itemVariants}
            className="mt-2 break-words text-xl font-semibold leading-[1.08] tracking-tight text-[color:var(--foreground)] md:text-2xl"
          >
            {signal.title}
          </motion.h3>

          <motion.div
            className="mt-3 flex flex-wrap items-center gap-2"
            variants={itemVariants}
          >
            <motion.span
              variants={pillVariants}
              className={cn(
                "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                priorityTone(signal.priority),
                isNow && "priority-shine",
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
          </motion.div>
          <motion.p
            variants={itemVariants}
            className="mt-2 max-w-3xl break-words text-sm leading-6 text-[color:var(--muted-strong)]"
          >
            {signal.summary}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-5 grid gap-4 border-t border-[color:var(--line)] pt-4 lg:grid-cols-[1.15fr_1fr_0.82fr]"
          >
            <div className="min-w-0">
              <p className="eyebrow">decisao</p>
              <p className="mt-2 break-words text-sm font-medium leading-5 text-[color:var(--foreground)]">
                {signal.decision}
              </p>
            </div>
            <div className="min-w-0">
              <p className="eyebrow">proxima acao</p>
              <p className="mt-2 break-words text-sm leading-5 text-[color:var(--muted-strong)]">
                {signal.nextAction}
              </p>
            </div>
            <div className="min-w-0">
              <p className="eyebrow">janela</p>
              <p className="mt-2 break-words text-sm leading-5 text-[color:var(--muted-strong)]">
                {signal.trendWindow}
              </p>
            </div>
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
            <motion.div variants={itemVariants} className="min-w-0 xl:mt-3">
              <p
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  signal.score.riskAdjusted
                    ? "text-[color:var(--gold)]"
                    : "text-[color:var(--success)]",
                )}
              >
                {signal.score.riskAdjusted ? (
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {signal.score.label}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {riskLabel[signal.riskLevel]}
              </p>
            </motion.div>
          </div>
          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onToggleSave}
            className={cn(
              "inline-flex min-h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition xl:w-[132px]",
              isSaved
                ? "border-[rgba(199,255,93,0.38)] bg-[rgba(199,255,93,0.1)] text-[color:var(--acid)]"
                : "border-[color:var(--line)] text-[color:var(--muted-strong)] hover:border-[rgba(64,224,208,0.42)] hover:text-[color:var(--aqua)]",
            )}
          >
            {isSaved ? (
              <Bookmark className="h-3.5 w-3.5" />
            ) : (
              <BookmarkPlus className="h-3.5 w-3.5" />
            )}
            {isSaved ? "salvo" : "salvar"}
          </motion.button>
        </div>
      </div>

      <motion.div
        variants={itemVariants}
        className="relative grid gap-4 border-t border-[color:var(--line)] px-5 pb-5 pt-4 xl:grid-cols-[minmax(0,1fr)_190px]"
      >
        <div className="grid gap-3">
          <motion.div
            className="grid gap-2 sm:grid-cols-4"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.06, delayChildren: 0.15 },
              },
            }}
          >
            {factorConfig.map((factor) => {
              const value = signal.scoreInput[factor.key];
              return (
                <motion.div key={factor.key} variants={itemVariants}>
                  <div className="flex items-center justify-between text-[11px] text-[color:var(--muted)]">
                    <span>{factor.label}</span>
                    <span className="metric-number text-[color:var(--muted-strong)]">
                      <AnimatedNumber value={value} delay={baseDelay + 0.4} duration={0.7} />
                    </span>
                  </div>
                  <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{
                        duration: 0.75,
                        delay: baseDelay + 0.32,
                        ease,
                      }}
                      className="relative h-full rounded-full bg-gradient-to-r from-[color:var(--acid)] via-[color:var(--acid)] to-[color:var(--aqua)]"
                    >
                      <motion.span
                        aria-hidden="true"
                        className="absolute inset-y-0 right-0 w-6 rounded-full bg-white/40 blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                          duration: 0.8,
                          delay: baseDelay + 0.35,
                          ease,
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="flex flex-wrap gap-2">
            {signal.scoreDrivers.map((driver, i) => (
              <motion.span
                key={driver}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: baseDelay + 0.5 + i * 0.04,
                  ease,
                }}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] bg-[rgba(255,255,255,0.025)] px-2.5 py-1 text-xs text-[color:var(--muted-strong)]"
              >
                <CheckCircle2
                  className="h-3 w-3 text-[color:var(--acid)]"
                  aria-hidden="true"
                />
                {driver}
              </motion.span>
            ))}
          </div>
        </div>
        <MiniTrendLine tone={tone} />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid gap-3 border-t border-[color:var(--line)] bg-[rgba(0,0,0,0.12)] px-5 py-4 lg:grid-cols-[1fr_1.2fr]"
      >
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SourcePill source={signal.source} compact />
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs text-[color:var(--muted)]">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {stageLabel[signal.stage]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs text-[color:var(--muted)]">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              forca {signal.strength}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {signal.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs text-[color:var(--muted-strong)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          {signal.evidence.slice(0, 2).map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={onSelect}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.32,
                delay: baseDelay + 0.55 + i * 0.06,
                ease,
              }}
              whileHover={{ x: 2 }}
              className="group/evidence flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.2)] px-3 py-2 text-left transition hover:border-[rgba(64,224,208,0.38)]"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-xs font-medium text-[color:var(--foreground)]">
                  <Layers3
                    className="h-3.5 w-3.5 text-[color:var(--aqua)]"
                    aria-hidden="true"
                  />
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-[color:var(--muted)]">
                  {item.sourceLabel}
                </span>
              </span>
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted)] transition group-hover/evidence:-translate-y-0.5 group-hover/evidence:translate-x-0.5 group-hover/evidence:text-[color:var(--aqua)]"
                aria-hidden="true"
              />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.article>
  );
}
