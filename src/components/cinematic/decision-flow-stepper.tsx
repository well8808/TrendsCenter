"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronRight } from "lucide-react";

import type { CinematicFlowStage } from "@/lib/trends/cinematic-flow";
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

function StateMarker({ stage }: { stage: CinematicFlowStage }) {
  const tone = toneClasses[stage.tone];

  return (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full border font-mono text-[10px] font-semibold",
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

  return (
    <motion.nav
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(239,233,220,0.1)] bg-[linear-gradient(135deg,rgba(237,73,86,0.055),rgba(255,255,255,0.014)_52%,rgba(88,200,190,0.035))] p-3.5",
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hot)]">
          {title}
        </p>
        <p className="hidden text-[11px] text-[color:var(--muted)] sm:block">
          Reel -&gt; Signal -&gt; Brief -&gt; Pauta -&gt; Studio
        </p>
      </div>

      <div className={cn("grid gap-2", compact ? "lg:grid-cols-5" : "xl:grid-cols-5")}>
        {stages.map((stage, index) => {
          const content = (
            <div
              className={cn(
                "group relative flex h-full min-w-0 gap-3 rounded-[var(--radius-md)] border p-3 transition",
                toneClasses[stage.tone].border,
                stage.state === "waiting" ? "bg-[rgba(255,255,255,0.012)] opacity-72" : toneClasses[stage.tone].bg,
                stage.href && "hover:border-[rgba(237,73,86,0.38)] hover:bg-[rgba(237,73,86,0.06)]",
              )}
            >
              <StateMarker stage={stage} />
              <div className="min-w-0">
                <p className={cn("line-clamp-1 text-sm font-semibold", toneClasses[stage.tone].text)}>
                  {stage.title}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[color:var(--muted)]">
                  {stage.body}
                </p>
                {stage.metric ? (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
                    {stage.metric}
                  </p>
                ) : null}
              </div>
              {index < stages.length - 1 ? (
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
