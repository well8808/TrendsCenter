export type InstagramTrendSourceType =
  | "reel"
  | "audio"
  | "creator"
  | "hashtag"
  | "account_insights"
  | "meta_ad_library"
  | "manual";
export type InstagramTrendSourceStatus = "active" | "paused" | "error";

export interface InstagramTrendSourceDefinition {
  id: string;
  platform: "instagram";
  title: string;
  sourceType: InstagramTrendSourceType;
  sourceUrl: string;
  region: string;
  category: string;
  status: InstagramTrendSourceStatus;
}

const allowedInstagramHosts = new Set([
  "instagram.com",
  "www.instagram.com",
  "business.instagram.com",
  "business.facebook.com",
  "facebook.com",
  "www.facebook.com",
  "developers.facebook.com",
]);

export const instagramOfficialSources = [
  {
    id: "instagram-reels-official-surface",
    platform: "instagram",
    title: "Instagram Reels official surface",
    sourceType: "reel",
    sourceUrl: "https://www.instagram.com/reels/",
    region: "global",
    category: "reels",
    status: "active",
  },
  {
    id: "instagram-professional-dashboard-insights",
    platform: "instagram",
    title: "Instagram Professional Dashboard / Insights",
    sourceType: "account_insights",
    sourceUrl: "https://business.instagram.com/",
    region: "global",
    category: "account_insights",
    status: "active",
  },
  {
    id: "instagram-graph-api",
    platform: "instagram",
    title: "Instagram Graph API",
    sourceType: "account_insights",
    sourceUrl: "https://developers.facebook.com/docs/instagram-platform/",
    region: "global",
    category: "official_api",
    status: "active",
  },
  {
    id: "meta-ad-library-instagram",
    platform: "instagram",
    title: "Meta Ad Library - Instagram placements",
    sourceType: "meta_ad_library",
    sourceUrl: "https://www.facebook.com/ads/library",
    region: "global",
    category: "ads_transparency",
    status: "active",
  },
] as const satisfies readonly InstagramTrendSourceDefinition[];

export function isAllowedInstagramSourceUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      allowedInstagramHosts.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export function assertAllowedInstagramSourceUrl(value: string) {
  if (!isAllowedInstagramSourceUrl(value)) {
    throw new Error(
      "URL Instagram/Meta invalida. Use apenas links HTTPS oficiais de Instagram, Meta Business, Facebook ou developers.facebook.com.",
    );
  }

  return value;
}
