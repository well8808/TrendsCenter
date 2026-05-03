"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";

import { usePrefersReducedMotion3D } from "@/components/viral-universe/use-prefers-reduced-motion-3d";
import { useViralMotionQuality } from "@/components/viral-universe/use-viral-motion-quality";
import type {
  ViralReelNode,
  ViralSignalNode,
  ViralUniverseMode,
  ViralUniverseStats,
} from "@/components/viral-universe/viral-scene-quality";
import { cn } from "@/lib/utils";

const ViralArchiveScene3D = dynamic(
  () => import("@/components/viral-universe/viral-archive-scene-3d").then((mod) => mod.ViralArchiveScene3D),
  {
    ssr: false,
    loading: () => <ViralUniverseFallback />,
  },
);

class ViralWebGLBoundary extends Component<
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
      { rootMargin: "120px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function StageMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/68">
      <span className="text-white">{value}</span>
      {label}
    </span>
  );
}

function ViralUniverseFallback({
  mode = "library",
  stats,
}: {
  mode?: ViralUniverseMode;
  stats?: ViralUniverseStats;
}) {
  const shelves = mode === "library" ? 4 : 3;
  const artifactCount = Math.min(stats?.reels ?? 4, 7);
  const signalCount = Math.min(stats?.signals ?? (mode === "signal-room" ? 3 : 1), 4);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div aria-hidden="true" className="archive-stage-fallback absolute inset-0" />
      {Array.from({ length: shelves }).map((_, index) => (
        <span
          key={`shelf-${index}`}
          aria-hidden="true"
          className="absolute left-[10%] h-px w-[72%] bg-gradient-to-r from-transparent via-[rgba(239,233,220,0.18)] to-transparent"
          style={{ top: `${28 + index * 15}%` }}
        />
      ))}
      {Array.from({ length: artifactCount }).map((_, index) => (
        <span
          key={`artifact-${index}`}
          aria-hidden="true"
          className="absolute rounded-[10px] border bg-[rgba(237,73,86,0.06)] shadow-[0_0_26px_rgba(237,73,86,0.12)]"
          style={{
            left: artifactCount <= 1 ? "38%" : `${24 + (index % 5) * 10}%`,
            top: artifactCount <= 1 ? "22%" : `${24 + Math.floor(index / 5) * 24 + (index % 2) * 3}%`,
            width: artifactCount <= 1 ? "56px" : `${28 + (index % 3) * 4}px`,
            height: artifactCount <= 1 ? "100px" : `${54 + (index % 4) * 6}px`,
            rotate: `${-8 + index * 3}deg`,
            borderColor: index % 3 === 1 ? "rgba(230,183,101,0.28)" : index % 3 === 2 ? "rgba(88,200,190,0.28)" : "rgba(237,73,86,0.34)",
          }}
        />
      ))}
      {Array.from({ length: signalCount }).map((_, index) => (
        <span
          key={`signal-${index}`}
          aria-hidden="true"
          className="absolute rounded-[8px] border border-[rgba(88,200,190,0.24)] bg-[rgba(88,200,190,0.055)]"
          style={{
            right: `${18 + index * 8}%`,
            top: `${34 + index * 10}%`,
            width: `${54 - index * 4}px`,
            height: `${24 - index}px`,
          }}
        />
      ))}
    </div>
  );
}

export function ViralUniverseStage({
  mode,
  reels,
  signals,
  stats,
  className,
  label,
}: {
  mode: ViralUniverseMode;
  reels: ViralReelNode[];
  signals: ViralSignalNode[];
  stats: ViralUniverseStats;
  className?: string;
  label?: string;
}) {
  const { clientReady, prefersReducedMotion } = usePrefersReducedMotion3D();
  const quality = useViralMotionQuality(prefersReducedMotion);
  const { ref, visible } = useInViewport();
  const [webglFailed, setWebglFailed] = useState(false);
  const handleWebglFailure = useCallback(() => setWebglFailed(true), []);
  const hasSceneData = reels.length > 0 || signals.length > 0;
  const renderCanvas = clientReady && !prefersReducedMotion && quality.canRender3d && hasSceneData && !webglFailed;
  const currentLabel = label ?? (mode === "library" ? "Arquivo vivo" : "Leitura estrategica");
  const sortedReels = useMemo(() => reels.slice().sort((a, b) => b.score - a.score), [reels]);
  const sortedSignals = useMemo(() => signals.slice().sort((a, b) => b.score - a.score), [signals]);

  return (
    <motion.div
      ref={ref}
      className={cn(
        "pointer-events-none relative overflow-hidden rounded-[28px]",
        "bg-[linear-gradient(135deg,rgba(237,73,86,0.12),rgba(247,119,55,0.055)_36%,rgba(0,0,0,0.2)),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.08))]",
        className,
      )}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%,rgba(0,0,0,0.26))]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:34px_34px]" />

      {renderCanvas ? (
        <ViralWebGLBoundary onError={handleWebglFailure}>
          <ViralArchiveScene3D
            mode={mode}
            reels={sortedReels}
            signals={sortedSignals}
            stats={stats}
            quality={quality}
            active={visible}
            onContextLost={handleWebglFailure}
          />
        </ViralWebGLBoundary>
      ) : (
        <ViralUniverseFallback mode={mode} stats={stats} />
      )}

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--hot)] shadow-[0_0_14px_rgba(237,73,86,0.68)]" />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72">
          {currentLabel}
        </span>
      </div>

      <div className="absolute bottom-4 left-4 hidden max-w-[78%] flex-wrap gap-2 sm:flex">
        <StageMetric label="reels" value={stats.reels} />
        <StageMetric label="provas" value={stats.evidence} />
        <StageMetric label="score" value={stats.avgScore} />
      </div>
    </motion.div>
  );
}
