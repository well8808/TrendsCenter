"use client";

import dynamic from "next/dynamic";
import type { DotLottieReactProps } from "@lottiefiles/dotlottie-react";
import type { LottieComponentProps } from "lottie-react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type JsonLottieProps = {
  kind: "json";
  className?: string;
  ariaLabel?: string;
} & LottieComponentProps;

type DotLottieProps = {
  kind: "dotlottie";
  className?: string;
  ariaLabel?: string;
} & DotLottieReactProps;

type LottiePlayerProps = JsonLottieProps | DotLottieProps;

const DotLottieReact = dynamic<DotLottieReactProps>(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false, loading: () => null },
);

const Lottie = dynamic<LottieComponentProps>(
  () => import("lottie-react").then((mod) => mod.default),
  { ssr: false, loading: () => null },
);

export function LottiePlayer(props: LottiePlayerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (props.kind === "json") {
    const { kind, className, ariaLabel, ...lottieProps } = props;
    void kind;
    const autoplay = prefersReducedMotion ? false : lottieProps.autoplay;
    const loop = prefersReducedMotion ? false : lottieProps.loop;

    return (
      <div className={cn("relative", className)} aria-label={ariaLabel} role={ariaLabel ? "img" : undefined}>
        <Lottie {...lottieProps} autoplay={autoplay} loop={loop} />
      </div>
    );
  }

  const { kind, className, ariaLabel, ...dotLottieProps } = props;
  void kind;
  const autoplay = prefersReducedMotion ? false : dotLottieProps.autoplay;
  const loop = prefersReducedMotion ? false : dotLottieProps.loop;

  return (
    <div className={cn("relative", className)} aria-label={ariaLabel} role={ariaLabel ? "img" : undefined}>
      <DotLottieReact {...dotLottieProps} autoplay={autoplay} loop={loop} />
    </div>
  );
}
