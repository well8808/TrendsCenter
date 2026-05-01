"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { SplineProps } from "@splinetool/react-spline";

import { cn } from "@/lib/utils";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-full min-h-40 w-full rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.025)]"
    />
  ),
});

type ClientOnlySplineProps = SplineProps & {
  wrapperClassName?: string;
  reducedMotionFallback?: ReactNode;
};

export function ClientOnlySpline({
  className,
  wrapperClassName,
  reducedMotionFallback,
  ...props
}: ClientOnlySplineProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={cn("relative min-h-40 overflow-hidden", wrapperClassName)}>
        {reducedMotionFallback ?? (
          <div
            aria-hidden="true"
            className="h-full min-h-40 w-full rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.025)]"
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-40 overflow-hidden", wrapperClassName)}>
      <Spline className={cn("h-full w-full", className)} {...props} />
    </div>
  );
}
