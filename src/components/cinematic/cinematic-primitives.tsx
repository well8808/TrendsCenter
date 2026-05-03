"use client";

import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";
import type { ReactNode } from "react";

import { AnimatedNumber } from "@/components/motion-system/AnimatedNumber";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function CinematicPageShell({
  children,
  className,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("min-w-0", className)}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.34, ease }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CinematicSection({
  children,
  className,
  delay = 0,
  y = 16,
  ...props
}: HTMLMotionProps<"section"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const variants: Variants = prefersReducedMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, delay, ease, staggerChildren: 0.055, delayChildren: 0.02 },
        },
      };

  return (
    <motion.section
      className={cn("min-w-0", className)}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function CinematicReveal({
  children,
  className,
  delay = 0,
  y = 12,
  ...props
}: HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("min-w-0", className)}
      initial={prefersReducedMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.36, delay: prefersReducedMotion ? 0 : delay, ease }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CinematicCard({
  children,
  className,
  interactive = true,
  ...props
}: HTMLMotionProps<"div"> & {
  children: ReactNode;
  interactive?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.016))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        className,
      )}
      whileHover={interactive && !prefersReducedMotion ? { y: -2, scale: 1.004 } : undefined}
      transition={{ duration: 0.18, ease }}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(237,73,86,0.34)] to-transparent"
      />
      {children}
    </motion.div>
  );
}

export function CinematicMetric({
  label,
  value,
  suffix,
  tone = "foreground",
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "foreground" | "hot" | "gold" | "aqua" | "muted";
  delay?: number;
}) {
  const toneClass = {
    foreground: "text-[color:var(--foreground)]",
    hot: "text-[color:var(--hot)]",
    gold: "text-[color:var(--gold)]",
    aqua: "text-[color:var(--aqua)]",
    muted: "text-[color:var(--muted-strong)]",
  }[tone];

  return (
    <div className="rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className={cn("metric-number mt-1 text-xl font-semibold", toneClass)}>
        <AnimatedNumber value={value} duration={0.38} delay={delay} />
        {suffix ? <span className="ml-1 text-xs text-[color:var(--muted)]">{suffix}</span> : null}
      </p>
    </div>
  );
}
