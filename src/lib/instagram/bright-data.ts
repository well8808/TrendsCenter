import type { Market } from "@prisma/client";

import { badRequest, serviceUnavailable } from "@/lib/http/errors";

export type BrightDataReelsMode = "reel_urls" | "profile_reels";

export interface BrightDataReelsInput {
  mode: BrightDataReelsMode;
  urls: string[];
  market: Market;
  maxPerProfile?: number;
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

const brightDataEndpoint = "https://api.brightdata.com/datasets/v3/scrape";
const brightDataReelsDatasetId = "gd_lyclm20il4r5helnj";

function brightDataApiKey() {
  return process.env.BRIGHT_DATA_API_KEY?.trim();
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
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
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
  const caption = text(item.description) || text(item.caption);
  const reelUrl = text(item.url);
  const handle = text(item.user_posted).replace(/^@/, "");
  const shortcode = text(item.shortcode);
  const title = firstSentence(caption) || (handle ? `Reel de @${handle}` : "Reel Instagram");
  const views = numberValue(item.video_play_count) || numberValue(item.views);

  if (!title || !reelUrl) {
    return null;
  }

  return {
    platformVideoId: text(item.post_id) || text(item.content_id) || shortcode || undefined,
    url: reelUrl,
    title,
    caption: caption || undefined,
    postedAt: text(item.date_posted) || undefined,
    collectedAt,
    metrics: {
      views,
      likes: numberValue(item.likes),
      comments: numberValue(item.num_comments),
      shares: 0,
      saves: 0,
    },
    creator: handle
      ? {
          handle,
          profileUrl: text(item.user_profile_url) || `https://www.instagram.com/${handle}/`,
          followerCount: numberValue(item.followers) || undefined,
        }
      : undefined,
    sound: text(item.audio_url)
      ? {
          title: "Audio do Reel",
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

function buildRequest(input: BrightDataReelsInput) {
  const urls = cleanUrls(input.urls, input.mode);
  const searchParams = new URLSearchParams({
    dataset_id: brightDataDatasetId(),
    include_errors: "true",
  });

  if (input.mode === "profile_reels") {
    searchParams.set("type", "discover_new");
    searchParams.set("discover_by", "url_all_reels");
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
    url: `${brightDataEndpoint}?${searchParams.toString()}`,
    body,
    urls,
  };
}

export async function collectBrightDataReels(input: BrightDataReelsInput) {
  const token = brightDataApiKey();

  if (!token) {
    throw serviceUnavailable("BRIGHT_DATA_API_KEY nao configurada.");
  }

  const request = buildRequest(input);
  const response = await fetch(request.url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(request.body),
    signal: AbortSignal.timeout(75_000),
  });
  const textBody = await response.text();
  let parsed: unknown = null;

  try {
    parsed = textBody ? JSON.parse(textBody) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw serviceUnavailable("Bright Data nao retornou uma coleta valida.", {
      status: response.status,
      body: typeof parsed === "object" ? parsed : textBody.slice(0, 500),
    });
  }

  const rawItems = Array.isArray(parsed) ? parsed : [];
  const collectedAt = new Date().toISOString();
  const videos = rawItems
    .map((item) => normalizeItem(item, collectedAt))
    .filter((item): item is NormalizedProviderVideo => Boolean(item));

  if (videos.length === 0) {
    throw badRequest("A fonte respondeu, mas nenhum Reel valido foi encontrado.");
  }

  return {
    provider: "bright_data" as const,
    mode: input.mode,
    market: input.market,
    sourceUrl: request.urls[0],
    sourceTitle: input.mode === "profile_reels" ? "Bright Data Reels - perfis monitorados" : "Bright Data Reels - links monitorados",
    videos,
  };
}
