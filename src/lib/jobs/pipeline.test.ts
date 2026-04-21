import { describe, expect, it } from "vitest";

import { createManualIngestEnvelope, phase3BQueues } from "./pipeline";

describe("phase3BQueues", () => {
  it("mantem filas locais sem rede externa automatica", () => {
    const envelope = createManualIngestEnvelope("src-demo-trends-br", "Teste manual aprovado.");

    expect(phase3BQueues.map((item) => item.queue)).toEqual([
      "manual-ingest",
      "normalize",
      "score",
      "audit",
    ]);
    expect(envelope.externalNetwork).toBe(false);
    expect(envelope.sourceId).toBe("src-demo-trends-br");
  });
});
