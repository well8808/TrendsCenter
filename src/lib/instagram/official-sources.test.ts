import { describe, expect, it } from "vitest";

import { instagramOfficialSources, isAllowedInstagramSourceUrl } from "./official-sources";

describe("Instagram official sources", () => {
  it("registers only allowed Instagram/Meta source URLs", () => {
    expect(instagramOfficialSources).toHaveLength(4);
    expect(instagramOfficialSources.map((source) => source.sourceType)).toEqual([
      "reel",
      "account_insights",
      "account_insights",
      "meta_ad_library",
    ]);

    for (const source of instagramOfficialSources) {
      expect(source.platform).toBe("instagram");
      expect(source.region).toBe("global");
      expect(source.status).toBe("active");
      expect(isAllowedInstagramSourceUrl(source.sourceUrl)).toBe(true);
      expect("lastCheckedAt" in source).toBe(false);
      expect(source.title).not.toMatch(/fake|mock|sample|example|trend viral|hashtag exemplo|creator exemplo/i);
    }
  });

  it.each([
    "",
    "/reels/",
    "//www.instagram.com/reels/",
    "www.instagram.com/reels/",
    "http://www.instagram.com/reels/",
    "javascript:alert(1)",
    "data:text/html;base64,PGgxPkZha2U8L2gxPg==",
    "https://fake-instagram.com",
    "https://instagram.com.evil.com",
    "https://instagram.fake.com/reels",
    "https://developers.facebook.com.evil.example/docs/instagram-platform",
    "https://www.facebook.com.evil.example/ads/library",
    "https://www.facebook.com@evil.example/ads/library",
    "https://user:password@www.facebook.com/ads/library",
    "https://evil-instagram.com/reels",
    "https://example.com/instagram",
    "not-a-url",
  ])("rejects unsafe or non-Instagram source URL %s", (url) => {
    expect(isAllowedInstagramSourceUrl(url)).toBe(false);
  });

  it.each([
    "https://instagram.com/@instagram",
    "https://www.instagram.com/@instagram",
    "https://www.instagram.com/reels/",
    "https://business.instagram.com/",
    "https://developers.facebook.com/docs/instagram-platform/",
    "https://www.facebook.com/ads/library",
  ])("accepts exact allowed Instagram host %s", (url) => {
    expect(isAllowedInstagramSourceUrl(url)).toBe(true);
  });
});
