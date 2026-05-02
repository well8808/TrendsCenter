export type ReelMediaConfidence = "high" | "medium" | "low";
export type ReelMediaKind = "image" | "video";
export type ReelMediaStability = "stable" | "likely-expiring" | "blocked" | "unknown";

export interface NormalizedReelMedia {
  posterUrl?: string;
  videoUrl?: string;
  mediaKind?: ReelMediaKind;
  mediaHost?: string;
  mediaStability: ReelMediaStability;
  sourceField?: string;
  mediaSourceField?: string;
  hasRealMedia: boolean;
  mediaConfidence: ReelMediaConfidence;
  fallbackReason: "real_media_available" | "no_media_field" | "invalid_media_url" | "unsupported_media_field";
  isExternalMedia: boolean;
  needsImageProxyOrUnoptimized: boolean;
}

type MediaRecord = Record<string, unknown>;
type MediaKind = "poster" | "video";

interface MediaCandidate {
  url?: string;
  sourceField: string;
  kind: MediaKind;
  confidence: ReelMediaConfidence;
  sawCandidate: boolean;
}

interface CandidateSpec {
  fieldNames: string[];
  sourceField: string;
  kind: MediaKind;
  confidence: ReelMediaConfidence;
  roots?: string[];
}

const providerRoots = ["provider", "raw", "payload", "metadata", "rawMetrics", "sourceSnapshot"];
const snapshotRoots = ["snapshot", "snapshots", "evidence", "trendEvidence"];

const posterProviderFields = [
  "thumbnail_url",
  "cover_url",
  "display_url",
  "image_url",
  "poster_url",
  "preview_url",
  "reel_cover",
];

const posterLocalFields = [
  "thumbnailUrl",
  "coverUrl",
  "displayUrl",
  "imageUrl",
  "posterUrl",
  "previewUrl",
  "reelCover",
  "thumbnail",
  "cover",
  "display",
  "image",
  "poster",
  "preview",
  "picture",
  "photo",
];

const videoLocalFields = [
  "videoUrl",
  "mediaUrl",
  "playbackUrl",
  "videoSrc",
  "video_url",
  "media_url",
  "playback_url",
  "video_src",
  "video",
  "media",
];

const candidatePriority: CandidateSpec[] = [
  { fieldNames: ["thumbnailUrl"], sourceField: "thumbnailUrl", kind: "poster", confidence: "high" },
  { fieldNames: ["thumbnail"], sourceField: "thumbnail", kind: "poster", confidence: "high" },
  { fieldNames: ["thumbnail_url"], sourceField: "thumbnail_url", kind: "poster", confidence: "high" },
  { fieldNames: ["thumbnail"], sourceField: "provider.thumbnail", kind: "poster", confidence: "high", roots: providerRoots },
  { fieldNames: ["thumbnail_url"], sourceField: "provider.thumbnail_url", kind: "poster", confidence: "high", roots: providerRoots },
  { fieldNames: ["cover", "coverUrl"], sourceField: "cover", kind: "poster", confidence: "high" },
  { fieldNames: ["cover_url", "coverUrl"], sourceField: "cover_url", kind: "poster", confidence: "high" },
  { fieldNames: ["cover", "coverUrl"], sourceField: "provider.cover", kind: "poster", confidence: "high", roots: providerRoots },
  { fieldNames: ["cover_url", "coverUrl"], sourceField: "provider.cover_url", kind: "poster", confidence: "high", roots: providerRoots },
  { fieldNames: ["display", "displayUrl"], sourceField: "display", kind: "poster", confidence: "high" },
  { fieldNames: ["display_url", "displayUrl"], sourceField: "display_url", kind: "poster", confidence: "high" },
  { fieldNames: ["display", "displayUrl"], sourceField: "provider.display", kind: "poster", confidence: "high", roots: providerRoots },
  { fieldNames: ["display_url", "displayUrl"], sourceField: "provider.display_url", kind: "poster", confidence: "high", roots: providerRoots },
  { fieldNames: ["image", "image_url", "imageUrl", "poster", "poster_url", "posterUrl", "preview", "preview_url", "previewUrl", "picture", "photo", "reel_cover", "reelCover"], sourceField: "image_media", kind: "poster", confidence: "medium" },
  { fieldNames: ["image", "image_url", "imageUrl", "poster", "poster_url", "posterUrl", "preview", "preview_url", "previewUrl", "picture", "photo", "reel_cover", "reelCover"], sourceField: "provider.image_media", kind: "poster", confidence: "medium", roots: providerRoots },
  { fieldNames: [...posterProviderFields, ...posterLocalFields], sourceField: "snapshot.image_media", kind: "poster", confidence: "medium", roots: snapshotRoots },
  { fieldNames: videoLocalFields, sourceField: "provider.video_media", kind: "video", confidence: "medium", roots: providerRoots },
  { fieldNames: videoLocalFields, sourceField: "snapshot.video_media", kind: "video", confidence: "low", roots: snapshotRoots },
  { fieldNames: videoLocalFields, sourceField: "videoUrl", kind: "video", confidence: "medium" },
];

function isRecord(value: unknown): value is MediaRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRelativeAsset(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

export function getReelMediaHost(value?: string) {
  if (!value || isRelativeAsset(value)) return undefined;

  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

export function isInstagramCdnMediaUrl(value?: string) {
  const host = getReelMediaHost(value);

  return Boolean(host && (host === "cdninstagram.com" || host.endsWith(".cdninstagram.com")));
}

export function shouldProxyReelImage(value?: string) {
  if (!value || !isInstagramCdnMediaUrl(value)) return false;

  try {
    const parsed = new URL(value);

    return parsed.protocol === "https:" && parsed.pathname.startsWith("/v/");
  } catch {
    return false;
  }
}

export function proxiedReelImageUrl(value: string, width = 640) {
  return shouldProxyReelImage(value)
    ? `/_next/image?url=${encodeURIComponent(value)}&w=${width}&q=75`
    : value;
}

export function classifyReelMediaStability({
  url,
  mediaKind,
  sourceField,
  mediaConfidence,
  loadState,
}: {
  url?: string;
  mediaKind?: ReelMediaKind;
  sourceField?: string;
  mediaConfidence?: ReelMediaConfidence;
  loadState?: "loaded" | "failed";
}): ReelMediaStability {
  if (loadState === "failed") return "blocked";
  if (!url) return "unknown";
  if (isRelativeAsset(url)) return "stable";

  const host = getReelMediaHost(url);
  const lowerSource = sourceField?.toLowerCase() ?? "";

  if (!host) return "unknown";

  if (isInstagramCdnMediaUrl(url)) {
    return "likely-expiring";
  }

  if (mediaKind === "video" || lowerSource.includes("video_url")) {
    return mediaConfidence === "high" ? "unknown" : "likely-expiring";
  }

  return "unknown";
}

function cleanUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();

  if (!trimmed) return undefined;

  if (isRelativeAsset(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

function isExternalUrl(value?: string) {
  if (!value || isRelativeAsset(value)) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasCandidateValue(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  return isRecord(value) || Array.isArray(value);
}

function readMediaUrl(value: unknown): string | undefined {
  const directUrl = cleanUrl(value);

  if (directUrl) return directUrl;

  if (Array.isArray(value)) {
    for (let index = 0; index < Math.min(value.length, 5); index += 1) {
      const itemUrl = readMediaUrl(value[index]);

      if (itemUrl) return itemUrl;
    }
  }

  if (isRecord(value)) {
    return cleanUrl(value.url) ?? cleanUrl(value.src) ?? cleanUrl(value.href) ?? cleanUrl(value.uri);
  }

  return undefined;
}

function findFieldCandidate({
  value,
  fieldNames,
  sourceField,
  kind,
  confidence,
  path = "",
  deep = true,
}: {
  value: unknown;
  fieldNames: Set<string>;
  sourceField: string;
  kind: MediaKind;
  confidence: ReelMediaConfidence;
  path?: string;
  deep?: boolean;
}): MediaCandidate | undefined {
  if (!isRecord(value)) return undefined;

  for (const [key, entry] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;

    if (!fieldNames.has(key) || !hasCandidateValue(entry)) {
      continue;
    }

    return {
      url: readMediaUrl(entry),
      sourceField: nextPath || sourceField,
      kind,
      confidence,
      sawCandidate: true,
    };
  }

  if (!deep) {
    return undefined;
  }

  for (const [key, entry] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;

    if (Array.isArray(entry)) {
      for (let index = 0; index < Math.min(entry.length, 6); index += 1) {
        const candidate = findFieldCandidate({
          value: entry[index],
          fieldNames,
          sourceField,
          kind,
          confidence,
          path: `${nextPath}[${index}]`,
        });

        if (candidate) return candidate;
      }
    } else if (isRecord(entry)) {
      const candidate = findFieldCandidate({
        value: entry,
        fieldNames,
        sourceField,
        kind,
        confidence,
        path: nextPath,
      });

      if (candidate) return candidate;
    }
  }

  return undefined;
}

function rootValues(reel: MediaRecord, roots?: string[]) {
  if (!roots) return [{ value: reel, path: "" }];

  const values: Array<{ value: unknown; path: string }> = [];

  roots.forEach((root) => {
    const value = reel[root];

    if (Array.isArray(value)) {
      value.slice(0, 8).forEach((item, index) => values.push({ value: item, path: `${root}[${index}]` }));
    } else if (typeof value !== "undefined" && value !== null) {
      values.push({ value, path: root });
    }
  });

  return values;
}

function findCandidate(reel: MediaRecord, spec: CandidateSpec) {
  const fieldNames = new Set(spec.fieldNames);

  for (const { value, path } of rootValues(reel, spec.roots)) {
    const candidate = findFieldCandidate({
      value,
      fieldNames,
      sourceField: spec.sourceField,
      kind: spec.kind,
      confidence: spec.confidence,
      path,
      deep: Boolean(spec.roots),
    });

    if (candidate) return candidate;
  }

  return undefined;
}

function fallbackFromCandidate(candidate: MediaCandidate | undefined): NormalizedReelMedia {
  return {
    hasRealMedia: false,
    mediaConfidence: "low",
    mediaStability: candidate?.sawCandidate ? "blocked" : "unknown",
    sourceField: candidate?.sourceField,
    mediaSourceField: candidate?.sourceField,
    fallbackReason: candidate?.sawCandidate ? "invalid_media_url" : "no_media_field",
    isExternalMedia: false,
    needsImageProxyOrUnoptimized: false,
  };
}

export function normalizeReelMedia(reel: unknown): NormalizedReelMedia {
  if (!isRecord(reel)) {
    return {
      hasRealMedia: false,
      mediaConfidence: "low",
      mediaStability: "unknown",
      fallbackReason: "unsupported_media_field",
      isExternalMedia: false,
      needsImageProxyOrUnoptimized: false,
    };
  }

  let invalidCandidate: MediaCandidate | undefined;

  for (const spec of candidatePriority) {
    const candidate = findCandidate(reel, spec);

    if (!candidate) continue;

    if (!candidate.url) {
      invalidCandidate ??= candidate;
      continue;
    }

    const isExternalMedia = isExternalUrl(candidate.url);
    const mediaKind = candidate.kind === "poster" ? "image" : "video";
    const mediaStability = classifyReelMediaStability({
      url: candidate.url,
      mediaKind,
      sourceField: candidate.sourceField,
      mediaConfidence: candidate.confidence,
    });

    return {
      posterUrl: candidate.kind === "poster" ? candidate.url : undefined,
      videoUrl: candidate.kind === "video" ? candidate.url : undefined,
      mediaKind,
      mediaHost: getReelMediaHost(candidate.url),
      mediaStability,
      hasRealMedia: true,
      mediaConfidence: candidate.confidence,
      sourceField: candidate.sourceField,
      mediaSourceField: candidate.sourceField,
      fallbackReason: "real_media_available",
      isExternalMedia,
      needsImageProxyOrUnoptimized: isExternalMedia,
    };
  }

  return fallbackFromCandidate(invalidCandidate);
}
