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
  const bg = useMotionTemplate`conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.07) 0deg)`;
  const tier = scoreTier(score);
  const isHot = score >= 78;

  useEffect(() => {
    const controls = animate(angle, score * 3.6, { duration: 0.95, delay, ease });
    return () => controls.stop();
  }, [angle, score, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full">
        <motion.div
          aria-hidden="true"
          className="absolute inset-[-8px] rounded-full blur-xl"
          style={{ background: `radial-gradient(circle, ${color}, transparent 65%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHot ? 0.5 : 0.28 }}
          transition={{ duration: 0.6, delay: delay + 0.1, ease }}
        />
        {isHot && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-[-4px] rounded-full"
            style={{ border: `1px solid ${color}` }}
            animate={{ opacity: [0.6, 0.15, 0.6], scale: [1, 1.06, 1] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
          />
        )}
        <motion.div className="relative grid h-24 w-24 place-items-center rounded-full" style={{ background: bg }}>
          <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-[rgba(7,7,6,0.95)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="text-center">
              <p className="metric-number text-[22px] font-semibold leading-none tracking-tight text-[color:var(--foreground)]">
                <AnimatedNumber value={score} delay={delay} />
              </p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[color:var(--muted)]">/ 100</p>
            </div>
          </div>
        </motion.div>
      </div>
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em]",
          tier.tone === "acid" && "border-[rgba(199,255,93,0.38)] bg-[rgba(199,255,93,0.1)] text-[color:var(--acid)]",
          tier.tone === "gold" && "border-[rgba(243,201,105,0.38)] bg-[rgba(243,201,105,0.1)] text-[color:var(--gold)]",
          tier.tone === "aqua" && "border-[rgba(64,224,208,0.38)] bg-[rgba(64,224,208,0.1)] text-[color:var(--aqua)]",
        )}
      >
        {tier.label}
      </span>
    </div>
  );
}

const formatter = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const formatCompact = (n: number) => formatter.format(n);

function MetricCell({
  label,
  value,
  delay,
  tone,
}: {
  label: string;
  value: string | number;
  delay: number;
  tone?: "acid" | "aqua" | "gold" | "muted";
}) {
  const toneClass = {
    acid: "text-[color:var(--acid)]",
    aqua: "text-[color:var(--aqua)]",
    gold: "text-[color:var(--gold)]",
    muted: "text-[color:var(--foreground)]",
  }[tone ?? "muted"];

  const isNumeric = typeof value === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease }}
      className="bg-[rgba(8,8,7,0.86)] p-3"
    >
      <p className="eyebrow text-[10px]">{label}</p>
      <p className={cn("metric-number mt-1 text-base font-semibold", toneClass)}>
        {isNumeric ? <AnimatedNumber value={value as number} delay={delay + 0.1} /> : value}
      </p>
    </motion.div>
  );
}

export function TrendVideoGrid({ results }: { results: TrendVideoView[] }) {
  if (results.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="app-panel relative overflow-hidden rounded-[var(--radius-lg)] border-dashed p-10 text-center"
      >
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.04, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-5 h-14 w-14 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(64,224,208,0.5), transparent 70%)" }}
        />
        <Sparkles className="mx-auto mb-3 h-6 w-6 text-[color:var(--muted)]" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Nenhuma trend indexada nesse recorte</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted-strong)]">
          A busca permanece vazia até existir ingestão manual/oficial com fonte e evidência rastreável.
        </p>
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
          <Radar className="h-3 w-3" aria-hidden="true" />
          safe-mode / sem scraping
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section variants={gridVariants} initial="hidden" animate="show" className="grid gap-3">
      {results.map((video, idx) => {
        const isHot = video.trendScore >= 78;
        return (
          <motion.div key={video.id} variants={cardVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2, ease }}>
            <Link
              href={`/trends/${video.id}`}
              className={cn(
                "app-card-interactive group relative block overflow-hidden rounded-[var(--radius-lg)] p-0",
                isHot && "border-[rgba(199,255,93,0.28)]",
              )}
            >
              {isHot && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[rgba(199,255,93,0.12)] blur-3xl"
                />
              )}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(239,233,220,0.28)] to-transparent" />

              <div className="relative grid gap-0 xl:grid-cols-[minmax(0,1fr)_180px_280px]">
                <div className="min-w-0 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {isHot && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(199,255,93,0.38)] bg-[rgba(199,255,93,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)]">
                        <Flame className="h-3 w-3" aria-hidden="true" />
                        hot
                      </span>
                    )}
                    <span className="app-pill rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)]">
                      {video.market}
                    </span>
                    <span className="app-pill rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]">
                      {video.origin}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="mt-4 break-words text-2xl font-semibold leading-tight tracking-tight transition group-hover:text-[color:var(--aqua)]">
                    {video.title}
                  </h2>
                  {video.caption ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--muted-strong)]">{video.caption}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                    {video.creator ? <span className="font-mono">@{video.creator}</span> : null}
                    {video.sound ? <span>{video.sound}</span> : null}
                    {video.hashtags.slice(0, 5).map((tag) => (
                      <span key={tag} className="text-[color:var(--muted-strong)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--aqua)] transition group-hover:gap-2.5">
                    abrir detalhe
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </div>

                <div className="relative grid place-items-center border-t border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] py-5 xl:border-l xl:border-t-0">
                  <ScoreDisc score={video.trendScore} delay={0.2 + idx * 0.04} />
                </div>

                <div className="grid grid-cols-3 gap-px bg-[rgba(239,233,220,0.08)] sm:grid-cols-6 xl:grid-cols-3">
                  <MetricCell label="views" value={formatCompact(video.views)} delay={0.28 + idx * 0.04} />
                  <MetricCell label="growth" value={formatCompact(video.growthViews)} delay={0.32 + idx * 0.04} tone="acid" />
                  <MetricCell label="vel." value={video.velocityScore} delay={0.36 + idx * 0.04} tone="aqua" />
                  <MetricCell label="acel." value={video.accelerationScore} delay={0.4 + idx * 0.04} tone="gold" />
                  <MetricCell label="snap" value={video.snapshotCount} delay={0.44 + idx * 0.04} />
                  <MetricCell label="evid." value={video.evidenceCount} delay={0.48 + idx * 0.04} />
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
