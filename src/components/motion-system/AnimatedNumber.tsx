"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useMemo } from "react";

type AnimatedNumberProps = {
  value: number | null | undefined;
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumIntegerDigits?: number;
  fallback?: string;
  format?: (value: number) => string;
};

export function AnimatedNumber({
  value,
  from = 0,
  duration = 0.8,
  delay = 0,
  className,
  locale = "pt-BR",
  maximumFractionDigits = 0,
  minimumIntegerDigits,
  fallback = "-",
  format,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const numericValue = typeof value === "number" && Number.isFinite(value) ? value : null;
  const motionValue = useMotionValue(prefersReducedMotion ? numericValue ?? from : from);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits,
        minimumIntegerDigits,
      }),
    [locale, maximumFractionDigits, minimumIntegerDigits],
  );
  const display = useTransform(motionValue, (latest) =>
    format ? format(latest) : formatter.format(latest),
  );

  useEffect(() => {
    if (numericValue === null) {
      motionValue.set(from);
      return;
    }

    if (prefersReducedMotion) {
      motionValue.set(numericValue);
      return;
    }

    const controls = animate(motionValue, numericValue, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [delay, duration, from, motionValue, numericValue, prefersReducedMotion]);

  if (numericValue === null) {
    return <span className={className}>{fallback}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}
