import { describe, expect, it } from "vitest";

import {
  classifyReelMediaStability,
  normalizeReelMedia,
  proxiedReelImageUrl,
  shouldProxyReelImage,
} from "./reel-media";

describe("normalizeReelMedia", () => {
  it("prefers the saved thumbnail over provider alternatives", () => {
    expect(
      normalizeReelMedia({
        thumbnailUrl: "https://cdn.example.com/saved.jpg",
        provider: {
          thumbnail_url: "https://cdn.example.com/provider.jpg",
        },
      }),
    ).toMatchObject({
      posterUrl: "https://cdn.example.com/saved.jpg",
      mediaKind: "image",
      sourceField: "thumbnailUrl",
      hasRealMedia: true,
      mediaConfidence: "high",
      mediaStability: "unknown",
      needsImageProxyOrUnoptimized: true,
    });
  });

  it("falls through provider fields in priority order", () => {
    expect(
      normalizeReelMedia({
        provider: {
          thumbnail_url: "",
          cover_url: "https://cdn.example.com/cover.jpg",
          display_url: "https://cdn.example.com/display.jpg",
        },
      }),
    ).toMatchObject({
      posterUrl: "https://cdn.example.com/cover.jpg",
      mediaKind: "image",
      sourceField: "provider.cover_url",
      hasRealMedia: true,
      mediaConfidence: "high",
    });
  });

  it("uses top-level provider-style display_url as external poster media", () => {
    expect(
      normalizeReelMedia({
        display_url: "https://scontent.cdninstagram.com/v/t51.2885-15/poster.jpg",
      }),
    ).toMatchObject({
      posterUrl: "https://scontent.cdninstagram.com/v/t51.2885-15/poster.jpg",
      mediaKind: "image",
      sourceField: "display_url",
      hasRealMedia: true,
      mediaStability: "likely-expiring",
      needsImageProxyOrUnoptimized: true,
    });
  });

  it("uses snapshot media when no saved or provider poster exists", () => {
    expect(
      normalizeReelMedia({
        url: "https://www.instagram.com/reel/ABC/",
        snapshots: [
          {
            rawMetrics: {
              display_url: "https://cdn.example.com/snapshot.jpg",
            },
          },
        ],
      }),
    ).toMatchObject({
      posterUrl: "https://cdn.example.com/snapshot.jpg",
      mediaKind: "image",
      sourceField: "snapshots[0].rawMetrics.display_url",
      mediaConfidence: "medium",
      hasRealMedia: true,
    });
  });

  it("does not treat the Instagram post URL as media", () => {
    expect(
      normalizeReelMedia({
        url: "https://www.instagram.com/reel/ABC/",
        snapshots: [{ rawMetrics: { url: "https://www.instagram.com/reel/ABC/" } }],
      }),
    ).toMatchObject({
      hasRealMedia: false,
      fallbackReason: "no_media_field",
    });
  });

  it("uses video media only when no poster exists", () => {
    expect(
      normalizeReelMedia({
        rawMetrics: {
          video_url: "https://cdn.example.com/video.mp4",
        },
      }),
    ).toMatchObject({
      videoUrl: "https://cdn.example.com/video.mp4",
      mediaKind: "video",
      sourceField: "rawMetrics.video_url",
      mediaConfidence: "medium",
      mediaStability: "likely-expiring",
      hasRealMedia: true,
    });
  });

  it("uses plain thumbnail fields as image media", () => {
    expect(
      normalizeReelMedia({
        rawMetrics: {
          providerMedia: {
            thumbnail: "https://cdn.example.com/plain-thumb.jpg",
          },
        },
      }),
    ).toMatchObject({
      posterUrl: "https://cdn.example.com/plain-thumb.jpg",
      mediaKind: "image",
      sourceField: "rawMetrics.providerMedia.thumbnail",
      mediaConfidence: "high",
      hasRealMedia: true,
    });
  });

  it("reports an invalid media candidate without inventing a fallback URL", () => {
    expect(
      normalizeReelMedia({
        provider: {
          thumbnail_url: "nota-url",
        },
      }),
    ).toMatchObject({
      hasRealMedia: false,
      sourceField: "provider.thumbnail_url",
      mediaStability: "blocked",
      fallbackReason: "invalid_media_url",
    });
  });

  it("classifies external media stability without pretending provider URLs are permanent", () => {
    expect(
      classifyReelMediaStability({
        url: "https://scontent-lax7-1.cdninstagram.com/v/t51.71878-15/thumb.jpg",
        mediaKind: "image",
        sourceField: "thumbnail",
        mediaConfidence: "high",
      }),
    ).toBe("likely-expiring");

    expect(
      classifyReelMediaStability({
        url: "/owned/poster.jpg",
        mediaKind: "image",
        sourceField: "thumbnailUrl",
        mediaConfidence: "high",
      }),
    ).toBe("stable");

    expect(
      classifyReelMediaStability({
        url: "https://cdn.example.com/thumb.jpg",
        mediaKind: "image",
        sourceField: "thumbnailUrl",
        mediaConfidence: "high",
        loadState: "failed",
      }),
    ).toBe("blocked");
  });

  it("uses Next image proxy only for supported Instagram CDN images", () => {
    const instagramUrl = "https://scontent-lax7-1.cdninstagram.com/v/t51.71878-15/thumb.jpg?token=1";

    expect(shouldProxyReelImage(instagramUrl)).toBe(true);
    expect(proxiedReelImageUrl(instagramUrl, 640)).toBe(
      `/_next/image?url=${encodeURIComponent(instagramUrl)}&w=640&q=75`,
    );
    expect(shouldProxyReelImage("https://cdn.example.com/thumb.jpg")).toBe(false);
  });
});
