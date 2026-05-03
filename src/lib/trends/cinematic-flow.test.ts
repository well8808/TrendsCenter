import { describe, expect, it } from "vitest";

import { buildCinematicFlow, summarizeCinematicLibrary } from "@/lib/trends/cinematic-flow";

describe("cinematic flow helpers", () => {
  it("connects a real reel through signal, brief, content idea and studio draft", () => {
    const stages = buildCinematicFlow({
      videoId: "video-1",
      title: "Reel real com thumbnail",
      creator: "espn",
      origin: "BRIGHT_DATA",
      market: "US",
      trendScore: 86,
      views: 1_200_000,
      signal: {
        id: "signal-1",
        title: "Formato esportivo replicavel",
        score: 84,
      },
      decision: {
        action: "create_content_idea",
        label: "Transformar em pauta",
        shortLabel: "ideia",
        section: "saved",
      },
      contentDraft: {
        id: "draft-1",
        title: "Roteiro de bastidor esportivo",
        status: "DRAFT",
        statusLabel: "Rascunho",
      },
    });

    expect(stages.map((stage) => stage.key)).toEqual(["reel", "signal", "brief", "idea", "studio"]);
    expect(stages.every((stage) => stage.href)).toBe(true);
    expect(stages.find((stage) => stage.key === "studio")).toMatchObject({
      state: "complete",
      tone: "aqua",
      metric: "Rascunho",
    });
  });

  it("stays honest when there is no related signal or draft", () => {
    const stages = buildCinematicFlow({
      videoId: "video-2",
      title: "Reel com dados limitados",
      origin: "BRIGHT_DATA",
      trendScore: 42,
    });

    expect(stages.find((stage) => stage.key === "signal")).toMatchObject({
      title: "Leitura por dados",
      state: "current",
      tone: "muted",
    });
    expect(stages.find((stage) => stage.key === "idea")).toMatchObject({
      title: "Decisao pendente",
      state: "current",
    });
    expect(stages.find((stage) => stage.key === "studio")).toMatchObject({
      title: "Studio aguardando",
      state: "waiting",
    });
  });

  it("summarizes the library without inventing queue counts", () => {
    const summary = summarizeCinematicLibrary([
      { trendScore: 91, decision: { action: "create_content_idea", section: "saved" }, contentDraft: { id: "draft-1" } },
      { trendScore: 76, decision: { action: "observe_trend", section: "observing" } },
      { trendScore: 62, decision: { action: "mark_used", section: "used" } },
      { trendScore: 20, decision: { action: "dismiss", section: "hidden" } },
    ]);

    expect(summary).toEqual({
      total: 4,
      actionNow: 2,
      ideas: 1,
      drafts: 1,
      highSignal: 1,
      topScore: 91,
    });
  });
});
