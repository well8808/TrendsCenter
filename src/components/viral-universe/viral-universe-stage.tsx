"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
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

const ViralOrbitScene = dynamic(
  () => import("@/components/viral-universe/viral-orbit-scene").then((mod) => mod.ViralOrbitScene),
  {
    ssr: false,
    loading: () => <ViralUniverseFallback />,
  },
);

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

function ViralUniverseFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[62%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(237,73,86,0.2)]"
      />
      <div
        aria-hidden="true"
        className="absolute left-[18%] top-[26%] h-[44%] w-[58%] rotate-[-10deg] rounded-full border border-[rgba(88,200,190,0.18)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[22%] top-[18%] h-16 w-10 rotate-[8deg] rounded-[10px] border border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.06)] shadow-[0_0_28px_rgba(237,73,86,0.14)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[34%] top-[30%] h-20 w-12 rotate-[-7deg] rounded-[10px] border border-[rgba(230,183,101,0.32)] bg-[rgba(230,183,101,0.055)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[13%] top-[33%] h-16 w-10 rotate-[13deg] rounded-[10px] border border-[rgba(88,200,190,0.32)] bg-[rgba(88,200,190,0.055)]"
      />
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
  const renderCanvas = clientReady && !prefersReducedMotion && quality.canRender3d;
  const currentLabel = label ?? (mode === "library" ? "Viral Universe" : "Signal Constellation");
  const sortedReels = useMemo(() => reels.slice().sort((a, b) => b.score - a.score), [reels]);
  const sortedSignals = useMemo(() => signals.slice().sort((a, b) => b.score - a.score), [signals]);

  return (
    <motion.div
      ref={ref}
      className={cn(
        "pointer-events-none relative overflow-hidden rounded-[28px]",
        "bg-[radial-gradient(circle_at_70%_32%,rgba(237,73,86,0.14),transparent_34%),radial-gradient(circle_at_38%_72%,rgba(88,200,190,0.1),transparent_30%)]",
        className,
      )}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%,rgba(0,0,0,0.24))]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:28px_28px]" />

      {renderCanvas ? (
        <ViralOrbitScene
          mode={mode}
          reels={sortedReels}
          signals={sortedSignals}
          stats={stats}
          quality={quality}
          active={visible}
        />
      ) : (
        <ViralUniverseFallback />
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
