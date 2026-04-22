import { describe, expect, it } from "vitest";

import { calculateVideoTrendScore } from "./scoring";

describe("calculateVideoTrendScore", () => {
  it("rewards fast recent growth with evidence", () => {
    const observedAt = new Date("2026-04-22T12:00:00.000Z");
    const score = calculateVideoTrendScore({
      viewCount: BigInt(220000),
      previousViewCount: BigInt(60000),
      observedAt,
      previousObservedAt: new Date("2026-04-21T12:00:00.000Z"),
      postedAt: new Date("2026-04-20T12:00:00.000Z"),
      snapshotCount: 3,
      evidenceCount: 2,
    });

    expect(score.score).toBeGreaterThan(55);
    expect(score.growthViews).toBe(BigInt(160000));
    expect(score.confidence).not.toBe("LOW");
  });

  it("keeps stale one-off observations conservative", () => {
    const score = calculateVideoTrendScore({
      viewCount: BigInt(5000),
      observedAt: new Date("2026-04-22T12:00:00.000Z"),
      postedAt: new Date("2026-04-02T12:00:00.000Z"),
      snapshotCount: 1,
      evidenceCount: 0,
    });

    expect(score.score).toBeLessThan(45);
    expect(score.confidence).toBe("LOW");
  });
});
