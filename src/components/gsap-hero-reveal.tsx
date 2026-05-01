"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface GSAPHeroRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Wraps children and animates each direct span.word child with a staggered
 * vertical reveal. Use GSAPWordSplit to render the text, then wrap in this.
 */
export function GSAPHeroReveal({ children, className, delay = 0.05 }: GSAPHeroRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".ghr-word", {
        y: 44,
        autoAlpha: 0,
        stagger: 0.07,
        duration: 0.72,
        ease: "power3.out",
        delay,
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

/**
 * Splits text into word spans for GSAPHeroReveal.
 * Preserves inline className on the outermost element.
 */
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
      {words.map((word, i) => (
        <span
          key={i}
          className="ghr-word inline-block"
          style={{ marginRight: i < words.length - 1 ? "0.28em" : undefined }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
