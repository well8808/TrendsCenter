"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from "motion/react";

import { cn } from "@/lib/utils";

type MagneticButtonProps = HTMLMotionProps<"button"> & {
  strength?: number;
};

export function MagneticButton({
  children,
  className,
  strength = 0.18,
  onPointerMove,
  onPointerLeave,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 22, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 22, mass: 0.4 });

  return (
    <motion.button
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={prefersReducedMotion ? undefined : { x: springX, y: springY }}
      onPointerMove={(event) => {
        onPointerMove?.(event);

        if (prefersReducedMotion) return;

        const bounds = ref.current?.getBoundingClientRect();
        if (!bounds) return;

        x.set((event.clientX - bounds.left - bounds.width / 2) * strength);
        y.set((event.clientY - bounds.top - bounds.height / 2) * strength);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        x.set(0);
        y.set(0);
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
