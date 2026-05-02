"use client";

import { useState, type CSSProperties } from "react";
import { ExternalLink, Play, Sparkles } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import {
  classifyReelMediaStability,
  shouldProxyReelImage,
  type NormalizedReelMedia,
} from "@/lib/trends/reel-media";

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompact(value: number) {
  return compactFormatter.format(value);
}

function scoreAccent(score: number) {
  if (score >= 78) return "var(--hot)";
  if (score >= 52) return "var(--gold)";
  return "var(--aqua)";
}

function fallbackGradient(score: number, market: string, seedText?: string) {
  const seed = Array.from(seedText ?? market).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const x = 18 + (seed % 56);
  const y = 16 + ((seed * 7) % 52);
  const accent = scoreAccent(score);
  const secondary = market === "US" ? "rgba(88,200,190,0.44)" : "rgba(247,119,55,0.44)";

  return `
    radial-gradient(circle at ${x}% ${y}%, ${accent}66, transparent 34%),
    radial-gradient(circle at ${100 - x}% ${76 - y / 2}%, ${secondary}, transparent 38%),
    linear-gradient(158deg, rgba(255,255,255,0.09), rgba(255,255,255,0.018) 42%, rgba(0,0,0,0.46)),
    linear-gradient(180deg, #1a1416 0%, #090807 100%)
  `;
}

export interface ReelArtifactPosterView {
  title: string;
  thumbnailUrl?: string;
  media?: NormalizedReelMedia;
  market: string;
  trendScore: number;
  growthViews: number;
  views: number;
  creator?: string;
  origin: string;
  sound?: string;
  hashtags: string[];
}

export function ReelArtifactPoster({
  video,
  className,
  fill = false,
  featured = false,
}: {
  video: ReelArtifactPosterView;
  className?: string;
  fill?: boolean;
  featured?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const posterUrl = failed ? undefined : video.media?.posterUrl ?? video.thumbnailUrl;
  const videoUrl = failed || posterUrl ? undefined : video.media?.videoUrl;
  const hasMedia = Boolean(posterUrl || videoUrl);
  const hadRealMedia = Boolean(video.media?.hasRealMedia || video.thumbnailUrl);
  const realMediaFailed = failed && hadRealMedia;
  const proxyImage = shouldProxyReelImage(posterUrl);
  const mediaStability = realMediaFailed
    ? classifyReelMediaStability({
        url: video.media?.posterUrl ?? video.thumbnailUrl ?? video.media?.videoUrl,
        mediaKind: video.media?.mediaKind,
        sourceField: video.media?.sourceField ?? video.media?.mediaSourceField,
        mediaConfidence: video.media?.mediaConfidence,
        loadState: "failed",
      })
    : video.media?.mediaStability ?? "unknown";
  const accent = scoreAccent(video.trendScore);

  return (
    <div
      className={cn(
        "reel-artifact-poster relative isolate w-full overflow-hidden rounded-[22px]",
        fill ? "h-full min-h-full" : "aspect-[9/16]",
        featured && "reel-artifact-poster-featured",
        className,
      )}
      data-has-media={hasMedia ? "true" : "false"}
      data-media-kind={hasMedia ? video.media?.mediaKind ?? (posterUrl ? "image" : "video") : "fallback"}
      data-media-source={hasMedia ? video.media?.sourceField ?? video.media?.mediaSourceField ?? "thumbnailUrl" : "fallback"}
      data-media-confidence={video.media?.mediaConfidence ?? "low"}
      data-media-proxy={proxyImage ? "next-image" : "direct"}
      data-media-stability={mediaStability}
      data-fallback-reason={realMediaFailed ? "load_failed" : video.media?.fallbackReason}
      style={{ "--artifact-accent": accent } as CSSProperties}
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          unoptimized={!proxyImage}
          sizes={featured ? "(min-width: 768px) 280px, 100vw" : "(min-width: 1024px) 28vw, (min-width: 640px) 46vw, 100vw"}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      ) : videoUrl ? (
        <video
          src={videoUrl}
          muted
          playsInline
          loop
          autoPlay={featured}
          preload={featured ? "metadata" : "none"}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: fallbackGradient(video.trendScore, video.market, video.creator ?? video.title) }}
          aria-hidden="true"
        />
      )}

      <div className="reel-poster-archive-lines absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.78))]" aria-hidden="true" />

      {hasMedia && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3.5">
          <span
            className="rounded-full border px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.16em] shadow-[0_10px_28px_rgba(0,0,0,0.28)] backdrop-blur-md"
            style={{
              borderColor: "color-mix(in srgb, var(--artifact-accent) 46%, transparent)",
              color: accent,
              background: "rgba(0,0,0,0.38)",
            }}
          >
            score {video.trendScore}
          </span>
          <span className="rounded-full border border-white/16 bg-black/38 px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-white/82 shadow-[0_10px_28px_rgba(0,0,0,0.28)] backdrop-blur-md">
            {video.market}
          </span>
        </div>
      )}

      {!hasMedia && (
        <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden="true">
          <div
            className="absolute left-5 right-5 top-[20%] h-px"
            style={{ background: "linear-gradient(90deg, transparent, var(--artifact-accent), transparent)" }}
          />
          <div
            className="absolute left-[18%] top-[18%] h-[30%] w-[64%] rounded-[28px] border opacity-55"
            style={{ borderColor: "color-mix(in srgb, var(--artifact-accent) 42%, transparent)" }}
          />
          <span
            className="metric-number absolute right-5 top-[23%] text-[72px] font-semibold leading-none tracking-[-0.08em] opacity-[0.18]"
            style={{ color: accent }}
          >
            {video.trendScore}
          </span>
          <span className="absolute left-5 top-[38%] max-w-[62%] font-mono text-[8px] uppercase tracking-[0.18em] text-white/46">
            {realMediaFailed || video.media?.fallbackReason === "invalid_media_url" ? "midia indisponivel" : video.origin}
          </span>
        </div>
      )}

      {!hasMedia && (
        <div className="absolute inset-0 z-[4] flex flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-white/72">
              {realMediaFailed ? "midia indisponivel" : "artefato"}
            </span>
            <span
              className="rounded-full border px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ borderColor: "color-mix(in srgb, var(--artifact-accent) 46%, transparent)", color: accent }}
            >
              {video.market}
            </span>
          </div>

          <div>
            <div className="mb-3 h-px w-full bg-gradient-to-r from-transparent via-white/22 to-transparent" />
            <p className="line-clamp-4 text-[18px] font-semibold leading-[1.05] tracking-[-0.03em] text-white md:text-[20px]">
              {video.title}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <span className="rounded-[12px] border border-white/10 bg-black/22 px-2.5 py-2">
                <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-white/48">score</span>
                <span className="metric-number text-lg font-semibold text-white">{video.trendScore}</span>
              </span>
              <span className="rounded-[12px] border border-white/10 bg-black/22 px-2.5 py-2">
                <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-white/48">views</span>
                <span className="metric-number text-lg font-semibold text-white">{formatCompact(video.views)}</span>
              </span>
            </div>
            {realMediaFailed ? (
              <p className="mt-3 text-[10px] leading-4 text-white/52">
                A capa real expirou ou foi bloqueada pelo provedor. Os dados do Reel continuam preservados.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {hasMedia && (
        <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-white/58">
                {video.creator ? `@${video.creator}` : video.origin}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-white/82">
                <Sparkles className="h-3 w-3 text-[color:var(--artifact-accent)]" aria-hidden="true" />
                midia real · {formatCompact(video.views)} views
              </p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/16 bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.34)] backdrop-blur-md">
              {posterUrl ? <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> : <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
