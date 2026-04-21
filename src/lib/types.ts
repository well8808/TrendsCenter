export type Market = "BR" | "US";

export type DataOrigin = "OFFICIAL" | "OWNED" | "MANUAL" | "DEMO";

export type SourceKind =
  | "CREATIVE_CENTER_TRENDS"
  | "TOP_ADS"
  | "KEYWORD_INSIGHTS"
  | "CREATIVE_INSIGHTS"
  | "AUDIENCE_INSIGHTS"
  | "TIKTOK_ONE"
  | "MARKET_SCOPE"
  | "DISPLAY_API"
  | "COMMERCIAL_MUSIC_LIBRARY"
  | "OWNED_UPLOAD"
  | "MANUAL_RESEARCH"
  | "DEMO";

export type SignalType =
  | "AUDIO"
  | "FORMAT"
  | "HASHTAG"
  | "CREATOR"
  | "REVIVAL"
  | "US_TO_BR";

export type ConfidenceBand = "low" | "medium" | "high";

export type WorkspaceState = "demo" | "loading" | "empty" | "error";

export interface SourceRecord {
  id: string;
  title: string;
  kind: SourceKind;
  origin: DataOrigin;
  url?: string;
  collectedAt: string;
  market: Market;
  confidence: ConfidenceBand;
  evidenceCount: number;
}

export interface ScoreInput {
  velocity7d: number;
  acceleration: number;
  brazilFit: number;
  usTransferability: number;
  formatRepeatability: number;
  creatorSignal: number;
  audioCommercialUsable: number;
  revivalStrength: number;
  evidenceQuality: number;
  riskPenalty: number;
}

export interface TrendScore {
  value: number;
  band: ConfidenceBand;
  label: string;
  riskAdjusted: boolean;
}

export interface TrendSignal {
  id: string;
  title: string;
  summary: string;
  type: SignalType;
  market: Market;
  audience: string;
  status: "rising" | "returning" | "watch" | "blocked";
  origin: DataOrigin;
  scoreInput: ScoreInput;
  score: TrendScore;
  source: SourceRecord;
  tags: string[];
}

export interface MetricTile {
  label: string;
  value: string;
  delta: string;
  tone: "acid" | "aqua" | "coral" | "gold";
}
