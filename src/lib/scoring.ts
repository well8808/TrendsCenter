import type { ConfidenceBand, ScoreInput, TrendScore } from "@/lib/types";

const weights = {
  velocity7d: 0.22,
  acceleration: 0.14,
  brazilFit: 0.18,
  usTransferability: 0.1,
  formatRepeatability: 0.1,
  creatorSignal: 0.08,
  audioCommercialUsable: 0.07,
  revivalStrength: 0.07,
  evidenceQuality: 0.04,
} as const;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function confidenceBand(score: number): ConfidenceBand {
  if (score >= 78) {
    return "high";
  }

  if (score >= 52) {
    return "medium";
  }

  return "low";
}

export function calculateTrendScore(input: ScoreInput): TrendScore {
  const weighted =
    input.velocity7d * weights.velocity7d +
    input.acceleration * weights.acceleration +
    input.brazilFit * weights.brazilFit +
    input.usTransferability * weights.usTransferability +
    input.formatRepeatability * weights.formatRepeatability +
    input.creatorSignal * weights.creatorSignal +
    input.audioCommercialUsable * weights.audioCommercialUsable +
    input.revivalStrength * weights.revivalStrength +
    input.evidenceQuality * weights.evidenceQuality;

  const value = clampScore(weighted - input.riskPenalty);
  const band = confidenceBand(value);

  return {
    value,
    band,
    label: band === "high" ? "alta confianca" : band === "medium" ? "observar" : "fraco",
    riskAdjusted: input.riskPenalty > 0,
  };
}

export function formatScore(score: TrendScore) {
  return `${score.value}/100`;
}
