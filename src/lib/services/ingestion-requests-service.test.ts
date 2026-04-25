import { describe, expect, it } from "vitest";

import { parseIngestionRequestBody } from "./ingestion-requests-service";

describe("parseIngestionRequestBody", () => {
  it("accepts a trend snapshot payload", () => {
    const parsed = parseIngestionRequestBody({
      type: "OFFICIAL_SNAPSHOT",
      sourceTitle: "Creative Center BR",
      sourceKind: "CREATIVE_CENTER_TRENDS",
      sourceOrigin: "OFFICIAL",
      market: "BR",
      payloadJson: '{"videos":[]}',
    });

    expect(parsed).toEqual({
      type: "OFFICIAL_SNAPSHOT",
      sourceTitle: "Creative Center BR",
      sourceKind: "CREATIVE_CENTER_TRENDS",
      sourceOrigin: "OFFICIAL",
      market: "BR",
      sourceUrl: undefined,
      payloadJson: '{"videos":[]}',
    });
  });

  it("rejects unsupported request types", () => {
    expect(() =>
      parseIngestionRequestBody({
        type: "UNSUPPORTED",
      }),
    ).toThrowError(/nao suportado/i);
  });
});
