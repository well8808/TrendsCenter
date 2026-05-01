"use client";

import { useRef, useState } from "react";
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
  const objRef = useRef({ val: 0 });
  const [display, setDisplay] = useState(0);

  useGSAP(
    () => {
      const obj = objRef.current;
      obj.val = 0;

      const tween = gsap.to(obj, {
        val: value,
        duration,
        delay: triggerOnScroll ? 0 : delay,
        ease: "power2.out",
        onUpdate: () => setDisplay(Math.round(obj.val)),
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
    { scope: ref, dependencies: [value] },
  );

  const text = format
    ? format(display)
    : pad
    ? String(display).padStart(pad, "0")
    : String(display);

  return <span ref={ref}>{text}</span>;
}
