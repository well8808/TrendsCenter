"use client";

import { ReactLenis, type LenisProps } from "lenis/react";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type SmoothScrollProviderProps = {
  children: ReactNode;
  enabled?: boolean;
  root?: LenisProps["root"];
  options?: LenisProps["options"];
};

export function SmoothScrollProvider({
  children,
  enabled = false,
  root = true,
  options,
}: SmoothScrollProviderProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!enabled || prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root={root}
      options={{
        autoRaf: true,
        lerp: 0.09,
        duration: 1,
        ...options,
      }}
    >
      {children}
    </ReactLenis>
  );
}
