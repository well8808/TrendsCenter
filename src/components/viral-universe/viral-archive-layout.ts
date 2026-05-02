import {
  clamp,
  marketColor,
  normalizeMetric,
  scoreColor,
  seededNoise,
  stableSeed,
  type ViralReelNode,
  type ViralSignalNode,
  type ViralUniverseStats,
} from "@/components/viral-universe/viral-scene-quality";

export interface ViralArchiveArtifact {
  id: string;
  index: number;
  title: string;
  market: string;
  score: number;
  views: number;
  growth: number;
  velocity: number;
  evidenceCount: number;
  sourceLabel?: string;
  thumbnailUrl?: string;
  posterUrl?: string;
  videoUrl?: string;
  hasRealMedia: boolean;
  mediaSourceField?: string;
  mediaConfidence?: string;
  fallbackReason?: string;
  creator?: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  glow: number;
  accent: string;
  marketAccent: string;
  phase: number;
}

export interface ViralArchiveSignal {
  id: string;
  index: number;
  title: string;
  market: string;
  score: number;
  priority: string;
  evidenceCount: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  accent: string;
  phase: number;
}

const ARCHIVE_COLUMNS = 7;

export function buildArchiveArtifacts({
  reels,
  stats,
  limit,
}: {
  reels: ViralReelNode[];
  stats: ViralUniverseStats;
  limit: number;
}): ViralArchiveArtifact[] {
  const ordered = reels
    .slice()
    .sort((a, b) => b.score - a.score || b.views - a.views)
    .slice(0, limit);
  const maxViews = Math.max(1, ...ordered.map((reel) => reel.views), stats.avgScore);
  const sparseBoost = ordered.length <= 1 ? 1.15 : ordered.length <= 3 ? 0.42 : 0;

  return ordered.map((reel, index) => {
    const seed = stableSeed(reel.id);
    const row = Math.floor(index / ARCHIVE_COLUMNS);
    const col = index % ARCHIVE_COLUMNS;
    const centeredCol = col - (Math.min(ARCHIVE_COLUMNS, ordered.length) - 1) / 2;
    const scorePower = clamp(reel.score / 100, 0.08, 1);
    const viewPower = normalizeMetric(reel.views, maxViews);
    const growthPower = clamp(reel.growth / Math.max(reel.views, 1), 0, 0.35);
    const shelfBend = Math.sin(centeredCol * 0.28) * 0.24;
    const rowDepth = row * 0.46;

    return {
      id: reel.id,
      index,
      title: reel.title,
      market: reel.market,
      score: reel.score,
      views: reel.views,
      growth: reel.growth,
      velocity: reel.velocity,
      evidenceCount: reel.evidenceCount,
      sourceLabel: reel.sourceLabel,
      thumbnailUrl: reel.thumbnailUrl,
      posterUrl: reel.media?.posterUrl ?? reel.thumbnailUrl,
      videoUrl: reel.media?.videoUrl,
      hasRealMedia: Boolean(reel.media?.hasRealMedia || reel.thumbnailUrl),
      mediaSourceField: reel.media?.sourceField ?? reel.media?.mediaSourceField,
      mediaConfidence: reel.media?.mediaConfidence,
      fallbackReason: reel.media?.fallbackReason,
      creator: reel.creator,
      x: centeredCol * 0.52 + (seededNoise(seed, 7) - 0.5) * 0.12,
      y: 0.32 - row * 0.62 + scorePower * 0.12,
      z: -0.18 - rowDepth + shelfBend + seededNoise(seed, 11) * 0.12,
      rotationY: -centeredCol * 0.1 + (seededNoise(seed, 13) - 0.5) * 0.16,
      rotationZ: (seededNoise(seed, 17) - 0.5) * 0.045,
      scale: 0.88 + sparseBoost + scorePower * 0.36 + viewPower * 0.2,
      glow: 0.2 + scorePower * 0.48 + growthPower * 0.5,
      accent: scoreColor(reel.score),
      marketAccent: marketColor(reel.market),
      phase: seededNoise(seed, 23) * Math.PI * 2,
    };
  });
}

export function buildArchiveSignals({
  signals,
  limit,
}: {
  signals: ViralSignalNode[];
  limit: number;
}): ViralArchiveSignal[] {
  const ordered = signals
    .slice()
    .sort((a, b) => b.score - a.score || b.evidenceCount - a.evidenceCount)
    .slice(0, limit);

  return ordered.map((signal, index) => {
    const seed = stableSeed(signal.id);
    const scorePower = clamp(signal.score / 100, 0.08, 1);
    const side = index % 2 === 0 ? 1 : -1;

    return {
      id: signal.id,
      index,
      title: signal.title,
      market: signal.market,
      score: signal.score,
      priority: signal.priority,
      evidenceCount: signal.evidenceCount,
      x: side * (1.42 + Math.floor(index / 2) * 0.22),
      y: 0.48 - index * 0.24,
      z: 0.2 + seededNoise(seed, 5) * 0.32,
      scale: 0.62 + scorePower * 0.34,
      accent: scoreColor(signal.score),
      phase: seededNoise(seed, 29) * Math.PI * 2,
    };
  });
}

export function archiveDensity(stats: ViralUniverseStats) {
  return clamp((stats.reels + stats.signals * 1.4 + stats.evidence * 0.08) / 36, 0.15, 1);
}
