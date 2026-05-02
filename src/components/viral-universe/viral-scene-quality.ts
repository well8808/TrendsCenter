export type ViralUniverseMode = "library" | "signal-room";

export type ViralMarket = "BR" | "US" | string;

export interface ViralReelNode {
  id: string;
  title: string;
  market: ViralMarket;
  score: number;
  views: number;
  growth: number;
  velocity: number;
  evidenceCount: number;
  creator?: string;
  sourceLabel?: string;
  tags?: string[];
}

export interface ViralSignalNode {
  id: string;
  title: string;
  market: ViralMarket;
  score: number;
  priority: string;
  confidence: string;
  evidenceCount: number;
  sourceLabel?: string;
  decision?: string;
}

export interface ViralUniverseStats {
  reels: number;
  signals: number;
  sources: number;
  evidence: number;
  avgScore: number;
}

export interface ViralSceneQuality {
  canRender3d: boolean;
  dpr: number;
  reelLimit: number;
  signalLimit: number;
  particleCount: number;
  antialias: boolean;
  cameraDrift: number;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeMetric(value: number, max: number) {
  if (max <= 0) return 0;
  return clamp(value / max, 0, 1);
}

export function stableSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

export function seededNoise(seed: number, offset = 0) {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function marketColor(market: ViralMarket) {
  if (market === "BR") return "#ed4956";
  if (market === "US") return "#58c8be";
  return "#e6b765";
}

export function scoreColor(score: number) {
  if (score >= 78) return "#ed4956";
  if (score >= 52) return "#e6b765";
  return "#58c8be";
}

export function qualityFromViewport({
  width,
  devicePixelRatio,
  reducedMotion,
}: {
  width: number;
  devicePixelRatio: number;
  reducedMotion: boolean;
}): ViralSceneQuality {
  if (reducedMotion) {
    return {
      canRender3d: false,
      dpr: 1,
      reelLimit: 0,
      signalLimit: 0,
      particleCount: 0,
      antialias: false,
      cameraDrift: 0,
    };
  }

  const mobile = width < 760;
  const compact = width < 1120;

  return {
    canRender3d: !mobile,
    dpr: clamp(devicePixelRatio || 1, 1, compact ? 1.2 : 1.45),
    reelLimit: compact ? 12 : 24,
    signalLimit: compact ? 8 : 14,
    particleCount: compact ? 48 : 88,
    antialias: !compact,
    cameraDrift: compact ? 0.18 : 0.32,
  };
}

export function summarizeUniverse({
  reels,
  signals,
  stats,
}: {
  reels: ViralReelNode[];
  signals: ViralSignalNode[];
  stats: ViralUniverseStats;
}) {
  const maxViews = Math.max(1, ...reels.map((reel) => reel.views));
  const maxScore = Math.max(stats.avgScore, ...reels.map((reel) => reel.score), ...signals.map((signal) => signal.score), 1);
  const brReels = reels.filter((reel) => reel.market === "BR").length;

  return {
    maxViews,
    maxScore,
    brReels,
    hasSignals: signals.length > 0,
    hasReels: reels.length > 0,
  };
}
