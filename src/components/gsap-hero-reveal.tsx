"use client";

import { useEffect, useRef } from "react";

interface GSAPHeroRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

// Legacy name kept to avoid touching callers; word reveal no longer imports GSAP eagerly.
export function GSAPHeroReveal({ children, className, delay = 0.05 }: GSAPHeroRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const words = Array.from(root.querySelectorAll<HTMLElement>(".ghr-word"));
    if (!words.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("animate" in HTMLElement.prototype)) {
      words.forEach((word) => {
        word.style.transform = "translateY(0)";
      });
      return;
    }

    const safeDelay = Math.min(Math.max(delay, 0), 0.16);
    const animations = words.map((word, index) => {
      word.style.willChange = "transform";
      const animation = word.animate(
        [
          { transform: "translateY(18px)" },
          { transform: "translateY(0)" },
        ],
        {
          duration: 420,
          delay: (safeDelay + index * 0.045) * 1000,
          easing: ease,
          fill: "forwards",
        },
      );

      animation.onfinish = () => {
        word.style.transform = "translateY(0)";
        word.style.willChange = "";
      };

      return animation;
    });

    return () => {
      animations.forEach((animation) => animation.cancel());
      words.forEach((word) => {
        word.style.willChange = "";
      });
    };
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function GSAPWordSplit({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="ghr-word inline-block"
          style={{ marginRight: index < words.length - 1 ? "0.28em" : undefined }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
