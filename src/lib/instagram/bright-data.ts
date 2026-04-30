import type { Market } from "@prisma/client";

import { badRequest, serviceUnavailable } from "@/lib/http/errors";

export type BrightDataReelsMode = "reel_urls" | "profile_reels";

export interface BrightDataReelsInput {
  mode: BrightDataReelsMode;
  urls: string[];
  market: Market;
  maxPerProfile?: number;
  sourceTitle?: string;
}

export interface BrightDataStartedReelsCollection {
  provider: "bright_data";
  mode: BrightDataReelsMode;
  market: Market;
  snapshotId: string;
  sourceUrl: string;
  sourceTitle: string;
  urls: string[];
  maxPerProfile?: number;
}

export interface BrightDataCollectedReels {
  provider: "bright_data";
  mode: BrightDataReelsMode;
  market: Market;
  sourceUrl: string;
  sourceTitle: string;
  videos: NormalizedProviderVideo[];
}

export interface NormalizedProviderVideo {
  platformVideoId?: string;
  url?: string;
  title: string;
  caption?: string;
  postedAt?: string;
  collectedAt: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  creator?: {
    handle: string;
    displayName?: string;
    profileUrl?: string;
    followerCount?: number;
  };
  sound?: {
    title: string;
    soundUrl?: string;
    commercialRightsStatus?: string;
  };
  hashtags: string[];
  evidence: {
    title: string;
    url?: string;
    excerpt?: string;
    note: string;
  };
}

const brightDataTriggerEndpoint = "https://api.brightdata.com/datasets/v3/trigger";
const brightDataSnapshotEndpoint = "https://api.brightdata.com/datasets/v3/snapshot";
const brightDataProgressEndpoint = "https://api.brightdata.com/datasets/v3/progress";
const brightDataReelsDatasetId = "gd_lyclm20il4r5helnj";

function brightDataApiKey() {
  return process.env.BRIGHT_DATA_API_KEY?.trim();
}

function requireBrightDataApiKey() {
  const token = brightDataApiKey();

  if (!token) {
    throw serviceUnavailable("BRIGHT_DATA_API_KEY nao configurada.");
  }

  return token;
}

function brightDataDatasetId() {
  return process.env.BRIGHT_DATA_REELS_DATASET_ID?.trim() || brightDataReelsDatasetId;
}

function isInstagramUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "instagram.com" || url.hostname.endsWith(".instagram.com");
  } catch {
    return false;
  }
}

function isReelUrl(value: string) {
  try {
    const url = new URL(value);
    return isInstagramUrl(value) && url.pathname.includes("/reel/");
  } catch {
    return false;
  }
}

function cleanUrls(urls: string[], mode: BrightDataReelsMode) {
  const unique = Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean))).slice(0, 20);

  if (unique.length === 0) {
    throw badRequest("Informe ao menos um link do Instagram.");
  }

  const invalid = unique.filter((url) => (mode === "reel_urls" ? !isReelUrl(url) : !isInstagramUrl(url)));

  if (invalid.length > 0) {
    throw badRequest("Use apenas links validos do Instagram para esta coleta.", { invalid });
  }

  return unique;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) return Math.round(Number(value.trim()));
  return 0;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function hashtagsFrom(value: unknown, caption: string) {
  const fromArray = Array.isArray(value)
    ? value.map((item) => text(item).replace(/^#/, "")).filter(Boolean)
    : [];
  const fromCaption = Array.from(caption.matchAll(/#([\p{L}\p{N}_]+)/gu)).map((match) => match[1]);

  return Array.from(new Set([...fromArray, ...fromCaption])).slice(0, 12);
}

function firstSentence(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  return trimmed.length > 90 ? `${trimmed.slice(0, 87)}...` : trimmed;
}

function normalizeItem(raw: unknown, collectedAt: string): NormalizedProviderVideo | null {
  const item = record(raw);

  // Caption: Datasets API uses "description", newer responses use "caption"
  const caption = text(item.description) || text(item.caption);

  // URL: consistent across all response formats
  const reelUrl = text(item.url);

  // Handle: Datasets API uses "user_posted", some responses use "owner_username" or "username"
  const handle = (
    text(item.user_posted) ||
    text(item.owner_username) ||
    text(item.username)
  ).replace(/^@/, "");

  // Shortcode / ID: try all known field names across API versions
  const shortcode = text(item.shortcode);
  const platformVideoId =
    text(item.post_id) ||
    text(item.content_id) ||
    text(item.id) ||
    shortcode ||
    undefined;

  const title = firstSentence(caption) || (handle ? `Reel de @${handle}` : "Reel Instagram");

  // Views: Datasets API uses "video_play_count", fallback to generic view fields
  const views =
    numberValue(item.video_play_count) ||
    numberValue(item.views) ||
    numberValue(item.play_count) ||
    numberValue(item.video_views);

  // Comments: Datasets API uses "num_comments", newer responses use "comments"
  const comments = numberValue(item.num_comments) || numberValue(item.comments);

  // Date: Datasets API uses "date_posted", newer responses use "datetime" or "timestamp"
  const postedAt =
    text(item.date_posted) ||
    text(item.datetime) ||
    text(item.timestamp) ||
    undefined;

  // Profile URL: Datasets API uses "user_profile_url", newer uses "profile_url"
  const profileUrl =
    text(item.user_profile_url) ||
    text(item.profile_url) ||
    (handle ? `https://www.instagram.com/${handle}/` : undefined);

  // Follower count: consistent name but guard against string values
  const followerCount = numberValue(item.followers) || numberValue(item.follower_count) || undefined;

  if (!title || !reelUrl) {
    return null;
  }

  return {
    platformVideoId,
    url: reelUrl,
    title,
    caption: caption || undefined,
    postedAt,
    collectedAt,
    metrics: {
      views,
      likes: numberValue(item.likes),
      comments,
      shares: 0,
      saves: 0,
    },
    creator: handle
      ? {
          handle,
          profileUrl,
          followerCount: followerCount || undefined,
        }
      : undefined,
    sound: text(item.audio_url)
      ? {
          title: text(item.audio_title) || "Audio do Reel",
          soundUrl: text(item.audio_url),
          commercialRightsStatus: "nao verificado",
        }
      : undefined,
    hashtags: hashtagsFrom(item.hashtags, caption),
    evidence: {
      title: handle ? `Coleta Bright Data: @${handle}` : "Coleta Bright Data",
      url: reelUrl,
      excerpt: caption ? firstSentence(caption) : undefined,
      note: "Metadados coletados via Bright Data Instagram Reels API; midia nao foi baixada nem reprocessada.",
    },
  };
}

function parseJsonlBody(textBody: string): unknown[] {
  if (!textBody.trim()) return [];
  try {
    const parsed = JSON.parse(textBody);
    if (Array.isArray(parsed)) return parsed;
    if (parsed !== null && typeof parsed === "object") return [parsed];
  } catch {
    // not a JSON array/object — try JSONL (newline-delimited)
  }
  return textBody
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try { return [JSON.parse(line) as unknown]; } catch { return []; }
    });
}

function buildTriggerRequest(input: BrightDataReelsInput) {
  const urls = cleanUrls(input.urls, input.mode);
  const searchParams = new URLSearchParams({
    dataset_id: brightDataDatasetId(),
    include_errors: "true",
  });

  if (input.mode === "profile_reels") {
    searchParams.set("type", "discover_new");
    searchParams.set("discover_by", "url");
  }

  const maxPerProfile = Math.min(Math.max(input.maxPerProfile ?? 10, 1), 30);
  const body = {
    input: urls.map((url) => (
      input.mode === "profile_reels"
        ? { url, num_of_posts: maxPerProfile, start_date: "", end_date: "" }
        : { url }
    )),
  };

  return {
    url: `${brightDataTriggerEndpoint}?${searchParams.toString()}`,
    body,
    urls,
  };
}

function defaultSourceTitle(mode: BrightDataReelsMode) {
  return mode === "profile_reels"
    ? "Bright Data Reels - perfis monitorados"
    : "Bright Data Reels - links monitorados";
}

async function triggerSnapshot(triggerUrl: string, body: unknown, token: string) {
  const res = await fetch(triggerUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const responseText = await res.text();

  if (!res.ok) {
    let errBody: unknown = responseText.slice(0, 600);
    try { errBody = JSON.parse(responseText); } catch { /* keep raw */ }
    throw serviceUnavailable(
      `Bright Data retornou erro ${res.status} ao iniciar coleta.`,
      { brightDataStatus: res.status, body: errBody },
    );
  }

  let parsed: unknown;
  try { parsed = JSON.parse(responseText); } catch {
    throw serviceUnavailable("Bright Data retornou resposta invalida ao iniciar coleta.");
  }

  const snapshotId = (parsed as Record<string, unknown>).snapshot_id;
  if (typeof snapshotId !== "string") {
    throw serviceUnavailable("Bright Data nao retornou snapshot_id.", { body: parsed });
  }

  return snapshotId;
}

export async function startBrightDataReels(input: BrightDataReelsInput): Promise<BrightDataStartedReelsCollection> {
  const token = requireBrightDataApiKey();
  const request = buildTriggerRequest(input);
  const snapshotId = await triggerSnapshot(request.url, request.body, token);

  return {
    provider: "bright_data",
    mode: input.mode,
    market: input.market,
    snapshotId,
    sourceUrl: request.urls[0],
    sourceTitle: input.sourceTitle || defaultSourceTitle(input.mode),
    urls: request.urls,
    maxPerProfile: input.maxPerProfile,
  };
}

export async function fetchBrightDataSnapshotOnce(snapshotId: string) {
  const token = requireBrightDataApiKey();

  const progressRes = await fetch(`${brightDataProgressEndpoint}/${snapshotId}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });

  const progressText = await progressRes.text();

  if (!progressRes.ok) {
    let errBody: unknown = progressText.slice(0, 600);
    try { errBody = JSON.parse(progressText); } catch { /* keep raw */ }
    throw serviceUnavailable(
      `Bright Data retornou erro ${progressRes.status} ao checar progresso.`,
      { brightDataStatus: progressRes.status, snapshotId, body: errBody },
    );
  }

  let progress: Record<string, unknown> = {};
  try { progress = record(JSON.parse(progressText)); } catch { /* keep empty */ }
  const status = text(progress.status).toLowerCase();

  if (status === "failed") {
    throw serviceUnavailable("Bright Data marcou a coleta como falha.", { snapshotId, progress });
  }

  if (status !== "ready") {
    return { status: "pending" as const };
  }

  const downloadUrl = new URL(`${brightDataSnapshotEndpoint}/${snapshotId}`);
  downloadUrl.searchParams.set("format", "json");
  const res = await fetch(downloadUrl, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });

  const responseText = await res.text();

  if (res.status === 202) {
    return { status: "pending" as const };
  }

  if (!res.ok) {
    let errBody: unknown = responseText.slice(0, 600);
    try { errBody = JSON.parse(responseText); } catch { /* keep raw */ }
    throw serviceUnavailable(
      `Bright Data retornou erro ${res.status} ao buscar resultados.`,
      { brightDataStatus: res.status, snapshotId, body: errBody },
    );
  }

  return { status: "ready" as const, textBody: responseText };
}

// Graduated delays within Vercel's 120s maxDuration budget.
// Total wait: ~75s delays + 15s trigger + network overhead ≈ 100s.
const POLL_DELAYS_MS = [0, 4_000, 6_000, 7_000, 7_000, 7_000, 7_000, 7_000, 7_000, 7_000, 7_000, 7_000];

async function pollSnapshot(snapshotId: string, token: string) {
  for (let attempt = 0; attempt < POLL_DELAYS_MS.length; attempt++) {
    const delay = POLL_DELAYS_MS[attempt];
    if (delay > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }

    const res = await fetch(`${brightDataSnapshotEndpoint}/${snapshotId}`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 202) continue;

    const responseText = await res.text();

    if (!res.ok) {
      let errBody: unknown = responseText.slice(0, 600);
      try { errBody = JSON.parse(responseText); } catch { /* keep raw */ }
      throw serviceUnavailable(
        `Bright Data retornou erro ${res.status} ao buscar resultados.`,
        { brightDataStatus: res.status, snapshotId, body: errBody },
      );
    }

    return responseText;
  }

  throw serviceUnavailable(
    "Bright Data nao concluiu a coleta no tempo disponivel. Tente novamente em instantes.",
    { snapshotId },
  );
}

export function normalizeBrightDataReelsSnapshot(
  collection: Pick<BrightDataStartedReelsCollection, "mode" | "market" | "sourceUrl" | "sourceTitle">,
  textBody: string,
): BrightDataCollectedReels {
  const rawItems = parseJsonlBody(textBody);
  const errorItems = rawItems.filter((item) => record(item).error_code);
  const validItems = rawItems.filter((item) => !record(item).error_code);
  const collectedAt = new Date().toISOString();
  const videos = validItems
    .map((item) => normalizeItem(item, collectedAt))
    .filter((item): item is NormalizedProviderVideo => Boolean(item));

  if (videos.length === 0) {
    const deadPages = errorItems.filter((item) => record(item).error_code === "dead_page");
    if (deadPages.length > 0 && deadPages.length === errorItems.length) {
      throw badRequest(
        "Perfil sem Reels disponiveis no Bright Data. Tente um perfil maior ou com mais atividade recente.",
      );
    }
    if (errorItems.length > 0) {
      const firstCode = String(record(errorItems[0]).error_code ?? "unknown");
      throw badRequest(
        `Bright Data nao encontrou Reels validos (${firstCode}). Verifique os links e tente novamente.`,
      );
    }
    throw badRequest("A fonte respondeu, mas nenhum Reel valido foi encontrado.");
  }

  return {
    provider: "bright_data" as const,
    mode: collection.mode,
    market: collection.market,
    sourceUrl: collection.sourceUrl,
    sourceTitle: collection.sourceTitle,
    videos,
  };
}

export async function collectBrightDataReels(input: BrightDataReelsInput) {
  const token = requireBrightDataApiKey();
  const started = await startBrightDataReels(input);
  const textBody = await pollSnapshot(started.snapshotId, token);

  return normalizeBrightDataReelsSnapshot(started, textBody);
}
