"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface GSAPCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  pad?: number;
  format?: (n: number) => string;
  triggerOnScroll?: boolean;
}

/**
 * Counts up from 0 to `value` with GSAP precision.
 * Optionally triggers only when scrolled into view.
 */
export function GSAPCounter({
  value,
  duration = 1.1,
  delay = 0,
  pad,
  format,
  triggerOnScroll = false,
}: GSAPCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const lastTextRef = useRef("");

  function formatValue(input: number) {
    const rounded = Math.round(input);

    return format
      ? format(rounded)
      : pad
        ? String(rounded).padStart(pad, "0")
        : String(rounded);
  }

  function writeValue(input: number) {
    const next = formatValue(input);

    if (ref.current && lastTextRef.current !== next) {
      ref.current.textContent = next;
      lastTextRef.current = next;
    }
  }

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        writeValue(value);
        return;
      }

      const obj = { val: 0 };
      writeValue(0);

      const tween = gsap.to(obj, {
        val: value,
        duration,
        delay: triggerOnScroll ? 0 : delay,
        ease: "power2.out",
        onUpdate: () => writeValue(obj.val),
        onComplete: () => writeValue(value),
        scrollTrigger: triggerOnScroll
          ? {
              trigger: ref.current,
              start: "top 90%",
              once: true,
            }
          : undefined,
      });

      return () => tween.kill();
    },
    { scope: ref, dependencies: [value, duration, delay, pad, format, triggerOnScroll] },
  );

  return <span ref={ref}>{formatValue(0)}</span>;
}
