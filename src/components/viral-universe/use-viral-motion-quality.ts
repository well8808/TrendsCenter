"use client";

import { useEffect, useState } from "react";

import { qualityFromViewport, type ViralSceneQuality } from "@/components/viral-universe/viral-scene-quality";

function currentWidth() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth;
}

function currentDpr() {
  if (typeof window === "undefined") return 1;
  return window.devicePixelRatio || 1;
}

export function useViralMotionQuality(reducedMotion: boolean): ViralSceneQuality {
  const [viewport, setViewport] = useState(() => ({
    width: currentWidth(),
    dpr: currentDpr(),
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = 0;
    const syncViewport = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setViewport({
          width: window.innerWidth,
          dpr: window.devicePixelRatio || 1,
        });
      });
    };

    syncViewport();
    window.addEventListener("resize", syncViewport, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  return qualityFromViewport({
    width: viewport.width,
    devicePixelRatio: viewport.dpr,
    reducedMotion,
  });
}
