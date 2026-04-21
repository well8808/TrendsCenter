import { describe, expect, it } from "vitest";

import { createManualIngestEnvelope, phase3AQueues } from "./pipeline";

describe("phase3AQueues", () => {
  it("mantem filas locais sem rede externa automatica", () => {
    const envelope = createManualIngestEnvelope("src-demo-trends-br", "Teste manual aprovado.");

    expect(phase3AQueues.map((item) => item.queue)).toEqual([
      "manual-ingest",
      "normalize",
      "score",
      "audit",
    ]);
    expect(envelope.externalNetwork).toBe(false);
    expect(envelope.sourceId).toBe("src-demo-trends-br");
  });
});
