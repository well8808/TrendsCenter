"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Link from "next/link";
import { Archive, ExternalLink, Eye, TrendingUp, Music, Hash, Flame } from "lucide-react";
import type { ComponentType } from "react";

import { GSAPCounter } from "@/components/gsap-counter";
import { ReelArtifactPoster } from "@/components/viral-library/reel-artifact-poster";
import { buildContentIdeaBrief } from "@/lib/trends/content-idea-brief";
import { buildOpportunityBrief } from "@/lib/trends/opportunity-brief";
import {
  getOpportunityDecisionQueueGroup,
  opportunityDecisionGroupMeta,
  shouldShowInActionNow,
  type OpportunityDecisionQueueGroup,
  type OpportunityDecisionView,
} from "@/lib/trends/opportunity-actions";
import type { NormalizedReelMedia } from "@/lib/trends/reel-media";

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
  media: NormalizedReelMedia;
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
  decision?: OpportunityDecisionView;
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

const compactFmt = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function fmt(n: number): string {
  return compactFmt.format(n);
}

function briefForVideo(video: TrendVideoView) {
  return buildOpportunityBrief({
    title: video.title,
    caption: video.caption,
    creator: video.creator,
    market: video.market,
    origin: video.origin,
    trendScore: video.trendScore,
    growthViews: video.growthViews,
    velocityScore: video.velocityScore,
    accelerationScore: video.accelerationScore,
    evidenceCount: video.evidenceCount,
    snapshotCount: video.snapshotCount,
    views: video.views,
    sound: video.sound,
    hashtags: video.hashtags,
  });
}

function contentIdeaForVideo(video: TrendVideoView) {
  const opportunityBrief = briefForVideo(video);

  return buildContentIdeaBrief({
    reel: {
      title: video.title,
      caption: video.caption,
      creator: video.creator,
      market: video.market,
      origin: video.origin,
      trendScore: video.trendScore,
      views: video.views,
      growthViews: video.growthViews,
      evidenceCount: video.evidenceCount,
      snapshotCount: video.snapshotCount,
      sound: video.sound,
      hashtags: video.hashtags,
    },
    opportunityBrief,
    decision: video.decision,
  });
}

function statusToneClass(tone: "hot" | "gold" | "aqua" | "muted") {
  if (tone === "hot") return "border-[rgba(237,73,86,0.32)] bg-[rgba(237,73,86,0.1)] text-[color:var(--hot)]";
  if (tone === "gold") return "border-[rgba(230,183,101,0.28)] bg-[rgba(230,183,101,0.09)] text-[color:var(--gold)]";
  if (tone === "aqua") return "border-[rgba(88,200,190,0.26)] bg-[rgba(88,200,190,0.08)] text-[color:var(--aqua)]";

  return "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[color:var(--muted-strong)]";
}

function toneTextClass(tone: "hot" | "gold" | "aqua" | "muted") {
  if (tone === "hot") return "text-[color:var(--hot)]";
  if (tone === "gold") return "text-[color:var(--gold)]";
  if (tone === "aqua") return "text-[color:var(--aqua)]";

  return "text-[color:var(--muted-strong)]";
}

function decisionBadgeClass(decision: OpportunityDecisionView) {
  return statusToneClass(decision.tone);
}

function DecisionBadge({ decision }: { decision?: OpportunityDecisionView }) {
  if (!decision) {
    return null;
  }

  return (
    <span
      className={`rounded-full border px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] ${decisionBadgeClass(decision)}`}
      title={`Status: ${decision.label}`}
      aria-label={`Status de decisao: ${decision.label}`}
    >
      {decision.shortLabel}
    </span>
  );
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
  const compact = size === "sm";

  return (
    <div
      className="relative flex min-w-0 flex-col items-end gap-1 rounded-[14px] border bg-black/55 px-2.5 py-2 text-right shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-md"
      style={{ borderColor: `${color}66` }}
      aria-label={`Score ${score}`}
    >
      <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-white/54">
        score
      </span>
      <p
        className={compact ? "metric-number text-[16px] font-semibold leading-none" : "metric-number text-[22px] font-semibold leading-none"}
        style={{ color }}
      >
        <GSAPCounter value={score} delay={delay} duration={0.75} />
      </p>

      {/* hot label */}
      {tier === "hot" && size !== "sm" && (
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.18em]"
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


/* ─── MetricChip ────────────────────────────────────────────── */

function MetricChip({
  icon: Icon,
  label,
  value,
  color,
  animated,
  delay,
}: {
  icon?: ComponentType<{ className?: string }>;
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
  const brief = briefForVideo(video);

  return (
    <motion.article
      variants={cardVariants}
      layout
      className="group relative"
    >
      <Link
        href={`/trends/${video.id}`}
        className="viral-artifact-card viral-artifact-card-featured relative block overflow-hidden rounded-[var(--radius-2xl)] transition-all duration-300"
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
          <div className="relative min-h-[360px] overflow-hidden p-3 md:min-h-[390px]">
            <ReelArtifactPoster
              video={video}
              fill
              featured
              className="h-full"
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

                <DecisionBadge decision={video.decision} />

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

              <div className="mt-4 grid gap-2 rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.22)] p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] ${statusToneClass(brief.status.tone)}`}
                  >
                    {brief.status.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    {brief.opportunityType}
                  </span>
                </div>
                <p className="text-sm leading-6 text-[color:var(--foreground)]">
                  {brief.cardReason}
                </p>
                <p className="text-[12px] leading-5 text-[color:var(--muted-strong)]">
                  Proxima acao: {brief.action.label}. {brief.action.body}
                </p>
              </div>
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
                abrir brief
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
  const brief = briefForVideo(video);

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
        className="viral-artifact-card block overflow-hidden rounded-[var(--radius-xl)] transition-all duration-300"
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
        <div className="relative p-2.5">
          <ReelArtifactPoster video={video} />

          {/* score badge — top right */}
          <div className="absolute right-2.5 top-2.5 z-20">
            <ScoreBadge score={video.trendScore} delay={baseDelay} size="sm" />
          </div>

          {/* market tag — top left */}
          <div className="absolute left-2.5 top-2.5 z-20 flex max-w-[calc(100%-5rem)] flex-wrap gap-1.5">
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
            <DecisionBadge decision={video.decision} />
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

          <div className="mt-2 rounded-[var(--radius-md)] border border-white/[0.07] bg-black/20 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`truncate rounded-full border px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] ${statusToneClass(brief.status.tone)}`}
              >
                {brief.status.label}
              </span>
              {video.decision ? (
                <span className="min-w-0 truncate text-[9px] text-[color:var(--aqua)]">
                  {video.decision.label}
                </span>
              ) : null}
              <span className="shrink-0 text-[9px] text-[color:var(--muted)]">
                {brief.action.label}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[color:var(--muted-strong)]">
              {brief.cardReason}
            </p>
          </div>

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
              abrir brief
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

function ActionStrip({ results }: { results: TrendVideoView[] }) {
  const actionable = results.filter((video) => shouldShowInActionNow(video.decision));
  const removedFromAction = results.length - actionable.length;
  const top = [...actionable]
    .filter((video) => shouldShowInActionNow(video.decision))
    .sort((a, b) => b.trendScore - a.trendScore || b.views - a.views)
    .slice(0, Math.min(3, results.length));

  if (top.length === 0) {
    return (
      <section
        className="rounded-[var(--radius-2xl)] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.014)] p-4 md:p-5"
        aria-labelledby="reels-para-agir"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--aqua)]">
              fila limpa
            </p>
            <h2 id="reels-para-agir" className="mt-1 text-xl font-semibold tracking-[-0.01em] text-[color:var(--foreground)]">
              Nenhum Reel pedindo acao agora
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[color:var(--muted)]">
            Tudo que estava ativo foi descartado ou marcado como usado. A biblioteca continua preservada para consulta.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-[var(--radius-2xl)] border border-[rgba(237,73,86,0.16)] bg-[linear-gradient(135deg,rgba(237,73,86,0.075),rgba(255,255,255,0.018)_48%,rgba(247,119,55,0.045))] p-4 md:p-5"
      aria-labelledby="reels-para-agir"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hot)]">
            decisao rapida
          </p>
          <h2 id="reels-para-agir" className="mt-1 text-xl font-semibold tracking-[-0.01em] text-[color:var(--foreground)]">
            Reels para agir agora
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--muted)]">
          Prioridade limpa: {removedFromAction > 0 ? `${removedFromAction} ja saiu da fila ativa. ` : ""}
          Clique em um Reel para salvar, observar, descartar, usar ou transformar em pauta.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {top.map((video) => {
          const brief = briefForVideo(video);
          const creator = video.creator ? `@${video.creator}` : video.origin;

          return (
            <Link
              key={video.id}
              href={`/trends/${video.id}`}
              className="group min-w-0 rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.22)] p-3.5 transition hover:border-[rgba(237,73,86,0.32)] hover:bg-[rgba(237,73,86,0.045)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-full border px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] ${statusToneClass(brief.status.tone)}`}
                >
                  {brief.status.label}
                </span>
                <DecisionBadge decision={video.decision} />
                <span className="metric-number text-sm font-semibold text-[color:var(--foreground)]">
                  {video.trendScore}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-[color:var(--foreground)] group-hover:text-[color:var(--hot)]">
                {creator} / {video.title}
              </p>
              <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[color:var(--muted-strong)]">
                {brief.action.label}: {brief.replicableFormat.copyableElement}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--muted)] group-hover:text-[color:var(--foreground)]">
                abrir Opportunity Brief
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function DecisionShelf({ results }: { results: TrendVideoView[] }) {
  const groupOrder: OpportunityDecisionQueueGroup[] = ["ideas", "saved", "observing", "used"];
  const hiddenCount = results.filter((video) => getOpportunityDecisionQueueGroup(video.decision) === "hidden").length;
  const undecidedCount = results.filter((video) => getOpportunityDecisionQueueGroup(video.decision) === "none").length;
  const decidedCount = results.length - undecidedCount;
  const activeQueueCount = results.filter((video) => {
    const group = getOpportunityDecisionQueueGroup(video.decision);

    return group === "ideas" || group === "saved" || group === "observing";
  }).length;
  const groups = groupOrder.map((key) => ({
    key,
    meta: opportunityDecisionGroupMeta[key],
    items: results.filter((video) => getOpportunityDecisionQueueGroup(video.decision) === key),
  }));

  return (
    <section
      className="rounded-[var(--radius-2xl)] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.024),rgba(255,255,255,0.012))] p-4 md:p-5"
      aria-labelledby="fila-de-decisao"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--aqua)]">
            fila de trabalho
          </p>
          <h2 id="fila-de-decisao" className="mt-1 text-xl font-semibold tracking-[-0.01em] text-[color:var(--foreground)]">
            Pauta de acao
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--muted)]">
          Decida o destino de cada oportunidade. A biblioteca preserva o Reel; esta fila mostra o que virou trabalho.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { label: "decididos", value: decidedCount },
          { label: "na pauta", value: activeQueueCount },
          { label: "sem decisao", value: undecidedCount },
          { label: "descartados", value: hiddenCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)] p-3"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
              {item.label}
            </p>
            <p className="metric-number mt-1 text-xl font-semibold text-[color:var(--foreground)]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {decidedCount === 0 ? (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-[rgba(237,73,86,0.16)] bg-[rgba(237,73,86,0.045)] p-4">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            Nenhuma decisao salva ainda.
          </p>
          <p className="mt-1 text-[12px] leading-5 text-[color:var(--muted-strong)]">
            Abra um Reel em destaque e escolha se ele vira pauta, observacao, descarte ou referencia usada.
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {groups.map((group) => (
          <div
            key={group.key}
            className="rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.18)] p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={`font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${toneTextClass(group.meta.tone)}`}>
                  {group.meta.title}
                </h3>
                <p className="mt-1 text-[11px] leading-4 text-[color:var(--muted)]">
                  {group.meta.body}
                </p>
              </div>
              <span className="metric-number shrink-0 text-sm font-semibold text-[color:var(--foreground)]">
                {group.items.length}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {group.items.length > 0 ? (
                group.items.slice(0, 3).map((video) => {
                  const idea = group.key === "ideas" ? contentIdeaForVideo(video) : null;

                  return (
                    <Link
                      key={video.id}
                      href={`/trends/${video.id}`}
                      className="group rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.018)] p-3 transition hover:border-[rgba(237,73,86,0.28)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 min-w-0 text-sm font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--hot)]">
                          {video.creator ? `@${video.creator}` : video.origin}
                        </p>
                        <DecisionBadge decision={video.decision} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[color:var(--muted-strong)]">
                        {idea ? idea.title : video.title}
                      </p>
                      {idea ? (
                        <>
                          <div className="mt-2 grid gap-1.5 rounded-[var(--radius-sm)] border border-[rgba(237,73,86,0.14)] bg-[rgba(237,73,86,0.035)] p-2.5">
                            <p className="line-clamp-2 text-[12px] leading-5 text-[color:var(--foreground)]">
                              Gancho: {idea.hook}
                            </p>
                            <p className="line-clamp-1 text-[11px] leading-4 text-[color:var(--muted-strong)]">
                              CTA: {idea.cta}
                            </p>
                          </div>
                          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--hot)] group-hover:text-[color:var(--foreground)]">
                            abrir pauta completa
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </span>
                        </>
                      ) : null}
                    </Link>
                  );
                })
              ) : (
                <p className="rounded-[var(--radius-md)] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.012)] p-3 text-[12px] leading-5 text-[color:var(--muted)]">
                  {group.meta.empty}
                </p>
              )}
              {group.items.length > 3 ? (
                <p className="text-[11px] text-[color:var(--muted)]">
                  +{group.items.length - 3} nesta coluna.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {hiddenCount > 0 ? (
        <p className="mt-3 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)] px-3 py-2 text-[11px] leading-5 text-[color:var(--muted)]">
          {hiddenCount} Reel{hiddenCount === 1 ? "" : "s"} descartado{hiddenCount === 1 ? "" : "s"} fora da fila ativa. O conteudo nao foi apagado.
        </p>
      ) : null}
    </section>
  );
}

/* ─── Section header ─────────────────────────────────────────── */

function SectionHeader({
  tier,
  count,
  label,
}: {
  tier: ScoreTier;
  count: number;
  label?: string;
}) {
  const color = tier === "hot" ? "var(--hot)" : tier === "gold" ? "var(--gold)" : "var(--aqua)";
  const visibleLabel = label ?? tierLabel(tier);

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
        {visibleLabel}
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
      <Archive className="mx-auto mb-4 h-8 w-8 text-[color:var(--muted)]" aria-hidden="true" />
      <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
        Biblioteca vazia
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[color:var(--muted-strong)]">
        Cole perfis do Instagram no painel lateral e inicie a primeira coleta. Os artefatos reais aparecem aqui automaticamente.
      </p>
      <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
        <Archive className="h-3.5 w-3.5" aria-hidden="true" />
        fonte obrigatoria / dados reais apenas
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

  const libraryDensity =
    results.length === 1
      ? "featured"
      : results.length <= 6
        ? "editorial"
        : results.length < 20
          ? "shelf"
          : "cluster";
  const densityCopy = {
    featured: "1 artefato em foco com leitura ampliada.",
    editorial: "grid editorial compacto para comparar poucos achados reais.",
    shelf: "prateleira viva com profundidade, score e fonte.",
    cluster: "biblioteca densa pronta para filtros por mercado, fonte e energia.",
  }[libraryDensity];
  const brCount = results.filter((video) => video.market === "BR").length;
  const sourceCount = results.reduce((total, video) => total + Math.max(video.evidenceCount, video.snapshotCount), 0);
  const topScore = results.reduce((max, video) => Math.max(max, video.trendScore), 0);

  // Separa por tier, mantendo ordem original dentro de cada tier
  const featuredCards = results.length === 1
    ? results.slice(0, 1)
    : results.filter((v) => v.trendScore >= 78).slice(0, 2);
  const featuredIds = new Set(featuredCards.map((v) => v.id));

  const warmCards = results.filter(
    (v) => !featuredIds.has(v.id) && v.trendScore >= 52 && v.trendScore < 78
  );

  const coolCards = results.filter(
    (v) => v.trendScore < 52 && !featuredIds.has(v.id)
  );

  // cards que caíram fora dos featured hot (score >=78 mas além dos 2 exibidos)
  const extraHotAsWarm = results.filter(
    (v) => v.trendScore >= 78 && !featuredIds.has(v.id)
  );
  const gridWarm = [...extraHotAsWarm, ...warmCards];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="library-root"
        data-library-density={libraryDensity}
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="grid gap-8"
        role="feed"
        aria-label="Biblioteca de reels virais"
      >
        <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[rgba(239,233,220,0.1)] bg-[rgba(255,255,255,0.018)] p-4 md:p-5">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(237,73,86,0.12),transparent_28rem),radial-gradient(circle_at_90%_80%,rgba(247,119,55,0.08),transparent_24rem)]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hot)]">
                arquivo em movimento
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[color:var(--foreground)] md:text-[32px]">
                Artefatos virais virando repertorio estrategico
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                Cada artefato preserva origem, score e metricas reais. A Sala de Sinais transforma os melhores achados em leitura acionavel.
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                {densityCopy}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
              {[
                { label: "Reels", value: results.length },
                { label: "BR", value: brCount },
                { label: "Top score", value: topScore },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] p-3"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{item.label}</p>
                  <p className="metric-number mt-1 text-xl font-semibold text-[color:var(--foreground)]">{item.value}</p>
                </div>
              ))}
              <div className="col-span-3 rounded-[var(--radius-md)] border border-[rgba(237,73,86,0.18)] bg-[rgba(237,73,86,0.055)] px-3 py-2 text-[11px] text-[color:var(--muted-strong)]">
                {sourceCount} registro{sourceCount === 1 ? "" : "s"} de prova/leitura conectado{sourceCount === 1 ? "" : "s"} a dados reais.
              </div>
            </div>
          </div>
        </section>
        <ActionStrip results={results} />
        <DecisionShelf results={results} />
        {/* ── EM CHAMAS — featured horizontal ── */}
        {featuredCards.length > 0 && (
          <section aria-labelledby="section-hot">
            <div id="section-hot" className="mb-4">
              <SectionHeader
                tier={results.length === 1 ? scoreTier(featuredCards[0]?.trendScore ?? 0) : "hot"}
                count={featuredCards.length}
                label={results.length === 1 ? "ARTEFATO EM FOCO" : "EM CHAMAS"}
              />
            </div>
            <div className="grid gap-4">
              {featuredCards.map((video, idx) => (
                <FeaturedReelCard key={video.id} video={video} index={idx} />
              ))}
            </div>
          </section>
        )}

        {/* ── QUENTES — grid portrait 2-3 cols ── */}
        {gridWarm.length > 0 && (
          <section aria-labelledby="section-warm">
            <div id="section-warm" className="mb-4">
              <SectionHeader tier="gold" count={gridWarm.length} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gridWarm.map((video, idx) => (
                <PortraitReelCard
                  key={video.id}
                  video={video}
                  index={featuredCards.length + idx}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── MONITORANDO — grid compacto 2-4 cols ── */}
        {coolCards.length > 0 && (
          <section aria-labelledby="section-cool">
            <div id="section-cool" className="mb-4">
              <SectionHeader tier="aqua" count={coolCards.length} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {coolCards.map((video, idx) => (
                <PortraitReelCard
                  key={video.id}
                  video={video}
                  index={featuredCards.length + gridWarm.length + idx}
                />
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
