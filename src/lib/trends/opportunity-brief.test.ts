import { describe, expect, it } from "vitest";

import { buildOpportunityBrief } from "@/lib/trends/opportunity-brief";

describe("buildOpportunityBrief", () => {
  it("turns a high-score reel into a practical action brief", () => {
    const brief = buildOpportunityBrief({
      title: "Creator mostra bastidor de lancamento em 3 cenas",
      caption: "Gancho rapido, prova visual e chamada final para comentar",
      creator: "brandlab",
      market: "BR",
      origin: "BRIGHT_DATA",
      trendScore: 84,
      growthViews: 120_000,
      velocityScore: 76,
      accelerationScore: 52,
      evidenceCount: 2,
      snapshotCount: 2,
      views: 1_400_000,
      likes: 90_000,
      comments: 2_000,
      shares: 8_000,
      saves: 1_500,
      hashtags: ["produto", "reels"],
      collectedAt: "2026-05-02T10:00:00.000Z",
    });

    expect(brief.status.label).toBe("pronto para agir");
    expect(brief.action.key).toBe("act_now");
    expect(brief.whyItMatters).toContain("Fonte BRIGHT_DATA");
    expect(brief.whyItMatters).toContain("mercado BR");
    expect(brief.provenance.confidence).toBe("high");
  });

  it("stays honest when caption data is limited", () => {
    const brief = buildOpportunityBrief({
      title: "Reel importado",
      creator: "espn",
      market: "US",
      origin: "BRIGHT_DATA",
      trendScore: 62,
      growthViews: 0,
      velocityScore: 41,
      accelerationScore: 20,
      evidenceCount: 1,
      snapshotCount: 1,
      views: 2_100_000,
      hashtags: [],
    });

    expect(brief.action.key).toBe("save_agenda");
    expect(brief.strategicSummary).toContain("legenda e limitada");
    expect(brief.replicableFormat.confidenceNote).toContain("confirme o gancho");
  });

  it("keeps low-signal reels out of the immediate agenda", () => {
    const brief = buildOpportunityBrief({
      title: "Video com pouca evidencia",
      market: "BR",
      origin: "BRIGHT_DATA",
      trendScore: 28,
      growthViews: 0,
      velocityScore: 10,
      accelerationScore: 5,
      evidenceCount: 0,
      snapshotCount: 0,
      views: 2_400,
      hashtags: [],
    });

    expect(brief.status.label).toBe("baixo sinal");
    expect(brief.action.key).toBe("discard_now");
    expect(brief.provenance.confidence).toBe("low");
  });
});
