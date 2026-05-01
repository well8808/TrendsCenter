"use client";

import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  once?: boolean;
  viewportAmount?: number;
};

export function Reveal({
  children,
  delay = 0,
  y = 18,
  once = true,
  viewportAmount = 0.24,
  transition,
  ...props
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants: Variants = prefersReducedMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0 },
      };

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: viewportAmount }}
      variants={variants}
      transition={transition ?? { duration: 0.42, delay, ease }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
