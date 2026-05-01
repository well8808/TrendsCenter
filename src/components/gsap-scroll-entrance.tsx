"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface GSAPScrollEntranceProps {
  children: React.ReactNode;
  className?: string;
  /** Selector for the animatable items inside this container. Default: ".gse-item" */
  itemSelector?: string;
  stagger?: number;
  y?: number;
}

/**
 * Wraps a list and uses ScrollTrigger.batch() to reveal children
 * with a cinematic stagger as they enter the viewport.
 * Mark each child with className="gse-item" (or pass itemSelector).
 */
export function GSAPScrollEntrance({
  children,
  className,
  itemSelector = ".gse-item",
  stagger = 0.09,
  y = 28,
}: GSAPScrollEntranceProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const items = ref.current.querySelectorAll<HTMLElement>(itemSelector);
      if (!items.length) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set(items, { autoAlpha: 1, y: 0 });
        return;
      }

      // Set initial state immediately
      gsap.set(items, { autoAlpha: 0, y });

      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.62,
            ease: "power3.out",
            stagger,
            overwrite: true,
            onComplete: () => ScrollTrigger.refresh(),
          });
        },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

interface GSAPSectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/**
 * Single element scroll entrance — for section headings, panels, etc.
 * Wrap the element you want to reveal.
 */
export function GSAPSectionReveal({
  children,
  className,
  delay = 0,
  y = 20,
}: GSAPSectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set(ref.current, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.from(ref.current, {
        y,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power3.out",
        delay,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 90%",
          once: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
