"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type LazyReelsRadarScene3DProps = {
  className?: string;
  intensity?: number;
  mode?: "library" | "radar";
};

function RadarSceneFallback({
  className,
  mode = "library",
}: Pick<LazyReelsRadarScene3DProps, "className" | "mode">) {
  const isRadar = mode === "radar";

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative overflow-hidden", className)}
    >
      <div className="absolute left-[14%] top-[16%] h-[58%] w-[58%] rounded-full border border-[rgba(88,200,190,0.22)]" />
      <div className="absolute left-[20%] top-[22%] h-[44%] w-[44%] rounded-full border border-[rgba(237,73,86,0.18)]" />
      <div className="absolute left-[34%] top-[34%] h-10 w-10 rounded-full bg-[radial-gradient(circle,rgba(237,73,86,0.32),rgba(157,131,236,0.10)_48%,transparent_72%)]" />
      <div className="absolute left-[7%] top-[44%] h-px w-[76%] rotate-[-4deg] bg-gradient-to-r from-transparent via-[rgba(88,200,190,0.42)] to-transparent" />
      <div className="absolute left-[19%] top-[70%] h-2 w-2 rounded-full bg-[rgba(157,131,236,0.72)] shadow-[0_0_16px_rgba(157,131,236,0.36)]" />
      <div className="absolute right-[14%] top-[36%] h-1.5 w-1.5 rounded-full bg-[rgba(88,200,190,0.72)] shadow-[0_0_14px_rgba(88,200,190,0.32)]" />
      {isRadar && (
        <>
          <span className="absolute right-[8%] top-[21%] flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-[rgba(88,200,190,0.52)]" />
            EUA
          </span>
          <span className="absolute left-[45%] top-[47%] -translate-x-1/2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
            BR
          </span>
          <span className="absolute bottom-[17%] right-[4%] flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
            acao
            <span className="h-px w-6 bg-gradient-to-r from-[rgba(230,183,101,0.52)] to-transparent" />
          </span>
        </>
      )}
    </div>
  );
}

const ReelsRadarScene3D = dynamic(
  () =>
    import("@/components/reels-radar-scene-3d").then(
      (mod) => mod.ReelsRadarScene3D,
    ),
  {
    ssr: false,
    loading: () => <RadarSceneFallback className="absolute inset-0" />,
  },
);

export function LazyReelsRadarScene3D({
  className,
  intensity,
  mode = "library",
}: LazyReelsRadarScene3DProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative overflow-hidden", className)}
    >
      {prefersReducedMotion ? (
        <RadarSceneFallback className="absolute inset-0" mode={mode} />
      ) : (
        <ReelsRadarScene3D className="absolute inset-0" intensity={intensity} mode={mode} />
      )}
    </div>
  );
}
