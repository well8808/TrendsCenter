"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Link from "next/link";
import { Play, ExternalLink, Eye, TrendingUp, Music, Hash, Flame, Radar } from "lucide-react";
import { useState } from "react";

import { GSAPScrollEntrance } from "@/components/gsap-scroll-entrance";
import { GSAPCounter } from "@/components/gsap-counter";

/* ═══════════════════════════════════════════════════════════════
   TrendVideoGrid — biblioteca visual premium para reels virais
   Design: Netflix/Spotify para reels — não um dashboard SaaS
   ═══════════════════════════════════════════════════════════════ */

const ease = [0.22, 1, 0.36, 1] as const;

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
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

/* ─── Helpers ──────────────────────────────────────────────── */

type ScoreTier = "hot" | "gold" | "aqua";

function scoreTier(score: number): ScoreTier {
  if (score >= 78) return "hot";
  if (score >= 52) return "gold";
  return "aqua";
}

function scoreColor(score: number): string {
  if (score >= 78) return "var(--hot)";
  if (score >= 52) return "var(--gold)";
  return "var(--aqua)";
}

function tierLabel(tier: ScoreTier): string {
  if (tier === "hot") return "EM CHAMAS";
  if (tier === "gold") return "QUENTE";
  return "MONITOR";
}

function placeholderGradient(score: number, creator?: string): string {
  const tier = scoreTier(score);
  const initial = (creator ?? "R").charAt(0).toUpperCase().charCodeAt(0);
  const offset = ((initial * 17) % 30) - 15;

  if (tier === "hot") {
    return `radial-gradient(circle at ${30 + offset}% 30%, rgba(237,73,86,0.6), rgba(7,7,6,0.9))`;
  }
  if (tier === "gold") {
    return `radial-gradient(circle at ${30 + offset}% 30%, rgba(230,183,101,0.5), rgba(7,7,6,0.9))`;
  }
  return `radial-gradient(circle at ${30 + offset}% 30%, rgba(88,200,190,0.5), rgba(7,7,6,0.9))`;
}

const compactFmt = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function fmt(n: number): string {
  return compactFmt.format(n);
}

/* AnimatedNumber → delegated to GSAPCounter */

/* ─── Score badge conic ────────────────────────────────────── */

function ScoreBadge({
  score,
  delay,
  size = "md",
}: {
  score: number;
  delay: number;
  size?: "sm" | "md" | "lg";
}) {
  const color = scoreColor(score);
  const tier = scoreTier(score);
  const isHot = tier === "hot";

  const dims = size === "lg" ? 80 : size === "sm" ? 52 : 64;
  const inner = size === "lg" ? 64 : size === "sm" ? 40 : 50;
  const fontSize = size === "lg" ? 20 : size === "sm" ? 13 : 17;

  return (
    <div className="relative flex flex-col items-center gap-1.5">
      {/* pulse ring for hot */}
      {isHot && (
        <motion.div
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            inset: -4,
            border: `1px solid ${color}`,
          }}
          animate={{ opacity: [0.7, 0.15, 0.7], scale: [1, 1.1, 1] }}
          transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
        />
      )}

      {/* conic ring */}
      <motion.div
        className="relative grid place-items-center rounded-full"
        style={{
          width: dims,
          height: dims,
          background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
          rotate: -90,
        }}
        aria-label={`Score ${score}`}
      >
        <div
          className="grid place-items-center rounded-full"
          style={{
            width: inner,
            height: inner,
            background: "rgba(7,7,6,0.96)",
          }}
        >
          <p
            className="metric-number font-semibold leading-none"
            style={{ color, fontSize }}
          >
            <GSAPCounter value={score} delay={delay} duration={0.75} />
          </p>
        </div>
      </motion.div>

      {/* hot label */}
      {isHot && size !== "sm" && (
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em]"
          style={{
            borderColor: "rgba(237,73,86,0.42)",
            background: "rgba(237,73,86,0.12)",
            color: "var(--hot)",
          }}
        >
          <Flame className="h-2.5 w-2.5" aria-hidden="true" />
          hot
        </span>
      )}
    </div>
  );
}

/* ─── Thumbnail com fallback ────────────────────────────────── */

function ThumbnailImage({
  thumbnailUrl,
  score,
  creator,
  aspectRatio = "4 / 5",
  shimmer = false,
}: {
  thumbnailUrl?: string;
  score: number;
  creator?: string;
  aspectRatio?: string;
  shimmer?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPlaceholder = !thumbnailUrl || imgFailed;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio }}
    >
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

      {/* shimmer overlay no featured card */}
      {shimmer && (
        <div
          className="lib-shimmer pointer-events-none absolute inset-0 z-10"
          aria-hidden="true"
        />
      )}

      {/* gradient overlay base */}
      <div
        className="lib-thumbnail-overlay pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* hot bottom glow */}
      {scoreTier(score) === "hot" && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 110%, rgba(237,73,86,0.22), transparent 60%)",
          }}
          aria-hidden="true"
        />
      )}

      {/* play reveal */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div
          className="grid h-12 w-12 place-items-center rounded-full border border-white/20 backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <Play className="h-5 w-5 fill-white text-white" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/* ─── MetricChip ────────────────────────────────────────────── */

function MetricChip({
  icon: Icon,
  label,
  value,
  color,
  animated,
  delay,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color?: string;
  animated?: boolean;
  delay?: number;
}) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-[8px] border border-white/[0.07] px-2.5 py-2"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
        {Icon && <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />}
        {label}
      </span>
      <span
        className="metric-number text-[13px] font-semibold leading-none"
        style={color ? { color } : { color: "var(--foreground)" }}
      >
        {animated ? <GSAPCounter value={value} delay={delay ?? 0} duration={0.75} /> : fmt(value)}
      </span>
    </div>
  );
}

/* ─── Featured card (score ≥ 78) — layout horizontal ───────── */

function FeaturedReelCard({
  video,
  index,
}: {
  video: TrendVideoView;
  index: number;
}) {
  const color = scoreColor(video.trendScore);
  const baseDelay = 0.08 + index * 0.07;

  return (
    <motion.article
      variants={cardVariants}
      layout
      className="group relative"
    >
      <Link
        href={`/trends/${video.id}`}
        className="relative block overflow-hidden rounded-[var(--radius-2xl)] transition-all duration-300"
        style={{
          border: "1px solid rgba(237,73,86,0.32)",
          background:
            "linear-gradient(160deg, rgba(237,73,86,0.06) 0%, rgba(16,16,13,0.95) 40%), rgba(16,16,13,0.9)",
          boxShadow:
            "0 0 0 1px rgba(237,73,86,0.18), 0 0 30px rgba(237,73,86,0.10), 0 20px 60px rgba(0,0,0,0.4)",
        }}
        aria-label={`Ver reel: ${video.title}`}
      >
        {/* hot top hairline */}
        <div
          className="absolute inset-x-0 top-0 z-10 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(237,73,86,0.72) 50%, transparent)",
          }}
          aria-hidden="true"
        />

        {/* ambient glow top-left */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "rgba(237,73,86,0.12)" }}
          aria-hidden="true"
        />

        {/* horizontal grid */}
        <div className="grid md:grid-cols-[280px_minmax(0,1fr)]">

          {/* thumbnail col */}
          <div className="relative min-h-[220px] overflow-hidden md:min-h-[260px]">
            <ThumbnailImage
              thumbnailUrl={video.thumbnailUrl}
              score={video.trendScore}
              creator={video.creator}
              aspectRatio="unset"
              shimmer
            />
            {/* right fade overlay for seamless blend on desktop */}
            <div
              className="pointer-events-none absolute inset-0 hidden md:block"
              style={{
                background:
                  "linear-gradient(to right, transparent 55%, rgba(16,16,13,0.95) 100%)",
              }}
              aria-hidden="true"
            />
          </div>

          {/* info col */}
          <div className="relative flex flex-col justify-between p-6 md:p-7">
            {/* header row */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {/* HOT badge with pulse */}
                <span
                  className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: "rgba(237,73,86,0.44)",
                    background: "rgba(237,73,86,0.14)",
                    color: "var(--hot)",
                  }}
                >
                  {/* pulse dot */}
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className="signal-now-pulse absolute inline-flex h-full w-full rounded-full"
                      style={{ background: "var(--hot)" }}
                      aria-hidden="true"
                    />
                    <span
                      className="relative inline-flex h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--hot)" }}
                      aria-hidden="true"
                    />
                  </span>
                  HOT AGORA
                </span>

                {/* market tag */}
                <span
                  className="rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em]"
                  style={
                    video.market === "BR"
                      ? {
                          borderColor: "rgba(237,73,86,0.3)",
                          background: "rgba(237,73,86,0.08)",
                          color: "var(--hot)",
                        }
                      : {
                          borderColor: "rgba(88,200,190,0.3)",
                          background: "rgba(88,200,190,0.08)",
                          color: "var(--aqua)",
                        }
                  }
                >
                  {video.market}
                </span>

                {/* creator */}
                {video.creator && (
                  <span className="font-mono text-[11px] text-[color:var(--muted-strong)]">
                    @{video.creator}
                  </span>
                )}
              </div>

              {/* title */}
              <h2 className="mt-4 text-xl font-semibold leading-[1.2] tracking-tight text-[color:var(--foreground)] transition-colors duration-200 group-hover:text-[color:var(--hot)] md:text-2xl">
                {video.title}
              </h2>

              {/* caption */}
              {video.caption && (
                <p className="mt-2 line-clamp-2 max-w-prose text-sm leading-6 text-[color:var(--muted-strong)]">
                  {video.caption}
                </p>
              )}
            </div>

            {/* metrics grid */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <MetricChip
                icon={Eye}
                label="views"
                value={video.views}
                delay={baseDelay + 0.1}
              />
              <MetricChip
                icon={TrendingUp}
                label="crescimento"
                value={video.growthViews}
                color={color}
                delay={baseDelay + 0.14}
              />
              <MetricChip
                label="velocidade"
                value={video.velocityScore}
                color="var(--aqua)"
                animated
                delay={baseDelay + 0.18}
              />
              <MetricChip
                label="score"
                value={video.trendScore}
                color={color}
                animated
                delay={baseDelay + 0.22}
              />
            </div>

            {/* bottom row */}
            <div className="mt-4 flex items-center justify-between gap-3">
              {/* hashtags */}
              <div className="flex flex-wrap gap-1.5 overflow-hidden">
                {video.hashtags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-1 font-mono text-[9px] text-[color:var(--muted)]"
                  >
                    <Hash className="h-2.5 w-2.5" aria-hidden="true" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* open reel CTA */}
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[color:var(--muted)] transition-all duration-200 group-hover:gap-2.5 group-hover:text-[color:var(--hot)]">
                abrir reel
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        {/* hover border glow upgrade */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow:
              "0 0 0 1px rgba(237,73,86,0.40), 0 0 50px rgba(237,73,86,0.16), 0 28px 80px rgba(0,0,0,0.55)",
          }}
          aria-hidden="true"
        />
      </Link>
    </motion.article>
  );
}

/* ─── Portrait card (grid regular) ─────────────────────────── */

function PortraitReelCard({
  video,
  index,
}: {
  video: TrendVideoView;
  index: number;
}) {
  const tier = scoreTier(video.trendScore);
  const color = scoreColor(video.trendScore);
  const baseDelay = 0.12 + index * 0.055;

  const borderColor =
    tier === "hot"
      ? "rgba(237,73,86,0.30)"
      : tier === "gold"
      ? "rgba(230,183,101,0.24)"
      : "rgba(88,200,190,0.20)";

  const hoverBorder =
    tier === "hot"
      ? "rgba(237,73,86,0.50)"
      : tier === "gold"
      ? "rgba(230,183,101,0.42)"
      : "rgba(88,200,190,0.38)";

  return (
    <motion.article
      variants={cardVariants}
      layout
      className="group relative"
    >
      <Link
        href={`/trends/${video.id}`}
        className="block overflow-hidden rounded-[var(--radius-xl)] transition-all duration-300"
        style={{
          border: `1px solid ${borderColor}`,
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%), rgba(16,16,13,0.9)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
        aria-label={`Ver reel: ${video.title}`}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = hoverBorder;
          (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = borderColor;
          (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
        }}
      >
        {/* top hairline */}
        <div
          className="absolute inset-x-0 top-0 z-10 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}99, transparent)` }}
          aria-hidden="true"
        />

        {/* thumbnail */}
        <div className="relative">
          <ThumbnailImage
            thumbnailUrl={video.thumbnailUrl}
            score={video.trendScore}
            creator={video.creator}
            aspectRatio="4 / 5"
          />

          {/* score badge — top right */}
          <div className="absolute right-2.5 top-2.5 z-20">
            <ScoreBadge score={video.trendScore} delay={baseDelay} size="sm" />
          </div>

          {/* market tag — top left */}
          <div className="absolute left-2.5 top-2.5 z-20">
            <span
              className="rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm"
              style={
                video.market === "BR"
                  ? {
                      borderColor: "rgba(237,73,86,0.44)",
                      background: "rgba(7,7,6,0.7)",
                      color: "var(--hot)",
                    }
                  : {
                      borderColor: "rgba(88,200,190,0.44)",
                      background: "rgba(7,7,6,0.7)",
                      color: "var(--aqua)",
                    }
              }
            >
              {video.market}
            </span>
          </div>
        </div>

        {/* info panel */}
        <div className="p-3.5">
          {/* creator + views */}
          <div className="flex items-center justify-between gap-2">
            {video.creator && (
              <span className="truncate font-mono text-[10px] font-medium text-[color:var(--muted-strong)]">
                @{video.creator}
              </span>
            )}
            <div className="flex shrink-0 items-center gap-1 text-[10px] text-[color:var(--muted)]">
              <Eye className="h-2.5 w-2.5" aria-hidden="true" />
              <span className="metric-number font-semibold text-[color:var(--foreground)]">
                {fmt(video.views)}
              </span>
            </div>
          </div>

          {/* title */}
          <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-[1.35] tracking-tight text-[color:var(--foreground)] transition-colors duration-200 group-hover:text-[color:var(--foreground)]">
            {video.title}
          </p>

          {/* metrics row */}
          <motion.div
            className="mt-2.5 grid grid-cols-2 gap-1.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, delay: baseDelay + 0.1, ease }}
          >
            <MetricChip
              icon={TrendingUp}
              label="cresc."
              value={video.growthViews}
              color={color}
              delay={baseDelay + 0.14}
            />
            <MetricChip
              label="veloc."
              value={video.velocityScore}
              color="var(--aqua)"
              animated
              delay={baseDelay + 0.18}
            />
          </motion.div>

          {/* sound + hashtags */}
          {(video.sound || video.hashtags.length > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1 overflow-hidden">
              {video.sound && (
                <span
                  className="flex max-w-[120px] items-center gap-1 truncate rounded-full border px-2 py-0.5 font-mono text-[8px]"
                  style={{
                    borderColor: "rgba(157,131,236,0.28)",
                    background: "rgba(157,131,236,0.08)",
                    color: "var(--violet)",
                  }}
                >
                  <Music className="h-2 w-2 shrink-0" aria-hidden="true" />
                  <span className="truncate">{video.sound}</span>
                </span>
              )}
              {video.hashtags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[color:var(--line)] px-2 py-0.5 font-mono text-[8px] text-[color:var(--muted)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA row */}
          <div className="mt-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[color:var(--muted)] transition-all duration-200 group-hover:gap-1.5 group-hover:text-[color:var(--foreground)]">
              ver detalhe
              <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
            </span>
            {video.snapshotCount > 1 && (
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[8px]"
                style={{
                  background: "rgba(88,200,190,0.08)",
                  color: "var(--aqua)",
                }}
              >
                {video.snapshotCount} leituras
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

/* ─── Section header ─────────────────────────────────────────── */

function SectionHeader({
  tier,
  count,
}: {
  tier: ScoreTier;
  count: number;
}) {
  const color = tier === "hot" ? "var(--hot)" : tier === "gold" ? "var(--gold)" : "var(--aqua)";
  const label = tierLabel(tier);

  return (
    <div className="flex items-center gap-3">
      {tier === "hot" && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className="signal-now-pulse absolute inline-flex h-full w-full rounded-full"
            style={{ background: "var(--hot)" }}
            aria-hidden="true"
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: "var(--hot)" }}
            aria-hidden="true"
          />
        </span>
      )}
      <h2
        className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {label}
      </h2>
      <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${color}40, transparent)` }} aria-hidden="true" />
      <span
        className="font-mono text-[10px] font-semibold"
        style={{ color: "var(--muted)" }}
      >
        {count}
      </span>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────── */

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
        animate={{ scale: [1, 1.1, 1], opacity: [0.22, 0.48, 0.22] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto mb-6 h-20 w-20 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(88,200,190,0.5), transparent 70%)",
        }}
      />
      <Radar className="mx-auto mb-4 h-8 w-8 text-[color:var(--muted)]" aria-hidden="true" />
      <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
        Biblioteca vazia
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[color:var(--muted-strong)]">
        Cole perfis do Instagram no painel lateral e inicie a primeira coleta. Os reels virais aparecem aqui automaticamente.
      </p>
      <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
        <Radar className="h-3.5 w-3.5" aria-hidden="true" />
        fonte obrigatória · dados reais apenas
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Export principal
   ═══════════════════════════════════════════════════════════════ */

export function TrendVideoGrid({ results }: { results: TrendVideoView[] }) {
  if (results.length === 0) {
    return <EmptyLibrary />;
  }

  // Separa por tier, mantendo ordem original dentro de cada tier
  const hotCards = results.filter((v) => v.trendScore >= 78).slice(0, 2);
  const hotIds = new Set(hotCards.map((v) => v.id));

  const warmCards = results.filter(
    (v) => v.trendScore >= 52 && v.trendScore < 78
  );

  const coolCards = results.filter(
    (v) => v.trendScore < 52 && !hotIds.has(v.id)
  );

  // cards que caíram fora dos featured hot (score >=78 mas além dos 2 exibidos)
  const extraHotAsWarm = results.filter(
    (v) => v.trendScore >= 78 && !hotIds.has(v.id)
  );
  const gridWarm = [...extraHotAsWarm, ...warmCards];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="library-root"
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="grid gap-8"
        role="feed"
        aria-label="Biblioteca de reels virais"
      >
        {/* ── EM CHAMAS — featured horizontal ── */}
        {hotCards.length > 0 && (
          <section aria-labelledby="section-hot">
            <div id="section-hot" className="mb-4">
              <SectionHeader tier="hot" count={hotCards.length} />
            </div>
            <GSAPScrollEntrance className="grid gap-4" stagger={0.10} y={20}>
              {hotCards.map((video, idx) => (
                <div key={video.id} className="gse-item">
                  <FeaturedReelCard video={video} index={idx} />
                </div>
              ))}
            </GSAPScrollEntrance>
          </section>
        )}

        {/* ── QUENTES — grid portrait 2-3 cols ── */}
        {gridWarm.length > 0 && (
          <section aria-labelledby="section-warm">
            <div id="section-warm" className="mb-4">
              <SectionHeader tier="gold" count={gridWarm.length} />
            </div>
            <GSAPScrollEntrance className="grid grid-cols-2 gap-4 lg:grid-cols-3" stagger={0.06} y={18}>
              {gridWarm.map((video, idx) => (
                <div key={video.id} className="gse-item">
                  <PortraitReelCard
                    video={video}
                    index={hotCards.length + idx}
                  />
                </div>
              ))}
            </GSAPScrollEntrance>
          </section>
        )}

        {/* ── MONITORANDO — grid compacto 2-4 cols ── */}
        {coolCards.length > 0 && (
          <section aria-labelledby="section-cool">
            <div id="section-cool" className="mb-4">
              <SectionHeader tier="aqua" count={coolCards.length} />
            </div>
            <GSAPScrollEntrance className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" stagger={0.045} y={14}>
              {coolCards.map((video, idx) => (
                <div key={video.id} className="gse-item">
                  <PortraitReelCard
                    video={video}
                    index={hotCards.length + gridWarm.length + idx}
                  />
                </div>
              ))}
            </GSAPScrollEntrance>
          </section>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
