import { describe, expect, it } from "vitest";

import type { OpportunityDecisionView } from "@/lib/trends/opportunity-actions";
import { buildContentIdeaBrief, formatContentIdeaBriefForCopy } from "@/lib/trends/content-idea-brief";
import { buildOpportunityBrief } from "@/lib/trends/opportunity-brief";

const createdDecision: OpportunityDecisionView = {
  id: "decision-1",
  action: "create_content_idea",
  label: "Transformar em pauta",
  shortLabel: "ideia",
  body: "Promover para pauta ativa.",
  section: "saved",
  tone: "hot",
  updatedAt: "2026-05-02T12:00:00.000Z",
};

function buildBaseBrief(overrides: Partial<Parameters<typeof buildOpportunityBrief>[0]> = {}) {
  return buildOpportunityBrief({
    title: "Creator mostra bastidor de lancamento em tres cenas",
    caption: "Gancho rapido, prova visual do processo e chamada para comentar qual cena prendeu mais atencao",
    creator: "brandlab",
    market: "BR",
    origin: "BRIGHT_DATA",
    trendScore: 86,
    growthViews: 140_000,
    velocityScore: 78,
    accelerationScore: 54,
    evidenceCount: 2,
    snapshotCount: 2,
    views: 1_600_000,
    likes: 90_000,
    comments: 2_000,
    shares: 8_000,
    saves: 1_500,
    sound: "Audio em alta",
    hashtags: ["produto", "bastidores"],
    ...overrides,
  });
}

describe("buildContentIdeaBrief", () => {
  it("turns a real reel, score, caption and signal into an actionable pauta", () => {
    const opportunityBrief = buildBaseBrief();
    const idea = buildContentIdeaBrief({
      reel: {
        title: "Creator mostra bastidor de lancamento em tres cenas",
        caption: "Gancho rapido, prova visual do processo e chamada para comentar qual cena prendeu mais atencao",
        creator: "brandlab",
        market: "BR",
        origin: "BRIGHT_DATA",
        trendScore: 86,
        views: 1_600_000,
        growthViews: 140_000,
        evidenceCount: 2,
        snapshotCount: 2,
        sound: "Audio em alta",
        hashtags: ["produto", "bastidores"],
      },
      opportunityBrief,
      decision: createdDecision,
      signal: {
        title: "Bastidor com prova social ganhando tracao",
        summary: "O formato combina bastidor e chamada direta.",
        decision: "Adaptar bastidor com prova social para lancamento proprio.",
        nextAction: "Criar roteiro curto.",
        confidence: "high",
        evidenceCount: 2,
        score: 88,
        scoreDrivers: ["views", "score"],
      },
    });

    expect(idea.isReady).toBe(true);
    expect(idea.title).toContain("Pauta pronta");
    expect(idea.hook).toContain("caption real");
    expect(idea.angle).toContain("Adaptar bastidor");
    expect(idea.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Score real: 86/100"),
        expect.stringContaining("Views reais:"),
        expect.stringContaining("Signal relacionado"),
      ]),
    );
    expect(idea.confidenceLabel).toBe("Alta");
  });

  it("stays useful and honest with few data points", () => {
    const opportunityBrief = buildBaseBrief({
      caption: undefined,
      creator: undefined,
      trendScore: 22,
      growthViews: 0,
      velocityScore: 12,
      accelerationScore: 4,
      evidenceCount: 0,
      snapshotCount: 0,
      views: 0,
      hashtags: [],
      sound: undefined,
    });

    const idea = buildContentIdeaBrief({
      reel: {
        title: "Reel importado",
        market: "BR",
        origin: "BRIGHT_DATA",
        trendScore: 22,
        views: 0,
        growthViews: 0,
        evidenceCount: 0,
        snapshotCount: 0,
        hashtags: [],
      },
      opportunityBrief,
    });

    expect(idea.isReady).toBe(false);
    expect(idea.title).toContain("Rascunho de pauta");
    expect(idea.hook).toContain("Gancho a validar");
    expect(idea.riskNotes).toContain("Caption limitada");
    expect(idea.evidence).not.toEqual(expect.arrayContaining([expect.stringContaining("Views reais")]));
    expect(idea.evidence).not.toEqual(expect.arrayContaining([expect.stringContaining("1M")]));
  });

  it("uses CREATE_CONTENT_IDEA as the ready state", () => {
    const idea = buildContentIdeaBrief({
      reel: {
        title: "Formato visual replicavel",
        caption: "Abertura forte, comparacao visual e fechamento com pergunta simples",
        creator: "creator",
        market: "US",
        origin: "BRIGHT_DATA",
        trendScore: 64,
        views: 240_000,
        growthViews: 12_000,
        evidenceCount: 1,
        snapshotCount: 1,
        hashtags: ["visual"],
      },
      opportunityBrief: buildBaseBrief({
        market: "US",
        trendScore: 64,
        views: 240_000,
        growthViews: 12_000,
        evidenceCount: 1,
        snapshotCount: 1,
      }),
      decision: createdDecision,
    });

    expect(idea.isReady).toBe(true);
    expect(idea.cta).toContain("roteiro curto");
  });

  it("does not pretend to know the hook when there is no caption", () => {
    const idea = buildContentIdeaBrief({
      reel: {
        title: "Reel sem caption",
        creator: "espn",
        market: "US",
        origin: "BRIGHT_DATA",
        trendScore: 70,
        views: 900_000,
        growthViews: 0,
        evidenceCount: 1,
        snapshotCount: 1,
        hashtags: [],
      },
      opportunityBrief: buildBaseBrief({
        caption: undefined,
        creator: "espn",
        trendScore: 70,
        views: 900_000,
        growthViews: 0,
        hashtags: [],
      }),
      decision: createdDecision,
    });

    expect(idea.hook).toContain("validar");
    expect(idea.captionStarter).toContain("@espn");
  });

  it("works without a related signal", () => {
    const idea = buildContentIdeaBrief({
      reel: {
        title: "Produto em trend visual",
        caption: "Antes e depois rapido mostrando o detalhe que mudou o resultado",
        market: "BR",
        origin: "BRIGHT_DATA",
        trendScore: 76,
        views: 800_000,
        growthViews: 22_000,
        evidenceCount: 1,
        snapshotCount: 1,
        hashtags: ["produto"],
      },
      opportunityBrief: buildBaseBrief({
        title: "Produto em trend visual",
        caption: "Antes e depois rapido mostrando o detalhe que mudou o resultado",
        trendScore: 76,
        views: 800_000,
        growthViews: 22_000,
        evidenceCount: 1,
        snapshotCount: 1,
        sound: undefined,
      }),
      decision: createdDecision,
    });

    expect(idea.evidence).not.toEqual(expect.arrayContaining([expect.stringContaining("Signal relacionado")]));
    expect(idea.formatToCopy).toContain("adaptada");
  });

  it("formats the ready brief as copyable production material", () => {
    const idea = buildContentIdeaBrief({
      reel: {
        title: "Creator mostra bastidor de lancamento em tres cenas",
        caption: "Gancho rapido, prova visual do processo e chamada para comentar qual cena prendeu mais atencao",
        creator: "brandlab",
        market: "BR",
        origin: "BRIGHT_DATA",
        trendScore: 86,
        views: 1_600_000,
        growthViews: 140_000,
        evidenceCount: 2,
        snapshotCount: 2,
        hashtags: ["produto"],
      },
      opportunityBrief: buildBaseBrief(),
      decision: createdDecision,
    });

    const copy = formatContentIdeaBriefForCopy(idea);

    expect(copy).toContain("Ideia central:");
    expect(copy).toContain("Gancho:");
    expect(copy).toContain("Estrutura do conteudo:");
    expect(copy).toContain("Legenda inicial:");
    expect(copy).toContain("CTA:");
    expect(copy).toContain("Evidencias usadas:");
    expect(copy).toContain("Score real: 86/100");
  });
});
