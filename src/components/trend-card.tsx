"use client";

import { motion } from "motion/react";
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  BookmarkPlus,
  CheckCircle2,
  CircleDot,
  Clock3,
  Layers3,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { MiniTrendLine } from "@/components/mini-trend-line";
import { SourcePill } from "@/components/source-pill";
import { formatScore } from "@/lib/scoring";
import type { ScoreInput, TrendSignal } from "@/lib/types";
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
  if (score >= 68) {
    return "var(--acid)";
  }

  if (score >= 52) {
    return "var(--gold)";
  }

  return "var(--aqua)";
}

const factorConfig: Array<{ key: keyof ScoreInput; label: string }> = [
  { key: "velocity7d", label: "veloc." },
  { key: "brazilFit", label: "fit BR" },
  { key: "formatRepeatability", label: "repete" },
  { key: "evidenceQuality", label: "evid." },
];

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
  const tone = signal.type === "AUDIO" ? "aqua" : signal.market === "US" ? "gold" : "acid";
  const scoreColor = scoreTone(signal.score.value);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-lg)] border bg-[linear-gradient(135deg,rgba(255,255,255,0.082),rgba(255,255,255,0.026))] p-4 transition duration-300 hover:-translate-y-0.5",
        selected
          ? "border-[rgba(199,255,93,0.5)] shadow-[0_18px_70px_rgba(199,255,93,0.08)]"
          : "border-[color:var(--line)] hover:border-[rgba(199,255,93,0.32)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(199,255,93,0.6)] to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="grid gap-4 xl:grid-cols-[1fr_176px]">
        <button className="w-full min-w-0 whitespace-normal text-left" type="button" onClick={onSelect}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[rgba(199,255,93,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)]">
              {signal.market}
            </span>
            <span className="rounded-full border border-[color:var(--line)] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
              {typeLabel[signal.type]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(64,224,208,0.24)] px-2.5 py-1 text-[11px] text-[color:var(--aqua)]">
              <CircleDot className="h-3 w-3" aria-hidden="true" />
              {statusLabel[signal.status]}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                signal.priority === "now" && "bg-[rgba(199,255,93,0.14)] text-[color:var(--acid)]",
                signal.priority === "next" && "bg-[rgba(243,201,105,0.14)] text-[color:var(--gold)]",
                signal.priority === "watch" && "bg-[rgba(64,224,208,0.12)] text-[color:var(--aqua)]",
                signal.priority === "hold" && "bg-[rgba(169,140,255,0.12)] text-[color:var(--violet)]",
              )}
            >
              {priorityLabel[signal.priority]}
            </span>
          </div>

          <h3 className="mt-3 break-words text-base font-semibold leading-snug text-[color:var(--foreground)]">
            {signal.title}
          </h3>
          <p className="mt-2 break-words text-sm leading-6 text-[color:var(--muted)]">{signal.summary}</p>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="min-w-0 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)] p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                decisao
              </p>
              <p className="mt-2 break-words text-sm leading-5 text-[color:var(--muted-strong)]">{signal.decision}</p>
            </div>
            <div className="min-w-0 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)] p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                proxima acao
              </p>
              <p className="mt-2 break-words text-sm leading-5 text-[color:var(--muted-strong)]">{signal.nextAction}</p>
            </div>
            <div className="min-w-0 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)] p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                janela
              </p>
              <p className="mt-2 break-words text-sm leading-5 text-[color:var(--muted-strong)]">{signal.trendWindow}</p>
            </div>
          </div>
        </button>

        <div className="grid content-start gap-3">
          <div className="flex items-start justify-between gap-3 xl:block xl:text-right">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${scoreColor} ${signal.score.value * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-[rgba(7,7,6,0.92)]">
                <div className="text-center">
                  <p className="font-mono text-xl font-semibold text-[color:var(--foreground)]">
                    {formatScore(signal.score)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    score
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-0 xl:mt-3">
              <p
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
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
              <p className="mt-1 text-xs text-[color:var(--muted)]">{riskLabel[signal.riskLevel]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleSave}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition",
              isSaved
                ? "border-[rgba(199,255,93,0.38)] bg-[rgba(199,255,93,0.1)] text-[color:var(--acid)]"
                : "border-[color:var(--line)] text-[color:var(--muted-strong)] hover:border-[rgba(64,224,208,0.42)] hover:text-[color:var(--aqua)]",
            )}
          >
            {isSaved ? <Bookmark className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
            {isSaved ? "salvo" : "salvar"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_190px]">
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-4">
            {factorConfig.map((factor) => (
              <div key={factor.key}>
                <div className="flex items-center justify-between text-[11px] text-[color:var(--muted)]">
                  <span>{factor.label}</span>
                  <span className="font-mono">{signal.scoreInput[factor.key]}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${signal.scoreInput[factor.key]}%` }}
                    transition={{ duration: 0.55, delay: 0.05 + index * 0.02 }}
                    className="h-full rounded-full bg-gradient-to-r from-[color:var(--acid)] to-[color:var(--aqua)]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {signal.scoreDrivers.map((driver) => (
              <span
                key={driver}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs text-[color:var(--muted-strong)]"
              >
                <CheckCircle2 className="h-3 w-3 text-[color:var(--acid)]" aria-hidden="true" />
                {driver}
              </span>
            ))}
          </div>
        </div>
        <MiniTrendLine tone={tone} />
      </div>

      <div className="mt-4 grid gap-3 border-t border-[color:var(--line)] pt-4 lg:grid-cols-[1fr_1.2fr]">
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
          {signal.evidence.slice(0, 2).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={onSelect}
              className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.14)] px-3 py-2 text-left transition hover:border-[rgba(64,224,208,0.38)]"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-xs font-medium text-[color:var(--foreground)]">
                  <Layers3 className="h-3.5 w-3.5 text-[color:var(--aqua)]" aria-hidden="true" />
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-[color:var(--muted)]">{item.sourceLabel}</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted)]" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
