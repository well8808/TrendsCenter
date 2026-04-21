import { describe, expect, it } from "vitest";

import {
  buildEvidenceDedupeKey,
  buildSignalDedupeKey,
  buildSourceDedupeKey,
  normalizeForDedupe,
} from "./dedupe";

describe("ingestion dedupe", () => {
  it("normaliza texto de operador para chave estavel", () => {
    expect(normalizeForDedupe("  Áudio Funk-Pop / Corte 01!  ")).toBe("audio-funk-pop-corte-01");
  });

  it("mantem chaves idempotentes por mercado, tipo, fonte e evidencia", () => {
    const signalKey = buildSignalDedupeKey({
      market: "BR",
      type: "FORMAT",
      title: "Danca em 3 cortes",
    });
    const sourceKey = buildSourceDedupeKey({
      origin: "MANUAL",
      kind: "MANUAL_RESEARCH",
      market: "BR",
      title: "Operador BR",
    });

    expect(signalKey).toBe("signal:br:format:danca-em-3-cortes");
    expect(sourceKey).toBe("source:manual:manual_research:br:operador-br");
    expect(
      buildEvidenceDedupeKey({
        signalKey,
        title: "Review manual",
        url: "https://example.com/video/1",
      }),
    ).toBe(
      buildEvidenceDedupeKey({
        signalKey,
        title: "Outro titulo",
        url: "https://example.com/video/1",
      }),
    );
  });
});
