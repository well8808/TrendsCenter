"use client";

import Link from "next/link";
import { AnimatePresence, animate, motion, useMotionValue, type Variants } from "motion/react";
import { ArrowUpRight, Flame, Music2, Play, Radar, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.44, ease } },
};

export interface TrendVideoView {
  id: string;
  title: string;
  caption?: string;
  thumbnailUrl?: string;
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

/* ─── utils ─────────────────────────────────────────────── */

function scoreTier(score: number): "acid" | "gold" | "aqua" {
  if (score >= 78) return "acid";
  if (score >= 52) return "gold";
  return "aqua";
}

function scoreCssVar(score: number) {
  if (score >= 78) return "var(--acid)";
  if (score >= 52) return "var(--gold)";
  return "var(--aqua)";
}

const compactFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const fmt = (n: number) => compactFmt.format(n);

/* Gradient placeholder when thumbnail is absent or expired */
function placeholderGradient(score: number, creator?: string) {
  const tier = scoreTier(score);
  const initial = (creator ?? "R").charAt(0).toUpperCase().charCodeAt(0);
  const hue = (initial * 17) % 360;

  if (tier === "acid") {
    return `radial-gradient(ellipse at 30% 20%, rgba(237,73,86,0.55) 0%, rgba(131,58,180,0.38) 45%, rgba(7,7,6,0.95) 100%)`;
  }
  if (tier === "gold") {
    return `radial-gradient(ellipse at 70% 30%, rgba(243,201,105,0.48) 0%, rgba(${hue},100,60,0.22) 50%, rgba(7,7,6,0.95) 100%)`;
  }
  return `radial-gradient(ellipse at 50% 20%, rgba(64,224,208,0.42) 0%, rgba(99,102,241,0.22) 55%, rgba(7,7,6,0.95) 100%)`;
}

/* ─── AnimatedNumber ─────────────────────────────────────── */

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.75, delay, ease });
    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    return () => { controls.stop(); unsub(); };
  }, [count, value, delay]);

  return <>{display}</>;
}

/* ─── Score badge ────────────────────────────────────────── */

function ScoreBadge({ score, delay }: { score: number; delay: number }) {
  const color = scoreCssVar(score);
  const isHot = score >= 78;
  const angle = useMotionValue(0);

  useEffect(() => {
    const controls = animate(angle, score * 3.6, { duration: 0.9, delay, ease });
    return () => controls.stop();
  }, [angle, score, delay]);

  return (
    <div className="relative flex flex-col items-center gap-1.5">
      <div className="relative grid h-[64px] w-[64px] place-items-center rounded-full">
        {isHot && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-[-3px] rounded-full"
            style={{ border: `1px solid ${color}`, opacity: 0.6 }}
            animate={{ opacity: [0.6, 0.15, 0.6], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
          />
        )}
        <motion.div
          className="relative grid h-[64px] w-[64px] place-items-center rounded-full"
          style={{
            background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
          }}
          initial={{ rotate: -90 }}
          animate={{ rotate: -90 }}
        >
          <div
            className="grid h-[50px] w-[50px] place-items-center rounded-full"
            style={{ background: "rgba(7,7,6,0.96)" }}
          >
            <p
              className="metric-number text-[17px] font-semibold leading-none"
              style={{ color }}
            >
              <AnimatedNumber value={score} delay={delay} />
            </p>
          </div>
        </motion.div>
      </div>
      {isHot && (
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em]"
          style={{
            borderColor: "rgba(237,73,86,0.42)",
            background: "rgba(237,73,86,0.12)",
            color: "var(--acid)",
          }}
        >
          <Flame className="h-2.5 w-2.5" aria-hidden="true" />
          hot
        </span>
      )}
    </div>
  );
}

/* ─── Thumbnail area ─────────────────────────────────────── */

function ThumbnailArea({
  thumbnailUrl,
  score,
  creator,
  isHot,
}: {
  thumbnailUrl?: string;
  score: number;
  creator?: string;
  isHot: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPlaceholder = !thumbnailUrl || imgFailed;

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
      {showPlaceholder ? (
        <div
          className="absolute inset-0"
          style={{ background: placeholderGradient(score, creator) }}
          aria-hidden="true"
        />
      ) : (
        <motion.img
          src={thumbnailUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.04 }}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.55, ease }}
          aria-hidden="true"
        />
      )}

      {/* base gradient overlay — always visible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(7,7,6,0.96) 0%, rgba(7,7,6,0.42) 40%, rgba(7,7,6,0.08) 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* hot glow */}
      {isHot && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 100%, rgba(237,73,86,0.18), transparent 65%)" }}
          aria-hidden="true"
        />
      )}

      {/* Play icon — center */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div
          className="grid h-12 w-12 place-items-center rounded-full border border-white/20 backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <Play className="h-5 w-5 fill-white text-white" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/* ─── Metric chip ────────────────────────────────────────── */

function MetricChip({
  label,
  value,
  tone,
  animated,
  delay,
}: {
  label: string;
  value: number;
  tone?: string;
  animated?: boolean;
  delay?: number;
}) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] border border-white/[0.08] px-2.5 py-2"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</span>
      <span
        className="metric-number text-sm font-semibold leading-none"
        style={tone ? { color: `var(${tone})` } : { color: "var(--foreground)" }}
      >
        {animated ? <AnimatedNumber value={value} delay={delay ?? 0} /> : fmt(value)}
      </span>
    </div>
  );
}

/* ─── Single reel card ───────────────────────────────────── */

function ReelCard({ video, index }: { video: TrendVideoView; index: number }) {
  const isHot = video.trendScore >= 78;
  const color = scoreCssVar(video.trendScore);
  const baseDelay = 0.12 + index * 0.055;
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      layout
      className="group relative"
    >
      <Link
        href={`/trends/${video.id}`}
        className="block overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--line)] transition-all duration-300 group-hover:border-[rgba(255,255,255,0.2)] group-hover:shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        style={{
          background: "var(--card-bg)",
          boxShadow: isHot ? `0 0 0 1px rgba(237,73,86,0.24), 0 8px 40px rgba(0,0,0,0.3)` : undefined,
        }}
      >
        {/* Top hairline */}
        <div
          className="absolute inset-x-0 top-0 z-10 h-px"
          style={{
            background: isHot
              ? "linear-gradient(90deg, transparent, rgba(237,73,86,0.6), transparent)"
              : "linear-gradient(90deg, transparent, rgba(239,233,220,0.18), transparent)",
          }}
          aria-hidden="true"
        />

        {/* Thumbnail */}
        <ThumbnailArea
          thumbnailUrl={video.thumbnailUrl}
          score={video.trendScore}
          creator={video.creator}
          isHot={isHot}
        />

        {/* Score badge — overlaid top-right */}
        <div className="absolute right-3 top-3 z-20">
          <ScoreBadge score={video.trendScore} delay={baseDelay} />
        </div>

        {/* Market tag — top-left */}
        <div className="absolute left-3 top-3 z-20">
          <span
            className="rounded-full border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm"
            style={
              video.market === "BR"
                ? { borderColor: "rgba(237,73,86,0.42)", background: "rgba(237,73,86,0.16)", color: "var(--acid)" }
                : { borderColor: "rgba(64,224,208,0.42)", background: "rgba(64,224,208,0.14)", color: "var(--aqua)" }
            }
          >
            {video.market}
          </span>
        </div>

        {/* Body below thumbnail */}
        <div className="relative p-4">
          {/* Creator + views row */}
          <div className="flex items-center justify-between gap-2">
            {video.creator && (
              <span className="truncate font-mono text-[11px] font-medium text-[color:var(--muted-strong)]">
                @{video.creator}
              </span>
            )}
            <div className="flex shrink-0 items-center gap-1 text-[11px] text-[color:var(--muted)]">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              <span className="metric-number font-semibold text-[color:var(--foreground)]">{fmt(video.views)}</span>
            </div>
          </div>

          {/* Title */}
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-[1.35] tracking-tight text-[color:var(--foreground)] transition-colors duration-200 group-hover:text-[color:var(--aqua)]">
            {video.title}
          </p>

          {/* Metrics row — visible on hover or always */}
          <motion.div
            className="mt-3 grid grid-cols-3 gap-1.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, delay: baseDelay + 0.1, ease }}
          >
            <MetricChip label="views" value={video.views} delay={baseDelay + 0.14} />
            <MetricChip label="cresc." value={video.growthViews} tone="--acid" delay={baseDelay + 0.18} />
            <MetricChip label="veloc." value={video.velocityScore} tone="--aqua" animated delay={baseDelay + 0.22} />
          </motion.div>

          {/* Sound + hashtags */}
          {(video.sound || video.hashtags.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 overflow-hidden">
              {video.sound && (
                <span className="flex items-center gap-1 truncate max-w-[140px] rounded-full border border-[rgba(169,140,255,0.28)] bg-[rgba(169,140,255,0.08)] px-2 py-0.5 font-mono text-[9px] text-[color:var(--violet)]">
                  <Music2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{video.sound}</span>
                </span>
              )}
              {video.hashtags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[color:var(--line)] bg-[rgba(255,255,255,0.03)] px-2 py-0.5 font-mono text-[9px] text-[color:var(--muted)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Open detail CTA */}
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--muted)] transition-all duration-200 group-hover:gap-2 group-hover:text-[color:var(--aqua)]">
              ver detalhe
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </span>
            {video.snapshotCount > 1 && (
              <span className="rounded-full bg-[rgba(64,224,208,0.08)] px-2 py-0.5 font-mono text-[9px] text-[color:var(--aqua)]">
                {video.snapshotCount} leituras
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Featured card (top 2, score >= 78) ────────────────── */

function FeaturedReelCard({ video, index }: { video: TrendVideoView; index: number }) {
  const isHot = video.trendScore >= 78;
  const color = scoreCssVar(video.trendScore);
  const baseDelay = 0.08 + index * 0.06;
  const [imgFailed, setImgFailed] = useState(false);
  const showPlaceholder = !video.thumbnailUrl || imgFailed;

  return (
    <motion.div variants={cardVariants} layout className="group relative">
      <Link
        href={`/trends/${video.id}`}
        className="relative block overflow-hidden rounded-[var(--radius-2xl)] border transition-all duration-300 group-hover:shadow-[0_32px_100px_rgba(0,0,0,0.6)]"
        style={{
          border: isHot ? "1px solid rgba(237,73,86,0.36)" : "1px solid rgba(239,233,220,0.12)",
          background: "var(--card-bg)",
        }}
      >
        {/* Horizontal layout: thumbnail left, info right */}
        <div className="grid md:grid-cols-[280px_minmax(0,1fr)]">
          {/* Thumbnail */}
          <div className="relative overflow-hidden" style={{ minHeight: 240 }}>
            {showPlaceholder ? (
              <div
                className="absolute inset-0"
                style={{ background: placeholderGradient(video.trendScore, video.creator) }}
                aria-hidden="true"
              />
            ) : (
              <motion.img
                src={video.thumbnailUrl}
                alt=""
                onError={() => setImgFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ scale: 1.03 }}
                whileHover={{ scale: 1.07 }}
                transition={{ duration: 0.55, ease }}
                aria-hidden="true"
              />
            )}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(to right, transparent 60%, rgba(7,7,6,0.9) 100%)" }}
              aria-hidden="true"
            />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div
                className="grid h-14 w-14 place-items-center rounded-full border border-white/20 backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Play className="h-6 w-6 fill-white text-white" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="relative flex flex-col justify-between p-6">
            {/* Top row */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ borderColor: "rgba(237,73,86,0.42)", background: "rgba(237,73,86,0.14)", color: "var(--acid)" }}
                >
                  <Flame className="h-3 w-3" aria-hidden="true" />
                  hot agora
                </span>
                <span
                  className="rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={
                    video.market === "BR"
                      ? { borderColor: "rgba(237,73,86,0.3)", background: "rgba(237,73,86,0.08)", color: "var(--acid)" }
                      : { borderColor: "rgba(64,224,208,0.3)", background: "rgba(64,224,208,0.08)", color: "var(--aqua)" }
                  }
                >
                  {video.market}
                </span>
                {video.creator && (
                  <span className="font-mono text-[11px] text-[color:var(--muted-strong)]">@{video.creator}</span>
                )}
              </div>

              <h2 className="mt-4 break-words text-xl font-semibold leading-[1.2] tracking-tight text-[color:var(--foreground)] transition-colors duration-200 group-hover:text-[color:var(--aqua)] md:text-2xl">
                {video.title}
              </h2>

              {video.caption && (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                  {video.caption}
                </p>
              )}
            </div>

            {/* Metrics */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricChip label="views" value={video.views} delay={baseDelay + 0.1} />
              <MetricChip label="crescimento" value={video.growthViews} tone="--acid" delay={baseDelay + 0.14} />
              <MetricChip label="velocidade" value={video.velocityScore} tone="--aqua" animated delay={baseDelay + 0.18} />
              <MetricChip label="score" value={video.trendScore} tone="--acid" animated delay={baseDelay + 0.22} />
            </div>

            {/* Bottom */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {video.hashtags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[color:var(--line)] px-2.5 py-1 font-mono text-[9px] text-[color:var(--muted)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--muted)] transition-all duration-200 group-hover:gap-2.5 group-hover:text-[color:var(--aqua)]">
                abrir reel
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        {/* Hot top border gradient */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(237,73,86,0.7) 50%, transparent)" }}
          aria-hidden="true"
        />
        {/* Hot glow */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-52 w-52 rounded-full blur-3xl"
          style={{ background: "rgba(237,73,86,0.1)" }}
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  );
}

/* ─── Empty state ────────────────────────────────────────── */

function EmptyLibrary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-dashed border-[color:var(--line-strong)] p-16 text-center"
      style={{ background: "rgba(255,255,255,0.014)" }}
    >
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto mb-6 h-20 w-20 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(64,224,208,0.5), transparent 70%)" }}
      />
      <Radar className="mx-auto mb-4 h-8 w-8 text-[color:var(--muted)]" aria-hidden="true" />
      <h2 className="text-2xl font-semibold tracking-tight">Biblioteca vazia</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[color:var(--muted-strong)]">
        Cole perfis do Instagram no painel ao lado e inicie a primeira coleta. Os reels virais aparecem aqui automaticamente.
      </p>
      <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
        <Radar className="h-3.5 w-3.5" aria-hidden="true" />
        fonte obrigatória · dados reais apenas
      </div>
    </motion.div>
  );
}

/* ─── Main export ────────────────────────────────────────── */

export function TrendVideoGrid({ results }: { results: TrendVideoView[] }) {
  if (results.length === 0) {
    return <EmptyLibrary />;
  }

  const hotCards = results.filter((v) => v.trendScore >= 78).slice(0, 2);
  const restCards = results.filter((v) => v.trendScore < 78 || !hotCards.find((h) => h.id === v.id));

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="library-grid"
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        {/* Featured HOT cards — full-width horizontal layout */}
        {hotCards.length > 0 && (
          <div className="grid gap-4">
            {hotCards.map((video, idx) => (
              <FeaturedReelCard key={video.id} video={video} index={idx} />
            ))}
          </div>
        )}

        {/* Regular grid — 2 cols mobile, 3 cols desktop */}
        {restCards.length > 0 && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {restCards.map((video, idx) => (
              <ReelCard key={video.id} video={video} index={hotCards.length + idx} />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
