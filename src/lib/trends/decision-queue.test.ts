import { describe, expect, it } from "vitest";

import {
  mapOpportunityDecisionRecord,
} from "@/lib/trends/decision-queue";
import {
  getOpportunityDecisionMeta,
  normalizeOpportunityDecisionAction,
  recommendedDecisionFromBriefAction,
  shouldShowInActionNow,
} from "@/lib/trends/opportunity-actions";

describe("opportunity decision actions", () => {
  it("normalizes only supported action keys", () => {
    expect(normalizeOpportunityDecisionAction("save_for_brief")).toBe("save_for_brief");
    expect(normalizeOpportunityDecisionAction(" OBSERVE_TREND ")).toBe("observe_trend");
    expect(normalizeOpportunityDecisionAction("unknown")).toBeNull();
    expect(normalizeOpportunityDecisionAction(null)).toBeNull();
  });

  it("maps brief recommendations to persistent queue actions", () => {
    expect(recommendedDecisionFromBriefAction("act_now")).toBe("create_content_idea");
    expect(recommendedDecisionFromBriefAction("save_agenda")).toBe("save_for_brief");
    expect(recommendedDecisionFromBriefAction("watch_trend")).toBe("observe_trend");
    expect(recommendedDecisionFromBriefAction("discard_now")).toBe("dismiss");
  });

  it("keeps dismissed and used reels out of the action-now rail", () => {
    expect(shouldShowInActionNow()).toBe(true);
    expect(shouldShowInActionNow({ section: "saved" })).toBe(true);
    expect(shouldShowInActionNow({ section: "hidden" })).toBe(false);
    expect(shouldShowInActionNow({ section: "used" })).toBe(false);
  });

  it("maps persisted records to user-facing labels without leaking enum names", () => {
    const decision = mapOpportunityDecisionRecord({
      id: "dec-1",
      action: "CREATE_CONTENT_IDEA",
      label: "Transformar em pauta",
      notes: null,
      updatedAt: new Date("2026-05-02T12:00:00.000Z"),
    });

    expect(decision.action).toBe("create_content_idea");
    expect(decision.shortLabel).toBe("ideia");
    expect(decision.section).toBe("saved");
    expect(decision.updatedAt).toBe("2026-05-02T12:00:00.000Z");
  });

  it("defines the five product decisions required by the queue", () => {
    expect(getOpportunityDecisionMeta("save_for_brief").label).toBe("Salvar para pauta");
    expect(getOpportunityDecisionMeta("observe_trend").label).toBe("Observar tendencia");
    expect(getOpportunityDecisionMeta("dismiss").label).toBe("Descartar");
    expect(getOpportunityDecisionMeta("mark_used").label).toBe("Marcar como usado");
    expect(getOpportunityDecisionMeta("create_content_idea").label).toBe("Transformar em pauta");
  });
});
