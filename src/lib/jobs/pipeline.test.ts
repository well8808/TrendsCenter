import { describe, expect, it } from "vitest";

import { createManualIngestEnvelope, phase3BQueues } from "./pipeline";

describe("phase3BQueues", () => {
  it("mantém filas locais sem rede externa automática", () => {
    const envelope = createManualIngestEnvelope("src-manual-intake-br", "Teste manual aprovado.");

    expect(phase3BQueues.map((item) => item.queue)).toEqual([
      "manual-ingest",
      "normalize",
      "score",
      "audit",
    ]);
    expect(envelope.externalNetwork).toBe(false);
    expect(envelope.sourceId).toBe("src-manual-intake-br");
  });
});
