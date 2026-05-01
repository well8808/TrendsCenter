"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface GSAPTileRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Index controls stagger delay */
  index?: number;
}

/**
 * Animates a metric tile on mount with a 3D flip-up entrance:
 * starts rotated back on X axis, slides up, fades in.
 * Wraps the tile container so GSAP targets the wrapper directly.
 */
export function GSAPTileReveal({ children, className, index = 0 }: GSAPTileRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(ref.current, {
        y: 32,
        autoAlpha: 0,
        rotationX: 18,
        transformOrigin: "50% 100%",
        duration: 0.7,
        ease: "power3.out",
        delay: 0.22 + index * 0.08,
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ perspective: 800 }}>
      {children}
    </div>
  );
}
