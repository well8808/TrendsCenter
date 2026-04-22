import { describe, expect, it } from "vitest";

import { filterSignals, rankSignals, summarizeSignals } from "./signal-analysis";
import type { TrendSignal } from "./types";

const persistedSignals: TrendSignal[] = [
  {
    id: "sig-real-dance-cuts",
    title: "Danca em 3 cortes com fonte manual",
    summary: "Sinal persistido usado como fixture de teste de dominio.",
    type: "FORMAT",
    market: "BR",
    audience: "Danca, beleza e lifestyle",
    status: "rising",
    priority: "now",
    riskLevel: "low",
    stage: "accelerating",
    strength: 78,
    trendWindow: "48h",
    decision: "Priorizar teste com criativo proprio.",
    nextAction: "Registrar evidencia adicional.",
    saved: true,
    origin: "MANUAL",
    scoreInput: {
      velocity7d: 80,
      acceleration: 70,
      brazilFit: 90,
      usTransferability: 30,
      formatRepeatability: 86,
      creatorSignal: 50,
      audioCommercialUsable: 40,
      revivalStrength: 20,
      evidenceQuality: 62,
      riskPenalty: 4,
    },
    score: {
      value: 76,
      band: "medium",
      label: "observar",
      riskAdjusted: true,
    },
    source: {
      id: "src-manual",
      title: "Manual research intake BR",
      kind: "MANUAL_RESEARCH",
      origin: "MANUAL",
      collectedAt: new Date().toISOString(),
      market: "BR",
      confidence: "medium",
      evidenceCount: 2,
    },
    tags: ["danca", "manual"],
    evidence: [
      {
        id: "ev-1",
        title: "Registro manual",
        sourceLabel: "Manual research intake BR",
        quality: "medium",
        timestamp: new Date().toISOString(),
        note: "Evidencia persistida em teste.",
      },
    ],
    history: [{ label: "ingest", value: "manual", tone: "acid" }],
    scoreDrivers: ["manual intake", "evidencia inicial"],
  },
  {
    id: "sig-real-us",
    title: "US early signal persistido",
    summary: "Sinal US usado para testar ranking.",
    type: "US_TO_BR",
    market: "US",
    audience: "Early signal",
    status: "watch",
    priority: "watch",
    riskLevel: "medium",
    stage: "emerging",
    strength: 52,
    trendWindow: "7d",
    decision: "Aguardar prova BR.",
    nextAction: "Comparar com fonte BR.",
    saved: false,
    origin: "MANUAL",
    scoreInput: {
      velocity7d: 50,
      acceleration: 48,
      brazilFit: 42,
      usTransferability: 66,
      formatRepeatability: 58,
      creatorSignal: 30,
      audioCommercialUsable: 30,
      revivalStrength: 20,
      evidenceQuality: 36,
      riskPenalty: 8,
    },
    score: {
      value: 49,
      band: "low",
      label: "fraco",
      riskAdjusted: true,
    },
    source: {
      id: "src-us",
      title: "Manual research intake US",
      kind: "MANUAL_RESEARCH",
      origin: "MANUAL",
      collectedAt: new Date().toISOString(),
      market: "US",
      confidence: "low",
      evidenceCount: 1,
    },
    tags: ["us"],
    evidence: [],
    history: [{ label: "ingest", value: "manual", tone: "violet" }],
    scoreDrivers: ["manual intake"],
  },
];

describe("signal-analysis", () => {
  it("filtra por mercado, tipo, prioridade e busca textual", () => {
    const filtered = filterSignals(persistedSignals, {
      query: "danca",
      market: "BR",
      type: "FORMAT",
      priority: "now",
      sort: "priority",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("sig-real-dance-cuts");
  });

  it("ordena por prioridade antes de score no modo operacional", () => {
    const ranked = rankSignals(persistedSignals, "priority");

    expect(ranked[0]?.priority).toBe("now");
    expect(ranked[0]?.id).toBe("sig-real-dance-cuts");
  });

  it("resume os sinais sem depender de fixtures de producao", () => {
    const summary = summarizeSignals(persistedSignals);

    expect(summary.brCount).toBeGreaterThanOrEqual(summary.usCount);
    expect(summary.evidenceCount).toBeGreaterThan(0);
    expect(summary.avgScore).toBeGreaterThan(0);
  });
});
