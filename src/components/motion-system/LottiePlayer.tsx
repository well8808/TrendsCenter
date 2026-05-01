"use client";

import { DotLottieReact, type DotLottieReactProps } from "@lottiefiles/dotlottie-react";
import Lottie, { type LottieComponentProps } from "lottie-react";
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
