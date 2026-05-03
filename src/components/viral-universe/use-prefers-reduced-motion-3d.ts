"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

const subscribe = () => () => {};

function useClientReady() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function usePrefersReducedMotion3D() {
  const clientReady = useClientReady();
  const prefersReducedMotion = useReducedMotion();

  return {
    clientReady,
    prefersReducedMotion: Boolean(prefersReducedMotion),
  };
}
