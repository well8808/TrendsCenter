"use client";

import { useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

export function useCardTilt(maxTilt = 7) {
  const ref = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring physics for smooth, natural feel
  const springConfig = { stiffness: 180, damping: 22, mass: 0.6 };
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);

  const rotateX = useTransform(springY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Highlight follows mouse — creates a "light source" sheen
  const glowX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"]);

  // Scale up slightly on hover
  const scale = useSpring(1, { stiffness: 200, damping: 24 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    scale.set(1.02);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
    scale.set(1);
  }

  return {
    ref,
    style: { rotateX, rotateY, scale, transformPerspective: 900 },
    glowX,
    glowY,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
