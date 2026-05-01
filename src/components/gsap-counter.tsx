"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";

interface GSAPCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  pad?: number;
  format?: (n: number) => string;
  triggerOnScroll?: boolean;
}

const ease = [0.22, 1, 0.36, 1] as const;

// Legacy name kept to avoid touching callers; this now uses Motion for a lighter budget.
export function GSAPCounter({
  value,
  duration = 0.75,
  delay = 0,
  pad,
  format,
  triggerOnScroll = false,
}: GSAPCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const lastTextRef = useRef("");
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.35 });

  const formatValue = useCallback(
    (input: number) => {
      const rounded = Math.round(input);

      return format
        ? format(rounded)
        : pad
          ? String(rounded).padStart(pad, "0")
          : String(rounded);
    },
    [format, pad],
  );

  const writeValue = useCallback(
    (input: number) => {
      const next = formatValue(input);

      if (ref.current && lastTextRef.current !== next) {
        ref.current.textContent = next;
        lastTextRef.current = next;
      }
    },
    [formatValue],
  );

  useEffect(() => {
    if (triggerOnScroll && !isInView) {
      return;
    }

    if (prefersReducedMotion) {
      writeValue(value);
      return;
    }

    writeValue(0);

    const controls = animate(0, value, {
      duration: Math.min(Math.max(duration, 0.18), 0.8),
      delay: Math.min(Math.max(triggerOnScroll ? 0 : delay, 0), 0.24),
      ease,
      onUpdate: writeValue,
    });

    return () => controls.stop();
  }, [delay, duration, isInView, prefersReducedMotion, triggerOnScroll, value, writeValue]);

  return <span ref={ref}>{formatValue(0)}</span>;
}
