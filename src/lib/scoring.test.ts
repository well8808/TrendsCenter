import { describe, expect, it } from "vitest";

import { calculateTrendScore } from "./scoring";

describe("calculateTrendScore", () => {
  it("penaliza risco sem inventar override manual", () => {
    const score = calculateTrendScore({
      velocity7d: 90,
      acceleration: 80,
      brazilFit: 88,
      usTransferability: 42,
      formatRepeatability: 75,
      creatorSignal: 60,
      audioCommercialUsable: 70,
      revivalStrength: 20,
      evidenceQuality: 80,
      riskPenalty: 24,
    });

    expect(score.value).toBeLessThan(70);
    expect(score.riskAdjusted).toBe(true);
  });

  it("mantem score entre 0 e 100", () => {
    const score = calculateTrendScore({
      velocity7d: 200,
      acceleration: 200,
      brazilFit: 200,
      usTransferability: 200,
      formatRepeatability: 200,
      creatorSignal: 200,
      audioCommercialUsable: 200,
      revivalStrength: 200,
      evidenceQuality: 200,
      riskPenalty: -50,
    });

    expect(score.value).toBe(100);
  });
});
