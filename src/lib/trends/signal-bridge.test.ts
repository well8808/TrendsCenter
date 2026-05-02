import { describe, expect, it } from "vitest";

import { classifySignalOpportunity } from "@/lib/trends/signal-bridge";

describe("classifySignalOpportunity", () => {
  it("turns a real public-figure reel into a specific strategic signal", () => {
    const result = classifySignalOpportunity({
      title: "@Omar surprised these fans at WrestleMania with their favorite WWE superstar",
      caption: "Fans react to a surprise WrestleMania moment",
      creatorHandle: "espn",
      sourceTitle: "QA Bright Data ESPN - 1 Reel",
      soundTitle: "Audio do Reel",
      hashtags: ["wwe", "wrestlemania"],
      viewCount: BigInt(3_999_610),
      score: 66,
      market: "BR",
      hasSound: true,
    });

    expect(result.kind).toBe("public_creator");
    expect(result.title).toContain("Creator/figura publica: @espn");
    expect(result.reason).toContain("4 mi views");
    expect(result.reason).toContain("score 66");
    expect(result.decision).toContain("creator/figura publica");
    expect(result.tags).toContain("reel-real");
    expect(result.scoreDrivers).toContain("BR");
    expect(result.priority).toBe("NOW");
  });

  it("classifies instructional captions as tutorial opportunities", () => {
    const result = classifySignalOpportunity({
      title: "Como fazer uma abertura de Reels em 3 passos",
      caption: "Tutorial rapido com dicas de roteiro",
      sourceTitle: "Manual trend intake",
      hashtags: ["tutorial"],
      viewCount: BigInt(84_000),
      score: 58,
      market: "BR",
      hasSound: false,
    });

    expect(result.kind).toBe("tutorial");
    expect(result.type).toBe("FORMAT");
    expect(result.nextAction).toContain("passo a passo");
  });

  it("detects product or brand opportunities without relying on fake data", () => {
    const result = classifySignalOpportunity({
      title: "Nova colecao drop limitado da marca",
      caption: "Unboxing rapido mostra o produto em uso real",
      creatorHandle: "brandlab",
      sourceTitle: "Instagram Reels",
      hashtags: ["drop", "produto"],
      viewCount: BigInt(450_000),
      likeCount: BigInt(36_000),
      commentCount: BigInt(1_200),
      shareCount: BigInt(3_200),
      score: 71,
      market: "BR",
      hasSound: false,
    });

    expect(result.kind).toBe("brand_product");
    expect(result.title).toContain("Produto/marca");
    expect(result.reason).toContain("engaj.");
    expect(result.nextAction).toContain("produto/marca");
    expect(result.priority).toBe("NEXT");
  });

  it("detects regional BR opportunities from local language", () => {
    const result = classifySignalOpportunity({
      title: "Humor de Sao Paulo com audio de funk",
      caption: "Referencias locais para publico brasileiro",
      sourceTitle: "Instagram Reels",
      hashtags: ["brasil", "funk"],
      viewCount: BigInt(3_500_000),
      score: 74,
      market: "BR",
      hasSound: true,
    });

    expect(result.kind).toBe("regional_br");
    expect(result.title).toContain("Oportunidade regional BR");
    expect(result.nextAction).toContain("publico BR");
    expect(result.priority).toBe("NOW");
  });
});
