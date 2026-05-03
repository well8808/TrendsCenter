"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronRight, Radio } from "lucide-react";

import { deriveCinematicFlowProgress, type CinematicFlowStage } from "@/lib/trends/cinematic-flow";
import { cn } from "@/lib/utils";

const toneClasses = {
  hot: {
    text: "text-[color:var(--hot)]",
    border: "border-[rgba(237,73,86,0.34)]",
    bg: "bg-[rgba(237,73,86,0.08)]",
  },
  gold: {
    text: "text-[color:var(--gold)]",
    border: "border-[rgba(230,183,101,0.3)]",
    bg: "bg-[rgba(230,183,101,0.075)]",
  },
  aqua: {
    text: "text-[color:var(--aqua)]",
    border: "border-[rgba(88,200,190,0.28)]",
    bg: "bg-[rgba(88,200,190,0.065)]",
  },
  muted: {
    text: "text-[color:var(--muted-strong)]",
    border: "border-[rgba(255,255,255,0.1)]",
    bg: "bg-[rgba(255,255,255,0.025)]",
  },
};

function StateMarker({ stage, compact = false }: { stage: CinematicFlowStage; compact?: boolean }) {
  const tone = toneClasses[stage.tone];

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border font-mono font-semibold",
        compact ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[10px]",
        tone.border,
        tone.bg,
        tone.text,
      )}
      aria-hidden="true"
    >
      {stage.state === "complete" ? <Check className="h-3.5 w-3.5" /> : stage.label}
    </span>
  );
}

export function DecisionFlowStepper({
  stages,
  title = "Caminho da oportunidade",
  compact = false,
  className,
}: {
  stages: CinematicFlowStage[];
  title?: string;
  compact?: boolean;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const progress = deriveCinematicFlowProgress(stages);

  return (
    <motion.nav
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(239,233,220,0.1)] bg-[linear-gradient(135deg,rgba(237,73,86,0.055),rgba(255,255,255,0.014)_52%,rgba(88,200,190,0.035))]",
        compact ? "p-3" : "p-3.5",
        className,
      )}
      aria-label={title}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(237,73,86,0.36)] to-transparent"
      />
      <div className={cn("flex items-center justify-between gap-3", compact ? "mb-2" : "mb-3")}>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hot)]">
            {title}
          </p>
          <p className={cn("mt-1 hidden text-[11px] text-[color:var(--muted)] sm:block", compact && "sr-only")}>
            Reel -&gt; Signal -&gt; Brief -&gt; Pauta -&gt; Studio
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="metric-number text-lg font-semibold text-[color:var(--foreground)]">
            {progress.label}
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            {progress.percent}%
          </p>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-full bg-[rgba(255,255,255,0.055)]", compact ? "mb-2 h-1" : "mb-3 h-1.5")} aria-hidden="true">
        <motion.span
          className="block h-full rounded-full bg-[linear-gradient(90deg,var(--hot),var(--gold),var(--aqua))]"
          initial={prefersReducedMotion ? false : { width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className={cn("grid", compact ? "gap-1.5 sm:grid-cols-5" : "gap-2 xl:grid-cols-5")}>
        {stages.map((stage, index) => {
          const content = (
            <div
              className={cn(
                "group relative flex h-full min-w-0 rounded-[var(--radius-md)] border transition",
                compact ? "items-center gap-2 p-2" : "gap-3 p-3",
                toneClasses[stage.tone].border,
                stage.state === "waiting" ? "bg-[rgba(255,255,255,0.012)] opacity-72" : toneClasses[stage.tone].bg,
                stage.state === "current" && "ring-1 ring-[rgba(237,73,86,0.24)]",
                stage.href && "hover:border-[rgba(237,73,86,0.38)] hover:bg-[rgba(237,73,86,0.06)]",
              )}
              aria-current={stage.state === "current" ? "step" : undefined}
              data-flow-stage={stage.key}
              data-flow-state={stage.state}
            >
              <StateMarker stage={stage} compact={compact} />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  {stage.state === "current" ? (
                    <Radio className="h-3 w-3 shrink-0 text-[color:var(--hot)]" aria-hidden="true" />
                  ) : null}
                  <p className={cn("line-clamp-1 font-semibold", compact ? "text-[12px]" : "text-sm", toneClasses[stage.tone].text)}>
                    {stage.title}
                  </p>
                </div>
                <p className={cn("mt-1 text-[11px] leading-4 text-[color:var(--muted)]", compact ? "line-clamp-1" : "line-clamp-2")}>
                  {stage.body}
                </p>
                {stage.metric ? (
                  <p className={cn("font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted-strong)]", compact ? "mt-1 line-clamp-1" : "mt-2")}>
                    {stage.metric}
                  </p>
                ) : null}
              </div>
              {index < stages.length - 1 && !compact ? (
                <ChevronRight
                  className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-[color:var(--muted)] xl:block"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );

          return stage.href ? (
            <Link key={stage.key} href={stage.href} className="min-w-0">
              {content}
            </Link>
          ) : (
            <div key={stage.key} className="min-w-0">
              {content}
            </div>
          );
        })}
      </div>
    </motion.nav>
  );
}
