"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, CheckCircle2, Radio, Sparkles } from "lucide-react";

import {
  deriveCinematicFlowProgress,
  type CinematicFlowStage,
  type CinematicTone,
} from "@/lib/trends/cinematic-flow";
import { cn } from "@/lib/utils";

const toneClass: Record<CinematicTone, string> = {
  hot: "border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.1)] text-[color:var(--hot)]",
  gold: "border-[rgba(230,183,101,0.28)] bg-[rgba(230,183,101,0.08)] text-[color:var(--gold)]",
  aqua: "border-[rgba(88,200,190,0.26)] bg-[rgba(88,200,190,0.07)] text-[color:var(--aqua)]",
  muted: "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.035)] text-[color:var(--muted-strong)]",
};

export function FlowNarrativePanel({
  stages,
  title = "Narrativa do fluxo",
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
  const focus = progress.current ?? progress.next ?? stages.at(-1);
  const focusTone = focus?.tone ?? "muted";
  const href = focus?.href;

  return (
    <motion.aside
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.09)] bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.014))] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]",
        compact ? "p-3.5" : "p-4",
        className,
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(237,73,86,0.38)] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[rgba(237,73,86,0.1)] blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hot)]">
            {title}
          </p>
          <h3 className="mt-2 text-lg font-semibold leading-tight tracking-[-0.01em] text-[color:var(--foreground)]">
            {focus?.title ?? "Fluxo aguardando dados reais"}
          </h3>
        </div>
        <span className="metric-number shrink-0 text-2xl font-semibold text-[color:var(--foreground)]">
          {progress.label}
        </span>
      </div>

      <div className={cn("relative overflow-hidden rounded-full bg-[rgba(255,255,255,0.055)]", compact ? "mt-3 h-1.5" : "mt-4 h-2")} aria-hidden="true">
        <motion.span
          className="block h-full rounded-full bg-[linear-gradient(90deg,var(--hot),var(--gold),var(--aqua))]"
          initial={prefersReducedMotion ? false : { width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.46, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <p className={cn("relative text-sm text-[color:var(--muted-strong)]", compact ? "mt-3 line-clamp-2 leading-5" : "mt-4 leading-6")}>
        {progress.summary}
      </p>

      {compact ? (
        <div className="relative mt-3 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em]", toneClass[focusTone])}>
            {focus?.state === "complete" ? "etapa concluida" : "etapa atual"}
          </span>
          {focus?.metric ? (
            <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
              {focus.metric}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="relative mt-4 grid gap-2">
          {stages.map((stage) => (
            <div
              key={stage.key}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2",
                stage.state === "complete" ? toneClass[stage.tone] : "border-[rgba(255,255,255,0.07)] bg-[rgba(0,0,0,0.16)] text-[color:var(--muted)]",
              )}
            >
              {stage.state === "complete" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : stage.state === "current" ? (
                <Radio className="h-3.5 w-3.5 shrink-0 text-[color:var(--hot)]" aria-hidden="true" />
              ) : (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(255,255,255,0.28)]" aria-hidden="true" />
              )}
              <span className="line-clamp-1 min-w-0 text-[12px] font-semibold">{stage.title}</span>
              {stage.metric ? (
                <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] opacity-80">
                  {stage.metric}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {href ? (
        <Link
          href={href}
          className={cn(
            "relative mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold transition hover:translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hot)]",
            toneClass[focusTone],
          )}
        >
          {progress.actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(88,200,190,0.24)] bg-[rgba(88,200,190,0.07)] px-3 py-2 text-[11px] font-semibold text-[color:var(--aqua)]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Fluxo completo
        </span>
      )}
    </motion.aside>
  );
}
