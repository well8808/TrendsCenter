"use client";

import { motion } from "motion/react";
import { ArrowUpRight, BadgeCheck, CircleDot, ShieldAlert } from "lucide-react";

import { MiniTrendLine } from "@/components/mini-trend-line";
import { SourcePill } from "@/components/source-pill";
import { formatScore } from "@/lib/scoring";
import type { TrendSignal } from "@/lib/types";
import { cn } from "@/lib/utils";

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

export function TrendCard({ signal, index }: { signal: TrendSignal; index: number }) {
  const tone = signal.type === "AUDIO" ? "aqua" : signal.type === "US_TO_BR" ? "gold" : "acid";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(199,255,93,0.32)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(199,255,93,0.55)] to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[rgba(199,255,93,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)]">
              {signal.market}
            </span>
            <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              {typeLabel[signal.type]}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-strong)]">
              <CircleDot className="h-3 w-3" aria-hidden="true" />
              {statusLabel[signal.status]}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold leading-snug text-[color:var(--foreground)]">
            {signal.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{signal.summary}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-semibold text-[color:var(--foreground)]">
            {formatScore(signal.score)}
          </p>
          <p
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-xs",
              signal.score.riskAdjusted ? "text-[color:var(--gold)]" : "text-[color:var(--success)]",
            )}
          >
            {signal.score.riskAdjusted ? (
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {signal.score.label}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_150px]">
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[color:var(--acid)] via-[color:var(--aqua)] to-[color:var(--gold)]"
              style={{ width: `${signal.score.value}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
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
        <MiniTrendLine tone={tone} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-4">
        <SourcePill source={signal.source} compact />
        <button className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition hover:border-[rgba(64,224,208,0.44)] hover:text-[color:var(--aqua)]">
          Abrir evidencia
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}
