"use client";

import { useEffect, useRef } from "react";

interface GSAPTileRevealProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

// Legacy name kept to avoid touching callers; tile reveal now stays inside the motion budget.
export function GSAPTileReveal({ children, className, index = 0 }: GSAPTileRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("animate" in HTMLElement.prototype)) {
      element.style.opacity = "1";
      element.style.transform = "translateY(0) rotateX(0)";
      return;
    }

    element.style.willChange = "transform, opacity";
    const animation = element.animate(
      [
        { opacity: 0, transform: "translateY(16px) rotateX(8deg)" },
        { opacity: 1, transform: "translateY(0) rotateX(0)" },
      ],
      {
        duration: 420,
        delay: Math.min(140 + index * 45, 320),
        easing: ease,
        fill: "forwards",
      },
    );

    animation.onfinish = () => {
      element.style.opacity = "1";
      element.style.transform = "translateY(0) rotateX(0)";
      element.style.willChange = "";
    };

    return () => {
      animation.cancel();
      element.style.willChange = "";
    };
  }, [index]);

  return (
    <div ref={ref} className={className} style={{ perspective: 800 }}>
      {children}
    </div>
  );
}
