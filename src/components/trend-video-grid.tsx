"use client";

import Link from "next/link";
import { animate, motion, useMotionTemplate, useMotionValue, type Variants } from "motion/react";
import { ArrowUpRight, Flame, Radar, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.12 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease } },
};

export interface TrendVideoView {
  id: string;
  title: string;
  caption?: string;
  market: string;
  origin: string;
  trendScore: number;
  growthViews: number;
  velocityScore: number;
  accelerationScore: number;
  snapshotCount: number;
  evidenceCount: number;
  views: number;
  creator?: string;
  sound?: string;
  hashtags: string[];
}

function scoreTier(score: number): { label: string; tone: "acid" | "gold" | "aqua" } {
  if (score >= 78) return { label: "HOT", tone: "acid" };
  if (score >= 52) return { label: "WARM", tone: "gold" };
  return { label: "COOL", tone: "aqua" };
}

function scoreColor(score: number) {
  if (score >= 78) return "var(--acid)";
  if (score >= 52) return "var(--gold)";
  return "var(--aqua)";
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, delay, ease });
    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [count, value, delay]);

  return <>{display}</>;
}

function ScoreDisc({ score, delay }: { score: number; delay: number }) {
  const color = scoreColor(score);
  const angle = useMotionValue(0);
  const bg = useMotionTemplate`conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.06) 0deg)`;
  const tier = scoreTier(score);
  const isHot = score >= 78;

  useEffect(() => {
    const controls = animate(angle, score * 3.6, { duration: 0.95, delay, ease });
    return () => controls.stop();
  }, [angle, score, delay]);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative grid h-[88px] w-[88px] shrink-0 place-items-center rounded-full">
        <motion.div
          aria-hidden="true"
          className="absolute inset-[-10px] rounded-full blur-xl"
          style={{ background: `radial-gradient(circle, ${color}, transparent 65%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHot ? 0.48 : 0.24 }}
          transition={{ duration: 0.6, delay: delay + 0.1, ease }}
        />
        {isHot && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-[-4px] rounded-full"
            style={{ border: `1px solid ${color}` }}
            animate={{ opacity: [0.5, 0.12, 0.5], scale: [1, 1.07, 1] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        )}
        <motion.div
          className="relative grid h-[88px] w-[88px] place-items-center rounded-full"
          style={{ background: bg }}
        >
          <div className="grid h-[70px] w-[70px] place-items-center rounded-full bg-[rgba(7,7,6,0.96)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="text-center">
              <p
                className="metric-number text-[21px] font-semibold leading-none tracking-tight"
                style={{ color }}
              >
                <AnimatedNumber value={score} delay={delay} />
              </p>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                /100
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <span
        className={cn(
          "rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.24em]",
          tier.tone === "acid" && "border-[rgba(237, 73, 86,0.38)] bg-[rgba(237, 73, 86,0.1)] text-[color:var(--acid)]",
          tier.tone === "gold" && "border-[rgba(243,201,105,0.38)] bg-[rgba(243,201,105,0.1)] text-[color:var(--gold)]",
          tier.tone === "aqua" && "border-[rgba(64,224,208,0.38)] bg-[rgba(64,224,208,0.1)] text-[color:var(--aqua)]",
        )}
      >
        {tier.label}
      </span>
    </div>
  );
}

const compactFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const fmt = (n: number) => compactFmt.format(n);

interface MetricPair {
  label: string;
  value: string | number;
  tone?: string;
  animated?: boolean;
  delay?: number;
}

function MetricPairRow({ label, value, tone, animated, delay = 0 }: MetricPair) {
  const toneStyle = tone ? { color: `var(${tone})` } : { color: "var(--foreground)" };
  const isNum = typeof value === "number";

  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
        {label}
      </span>
      <span className="metric-number text-sm font-semibold" style={toneStyle}>
        {animated && isNum ? <AnimatedNumber value={value as number} delay={delay} /> : value}
      </span>
    </div>
  );
}

export function TrendVideoGrid({ results }: { results: TrendVideoView[] }) {
  if (results.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="app-panel relative overflow-hidden rounded-[var(--radius-lg)] border-dashed p-12 text-center"
      >
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-6 h-16 w-16 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(64,224,208,0.45), transparent 70%)" }}
        />
        <Sparkles className="mx-auto mb-3 h-6 w-6 text-[color:var(--muted)]" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Nenhuma trend indexada nesse recorte</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:var(--muted-strong)]">
          A busca permanece vazia até existir ingestão com fonte e evidência rastreável.
        </p>
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
          <Radar className="h-3 w-3" aria-hidden="true" />
          safe-mode · sem scraping
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section variants={gridVariants} initial="hidden" animate="show" className="grid gap-3">
      {results.map((video, idx) => {
        const isHot = video.trendScore >= 78;
        const color = scoreColor(video.trendScore);
        const baseDelay = 0.2 + idx * 0.04;

        return (
          <motion.div
            key={video.id}
            variants={cardVariants}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18, ease }}
          >
            <Link
              href={`/trends/${video.id}`}
              className={cn(
                "app-card-interactive group relative block overflow-hidden rounded-[var(--radius-lg)] p-0",
                isHot
                  ? "border-[rgba(237, 73, 86,0.3)] shadow-[0_0_60px_rgba(237, 73, 86,0.06)]"
                  : "border-[color:var(--line)]",
              )}
            >
              {isHot && (
                <>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-[rgba(237, 73, 86,0.1)] blur-3xl"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(237, 73, 86,0.5)] to-transparent"
                  />
                </>
              )}
              {!isHot && (
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(239,233,220,0.2)] to-transparent"
                />
              )}

              <div className="relative grid gap-0 xl:grid-cols-[minmax(0,1fr)_160px_220px]">
                {/* ── Body ── */}
                <div className="min-w-0 p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isHot && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(237, 73, 86,0.42)] bg-[rgba(237, 73, 86,0.12)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                        <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                        hot
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                        video.market === "BR" ? "tag-acid" : "tag-aqua",
                      )}
                    >
                      {video.market}
                    </span>
                    <span className="tag-neutral rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]">
                      {video.origin}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[color:var(--muted)]">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h2
                    className="mt-3.5 break-words text-xl font-semibold leading-[1.15] tracking-tight transition-colors duration-200 group-hover:text-[color:var(--aqua)] md:text-2xl"
                  >
                    {video.title}
                  </h2>

                  {video.caption && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                      {video.caption}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[color:var(--muted)]">
                    {video.creator && (
                      <span className="font-mono text-[color:var(--muted-strong)]">@{video.creator}</span>
                    )}
                    {video.sound && <span className="truncate max-w-[180px]">{video.sound}</span>}
                    {video.hashtags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[color:var(--muted)]">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--aqua)] transition-[gap] duration-200 group-hover:gap-2.5">
                    abrir detalhe
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </div>

                {/* ── Score disc ── */}
                <div className="relative flex items-center justify-center border-t border-[color:var(--line)] bg-[rgba(0,0,0,0.2)] py-6 xl:border-l xl:border-t-0">
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at 50% 60%, ${color}14, transparent 60%)` }}
                  />
                  <ScoreDisc score={video.trendScore} delay={baseDelay} />
                </div>

                {/* ── Metrics column ── */}
                <div className="flex flex-col border-t border-[color:var(--line)] bg-[rgba(0,0,0,0.14)] xl:border-l xl:border-t-0">
                  <div className="flex-1 divide-y divide-[rgba(239,233,220,0.07)] px-4">
                    <MetricPairRow
                      label="views"
                      value={fmt(video.views)}
                      delay={baseDelay + 0.06}
                    />
                    <MetricPairRow
                      label="growth"
                      value={fmt(video.growthViews)}
                      tone="--acid"
                      delay={baseDelay + 0.1}
                    />
                    <MetricPairRow
                      label="velocidade"
                      value={video.velocityScore}
                      tone="--aqua"
                      animated
                      delay={baseDelay + 0.14}
                    />
                    <MetricPairRow
                      label="aceleração"
                      value={video.accelerationScore}
                      tone="--gold"
                      animated
                      delay={baseDelay + 0.18}
                    />
                    <MetricPairRow
                      label="snapshots"
                      value={video.snapshotCount}
                      animated
                      delay={baseDelay + 0.22}
                    />
                    <MetricPairRow
                      label="evidências"
                      value={video.evidenceCount}
                      animated
                      delay={baseDelay + 0.26}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
