import { describe, expect, it } from "vitest";

import { demoSignals } from "./demo-data";
import { filterSignals, rankSignals, summarizeSignals } from "./signal-analysis";

describe("signal-analysis", () => {
  it("filtra por mercado, tipo, prioridade e busca textual", () => {
    const filtered = filterSignals(demoSignals, {
      query: "danca",
      market: "BR",
      type: "FORMAT",
      priority: "now",
      sort: "priority",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("sig-demo-dance-cuts");
  });

  it("ordena por prioridade antes de score no modo operacional", () => {
    const ranked = rankSignals(demoSignals, "priority");

    expect(ranked[0]?.priority).toBe("now");
    expect(ranked[0]?.id).toBe("sig-demo-dance-cuts");
  });

  it("resume os sinais sem depender de dados de producao", () => {
    const summary = summarizeSignals(demoSignals);

    expect(summary.brCount).toBeGreaterThan(summary.usCount);
    expect(summary.evidenceCount).toBeGreaterThan(0);
    expect(summary.avgScore).toBeGreaterThan(0);
  });
});
