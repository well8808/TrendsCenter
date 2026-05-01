"use client";

import { useEffect, useRef } from "react";

interface GSAPScrollEntranceProps {
  children: React.ReactNode;
  className?: string;
  itemSelector?: string;
  stagger?: number;
  y?: number;
}

interface GSAPSectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function settleElement(element: HTMLElement) {
  element.style.opacity = "1";
  element.style.transform = "translateY(0)";
  element.style.willChange = "";
}

function canAnimateInBrowser() {
  return typeof window !== "undefined" && "IntersectionObserver" in window && "animate" in HTMLElement.prototype;
}

// Legacy name kept to avoid touching callers; simple reveals now avoid loading GSAP early.
export function GSAPScrollEntrance({
  children,
  className,
  itemSelector = ".gse-item",
  stagger = 0.055,
  y = 18,
}: GSAPScrollEntranceProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>(itemSelector));
    if (!items.length) return;

    if (!canAnimateInBrowser() || prefersReducedMotion()) {
      items.forEach(settleElement);
      return;
    }

    const safeY = Math.min(Math.max(y, 0), 18);
    const safeStagger = Math.min(Math.max(stagger, 0), 0.055);
    let hasRun = false;
    let animations: Animation[] = [];

    items.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = `translateY(${safeY}px)`;
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || hasRun) return;
        hasRun = true;

        animations = items.map((item, index) => {
          item.style.willChange = "transform, opacity";
          const animation = item.animate(
            [
              { opacity: 0, transform: `translateY(${safeY}px)` },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 420,
              delay: index * safeStagger * 1000,
              easing: ease,
              fill: "forwards",
            },
          );

          animation.onfinish = () => settleElement(item);
          return animation;
        });

        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.08,
      },
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      items.forEach((item) => {
        item.style.willChange = "";
      });
    };
  }, [itemSelector, stagger, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function GSAPSectionReveal({
  children,
  className,
  delay = 0,
  y = 18,
}: GSAPSectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!canAnimateInBrowser() || prefersReducedMotion()) {
      settleElement(element);
      return;
    }

    const safeY = Math.min(Math.max(y, 0), 18);
    const safeDelay = Math.min(Math.max(delay, 0), 0.2);
    let animation: Animation | undefined;

    element.style.opacity = "0";
    element.style.transform = `translateY(${safeY}px)`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        element.style.willChange = "transform, opacity";
        animation = element.animate(
          [
            { opacity: 0, transform: `translateY(${safeY}px)` },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 420,
            delay: safeDelay * 1000,
            easing: ease,
            fill: "forwards",
          },
        );
        animation.onfinish = () => settleElement(element);
        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.08,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      animation?.cancel();
      element.style.willChange = "";
    };
  }, [delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
