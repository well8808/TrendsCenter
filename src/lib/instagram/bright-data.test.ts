import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchBrightDataSnapshotOnce,
  normalizeBrightDataReelsSnapshot,
  startBrightDataReels,
} from "./bright-data";

const originalEnv = {
  BRIGHT_DATA_API_KEY: process.env.BRIGHT_DATA_API_KEY,
  BRIGHT_DATA_REELS_DATASET_ID: process.env.BRIGHT_DATA_REELS_DATASET_ID,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("Bright Data Reels integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnv();
  });

  it("starts a snapshot without waiting for Bright Data results", async () => {
    process.env.BRIGHT_DATA_API_KEY = "bright-token";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ snapshot_id: "snap_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const started = await startBrightDataReels({
      mode: "profile_reels",
      market: "BR",
      urls: ["https://www.instagram.com/example/"],
      maxPerProfile: 7,
      sourceTitle: "Teste Bright Data",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(started).toMatchObject({
      provider: "bright_data",
      mode: "profile_reels",
      market: "BR",
      snapshotId: "snap_123",
      sourceTitle: "Teste Bright Data",
      sourceUrl: "https://www.instagram.com/example/",
    });
  });

  it("treats running progress responses as pending", async () => {
    process.env.BRIGHT_DATA_API_KEY = "bright-token";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: "running" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchBrightDataSnapshotOnce("snap_pending")).resolves.toEqual({ status: "pending" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0] as unknown[] | undefined;
    expect(String(firstCall?.[0])).toContain("/datasets/v3/progress/snap_pending");
  });

  it("downloads ready snapshots using explicit JSON format", async () => {
    process.env.BRIGHT_DATA_API_KEY = "bright-token";
    const body = JSON.stringify([{ url: "https://www.instagram.com/reel/ABC123/" }]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "ready" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchBrightDataSnapshotOnce("snap_ready")).resolves.toEqual({
      status: "ready",
      textBody: body,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCall = fetchMock.mock.calls[1] as unknown[] | undefined;
    expect(String(secondCall?.[0])).toContain("/datasets/v3/snapshot/snap_ready?format=json");
  });

  it("normalizes ready Bright Data JSONL into provider videos", () => {
    const body = JSON.stringify({
      url: "https://www.instagram.com/reel/ABC123/",
      description: "Gancho de teste #criativo",
      user_posted: "creator_br",
      video_play_count: 12345,
      likes: 678,
      num_comments: 12,
      date_posted: "2026-04-30T07:00:00.000Z",
      user_profile_url: "https://www.instagram.com/creator_br/",
      followers: 45000,
      audio_title: "Audio teste",
      audio_url: "https://www.instagram.com/audio/1/",
    });

    const collected = normalizeBrightDataReelsSnapshot(
      {
        mode: "profile_reels",
        market: "BR",
        sourceUrl: "https://www.instagram.com/creator_br/",
        sourceTitle: "Bright Data Teste",
      },
      body,
    );

    expect(collected.videos).toHaveLength(1);
    expect(collected.videos[0]).toMatchObject({
      url: "https://www.instagram.com/reel/ABC123/",
      title: "Gancho de teste #criativo",
      metrics: {
        views: 12345,
        likes: 678,
        comments: 12,
        shares: 0,
        saves: 0,
      },
      creator: {
        handle: "creator_br",
        profileUrl: "https://www.instagram.com/creator_br/",
        followerCount: 45000,
      },
      hashtags: ["criativo"],
    });
  });
});
