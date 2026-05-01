"use client";

import type { LenisProps } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type SmoothScrollProviderProps = {
  children: ReactNode;
  enabled?: boolean;
  root?: LenisProps["root"];
  options?: LenisProps["options"];
};

type ReactLenisComponent = ComponentType<LenisProps & { children: ReactNode }>;

export function SmoothScrollProvider({
  children,
  enabled = false,
  root = true,
  options,
}: SmoothScrollProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [ReactLenis, setReactLenis] = useState<ReactLenisComponent | null>(null);

  useEffect(() => {
    if (!enabled || prefersReducedMotion) {
      return;
    }

    let mounted = true;

    void import("lenis/react").then((mod) => {
      if (mounted) {
        setReactLenis(() => mod.ReactLenis as ReactLenisComponent);
      }
    });

    return () => {
      mounted = false;
    };
  }, [enabled, prefersReducedMotion]);

  if (!enabled || prefersReducedMotion || !ReactLenis) {
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
