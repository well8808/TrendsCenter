"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";

import { usePrefersReducedMotion3D } from "@/components/viral-universe/use-prefers-reduced-motion-3d";
import { useViralMotionQuality } from "@/components/viral-universe/use-viral-motion-quality";
import type { ViralReelNode, ViralUniverseStats } from "@/components/viral-universe/viral-scene-quality";
import type { CinematicFlowStage } from "@/lib/trends/cinematic-flow";
import { cn } from "@/lib/utils";

const CinematicSignalUniverseScene = dynamic(
  () => import("@/components/cinematic/cinematic-signal-universe-scene").then((mod) => mod.CinematicSignalUniverseScene),
  {
    ssr: false,
    loading: () => <CinematicSignalUniverseFallback />,
  },
);

class WebGLBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;

    return this.props.children;
  }
}

function useInViewport() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? true),
      { rootMargin: "100px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

export function CinematicSignalUniverseFallback({
  stages = [],
  stats,
  reason,
}: {
  stages?: CinematicFlowStage[];
  stats?: ViralUniverseStats;
  reason?: string;
}) {
  const artifactCount = Math.max(1, Math.min(stats?.reels ?? 5, 8));
  const visibleStages = stages.length > 0
    ? stages
    : [
        { key: "reel", title: "Reel", tone: "hot" },
        { key: "signal", title: "Signal", tone: "aqua" },
        { key: "brief", title: "Brief", tone: "gold" },
        { key: "studio", title: "Studio", tone: "muted" },
      ];

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(237,73,86,0.16),transparent_24rem),radial-gradient(circle_at_78%_56%,rgba(88,200,190,0.08),transparent_22rem),linear-gradient(135deg,rgba(255,255,255,0.035),transparent_62%)]" />
      <div className="absolute left-[9%] top-[18%] h-[62%] w-[44%] rotate-[-4deg] rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)]" />
      {Array.from({ length: artifactCount }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-[12px] border bg-[rgba(237,73,86,0.08)] shadow-[0_18px_46px_rgba(0,0,0,0.28)]"
          style={{
            left: `${18 + (index % 4) * 8}%`,
            top: `${24 + Math.floor(index / 4) * 28 + (index % 2) * 5}%`,
            width: index === 0 ? "58px" : "40px",
            height: index === 0 ? "104px" : "72px",
            borderColor: index % 3 === 0 ? "rgba(237,73,86,0.32)" : index % 3 === 1 ? "rgba(230,183,101,0.24)" : "rgba(88,200,190,0.24)",
            rotate: `${-8 + index * 3}deg`,
          }}
        />
      ))}
      <span className="absolute left-[54%] top-[49%] h-px w-[25%] rotate-[-8deg] bg-gradient-to-r from-[rgba(237,73,86,0.38)] via-[rgba(247,119,55,0.26)] to-transparent" />
      <div className="absolute right-[7%] top-[17%] grid w-[34%] gap-2">
        {visibleStages.slice(0, 5).map((stage, index) => (
          <span
            key={stage.key ?? `${stage.title}-${index}`}
            className="rounded-[14px] border bg-[rgba(0,0,0,0.2)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/60"
            style={{
              borderColor: stage.tone === "hot" ? "rgba(237,73,86,0.34)" : stage.tone === "aqua" ? "rgba(88,200,190,0.26)" : "rgba(255,255,255,0.1)",
              transform: `translateX(${index % 2 === 0 ? 0 : 14}px)`,
            }}
          >
            {stage.title}
          </span>
        ))}
      </div>
      {reason ? (
        <span
          className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/48 backdrop-blur-md"
          suppressHydrationWarning
        >
          {reason}
        </span>
      ) : null}
    </div>
  );
}

export function CinematicSignalUniverseStage({
  reels,
  stages,
  stats,
  className,
  label = "Fluxo vivo",
}: {
  reels: ViralReelNode[];
  stages: CinematicFlowStage[];
  stats: ViralUniverseStats;
  className?: string;
  label?: string;
}) {
  const { clientReady, prefersReducedMotion } = usePrefersReducedMotion3D();
  const quality = useViralMotionQuality(prefersReducedMotion);
  const { ref, visible } = useInViewport();
  const [webglFailed, setWebglFailed] = useState(false);
  const handleWebglFailure = useCallback(() => setWebglFailed(true), []);
  const renderCanvas = clientReady
    && !prefersReducedMotion
    && quality.canRender3d
    && reels.length > 0
    && stages.length > 0
    && !webglFailed;
  const fallbackReason = useMemo(() => {
    if (webglFailed) return "fallback seguro / WebGL indisponivel";
    if (!clientReady) return "modo leve seguro";
    if (prefersReducedMotion) return "movimento reduzido";
    if (!quality.canRender3d) return "modo leve mobile";
    if (reels.length === 0) return "aguardando Reels reais";
    if (stages.length === 0) return "fluxo aguardando dados";

    return "fallback visual";
  }, [clientReady, prefersReducedMotion, quality.canRender3d, reels.length, stages.length, webglFailed]);

  return (
    <motion.div
      ref={ref}
      className={cn(
        "pointer-events-none relative overflow-hidden rounded-[28px] border border-[rgba(239,233,220,0.1)] bg-[rgba(0,0,0,0.2)]",
        className,
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
      data-cinematic-stage="signal-universe"
      data-render-mode={renderCanvas ? "webgl" : "fallback"}
      data-disabled-reason={renderCanvas ? undefined : fallbackReason}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(237,73,86,0.1),rgba(255,255,255,0.025)_42%,rgba(88,200,190,0.045))]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:38px_38px]" />

      {renderCanvas ? (
        <WebGLBoundary onError={handleWebglFailure}>
          <CinematicSignalUniverseScene
            reels={reels}
            stages={stages}
            stats={stats}
            quality={quality}
            active={visible}
            onContextLost={handleWebglFailure}
          />
        </WebGLBoundary>
      ) : (
        <CinematicSignalUniverseFallback stages={stages} stats={stats} reason={fallbackReason} />
      )}

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--hot)] shadow-[0_0_14px_rgba(237,73,86,0.68)]" />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72">
          {label}
        </span>
      </div>

      <div className="absolute bottom-4 left-4 hidden max-w-[78%] flex-wrap gap-2 sm:flex">
        {[
          ["reels", stats.reels],
          ["sinais", stats.signals],
          ["score", stats.avgScore],
        ].map(([metric, value]) => (
          <span
            key={metric}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/64"
          >
            <span className="text-white">{value}</span>
            {metric}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
