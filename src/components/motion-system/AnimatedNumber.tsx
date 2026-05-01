"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useMemo } from "react";

type AnimatedNumberProps = {
  value: number;
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumIntegerDigits?: number;
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
  format,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(prefersReducedMotion ? value : from);
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
    if (prefersReducedMotion) {
      motionValue.set(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [delay, duration, motionValue, prefersReducedMotion, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
