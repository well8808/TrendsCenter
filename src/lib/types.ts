export type Market = "BR" | "US";

export type DataOrigin = "OFFICIAL" | "OWNED" | "MANUAL" | "DEMO";

export type SourceKind =
  | "INSTAGRAM_REELS_TRENDS"
  | "INSTAGRAM_GRAPH_API"
  | "INSTAGRAM_PROFESSIONAL_DASHBOARD"
  | "META_AD_LIBRARY"
  | "META_BUSINESS_SUITE"
  | "META_CREATOR_MARKETPLACE"
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

export type WorkspaceState = "ready" | "loading" | "empty" | "error";

export type SignalPriority = "now" | "next" | "watch" | "hold";

export type RiskLevel = "low" | "medium" | "high";

export type TrendStage = "emerging" | "accelerating" | "proving" | "revival" | "monitor";

export type TrendSourcePlatform = "instagram";

export type TrendSourceType =
  | "reel"
  | "audio"
  | "creator"
  | "hashtag"
  | "account_insights"
  | "meta_ad_library"
  | "manual";

export type TrendSourceStatus = "active" | "paused" | "error";

export interface TrendSourceRecord {
  id: string;
  platform: TrendSourcePlatform;
  title: string;
  sourceType: TrendSourceType;
  sourceUrl: string;
  region: string;
  category: string;
  status: TrendSourceStatus;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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
  coverage?: string;
  freshness?: string;
  gap?: string;
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

export interface EvidencePoint {
  id: string;
  title: string;
  sourceLabel: string;
  quality: ConfidenceBand;
  timestamp: string;
  note: string;
}

export interface SignalHistoryItem {
  label: string;
  value: string;
  tone: "acid" | "aqua" | "coral" | "gold" | "violet";
}

export interface TrendSignal {
  id: string;
  title: string;
  summary: string;
  type: SignalType;
  market: Market;
  audience: string;
  status: "rising" | "returning" | "watch" | "blocked";
  priority: SignalPriority;
  riskLevel: RiskLevel;
  stage: TrendStage;
  strength: number;
  trendWindow: string;
  decision: string;
  nextAction: string;
  saved: boolean;
  origin: DataOrigin;
  scoreInput: ScoreInput;
  score: TrendScore;
  source: SourceRecord;
  tags: string[];
  evidence: EvidencePoint[];
  history: SignalHistoryItem[];
  scoreDrivers: string[];
}

export interface MetricTile {
  label: string;
  value: string;
  delta: string;
  tone: "acid" | "aqua" | "coral" | "gold";
}
