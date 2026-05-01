"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

import { cn } from "@/lib/utils";

type MotionCardProps = HTMLMotionProps<"div"> & {
  interactive?: boolean;
  lift?: number;
};

export function MotionCard({
  children,
  className,
  interactive = true,
  lift = 3,
  transition,
  ...props
}: MotionCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const hover = interactive && !prefersReducedMotion ? { y: -lift } : undefined;

  return (
    <motion.div
      className={cn("min-w-0 rounded-[var(--radius-lg)]", className)}
      whileHover={hover}
      transition={transition ?? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
