import type { ConfidenceBand } from "@prisma/client";

const dayMs = 24 * 60 * 60 * 1000;

export interface VideoTrendScoreInput {
  viewCount: bigint;
  previousViewCount?: bigint;
  observedAt: Date;
  previousObservedAt?: Date;
  postedAt?: Date;
  snapshotCount: number;
  evidenceCount: number;
}

export interface VideoTrendScore {
  score: number;
  confidence: ConfidenceBand;
  growthViews: bigint;
  velocityScore: number;
  accelerationScore: number;
  recencyScore: number;
  consistencyScore: number;
  explanation: string;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function logScore(value: number, divisor: number) {
  if (value <= 0) {
    return 0;
  }

  return clamp((Math.log10(value + 1) / divisor) * 100);
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0.25, Math.abs(end.getTime() - start.getTime()) / dayMs);
}

function confidenceFromScore(score: number): ConfidenceBand {
  if (score >= 78) {
    return "HIGH";
  }

  if (score >= 52) {
    return "MEDIUM";
  }

  return "LOW";
}

export function calculateVideoTrendScore(input: VideoTrendScoreInput): VideoTrendScore {
  const previousViews = input.previousViewCount ?? BigInt(0);
  const growthViews = input.viewCount > previousViews ? input.viewCount - previousViews : BigInt(0);
  const velocityWindowStart = input.previousObservedAt ?? input.postedAt ?? input.observedAt;
  const velocityDays = daysBetween(velocityWindowStart, input.observedAt);
  const growthPerDay = Number(growthViews) / velocityDays;
  const lifetimeDays = daysBetween(input.postedAt ?? input.observedAt, input.observedAt);
  const lifetimeViewsPerDay = Number(input.viewCount) / lifetimeDays;
  const velocityScore = logScore(Math.max(growthPerDay, lifetimeViewsPerDay * 0.42), 5.35);
  const previousVelocity = input.previousViewCount && input.previousObservedAt
    ? Number(input.previousViewCount) / daysBetween(input.postedAt ?? input.previousObservedAt, input.previousObservedAt)
    : 0;
  const accelerationScore = clamp(((Math.max(growthPerDay, lifetimeViewsPerDay) - previousVelocity) / 8000) * 100);
  const ageHours = Math.max(0, (input.observedAt.getTime() - (input.postedAt ?? input.observedAt).getTime()) / (60 * 60 * 1000));
  const recencyScore = clamp(100 - ageHours / 1.8);
  const consistencyScore = clamp(input.snapshotCount * 18 + input.evidenceCount * 22);
  const score = clamp(
    velocityScore * 0.34 +
      accelerationScore * 0.24 +
      recencyScore * 0.22 +
      consistencyScore * 0.2,
  );

  return {
    score,
    confidence: confidenceFromScore(score),
    growthViews,
    velocityScore,
    accelerationScore,
    recencyScore,
    consistencyScore,
    explanation: `Score v0.1 pondera crescimento, velocidade, aceleração, recência e consistência de snapshots/evidências.`,
  };
}
