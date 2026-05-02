import { describe, expect, it } from "vitest";

import {
  buildInitialContentDraftInput,
  formatContentDraftForCopy,
  getContentDraftSummary,
  groupContentDraftsByStatus,
  normalizeContentDraftStatus,
} from "@/lib/trends/content-draft";
import type { ContentIdeaBrief } from "@/lib/trends/content-idea-brief";

const idea: ContentIdeaBrief = {
  isReady: true,
  title: "Pauta pronta: adaptar formato de bastidor com prova social",
  hook: "Use uma cena de bastidor como abertura.",
  angle: "Adaptar bastidor com prova social para o mercado BR.",
  formatToCopy: "Bastidor rapido com contexto e fechamento direto.",
  suggestedStructure: [
    "Abrir com cena forte.",
    "Mostrar contexto rapido.",
    "Destacar elemento replicavel.",
    "Fechar com CTA simples.",
  ],
  captionStarter: "Comece com uma frase direta sobre o bastidor.",
  cta: "Salve esta ideia para adaptar depois.",
  adaptationNotes: "Use asset proprio e mantenha a logica do formato.",
  riskNotes: "Nao copiar a peca original.",
  evidence: ["Score real: 84/100.", "Views reais: 1 mi.", "Fonte real: LICENSED_PROVIDER."],
  confidenceLabel: "Alta",
};

describe("content draft helpers", () => {
  it("normalizes draft statuses defensively", () => {
    expect(normalizeContentDraftStatus("ready")).toBe("READY");
    expect(normalizeContentDraftStatus("published")).toBe("PUBLISHED");
    expect(normalizeContentDraftStatus("invalid")).toBe("DRAFT");
    expect(normalizeContentDraftStatus(null)).toBe("DRAFT");
  });

  it("builds an editable draft from a real content idea brief", () => {
    const draft = buildInitialContentDraftInput(idea);

    expect(draft.status).toBe("DRAFT");
    expect(draft.source).toBe("OPPORTUNITY_BRIEF");
    expect(draft.title).toContain("Pauta pronta");
    expect(draft.scriptDraft).toContain("Roteiro inicial");
    expect(draft.scriptDraft).toContain(idea.hook);
    expect(draft.evidenceJson).toEqual(idea.evidence);
  });

  it("formats the draft as copyable production material", () => {
    const draft = buildInitialContentDraftInput(idea);
    const copy = formatContentDraftForCopy({
      ...draft,
      id: "draft-1",
      notes: "Revisar com asset proprio.",
    });

    expect(copy).toContain("Ideia central:");
    expect(copy).toContain("Roteiro:");
    expect(copy).toContain("Legenda:");
    expect(copy).toContain("Revisar com asset proprio.");
  });

  it("groups drafts by operational status without duplicating records", () => {
    const groups = groupContentDraftsByStatus([
      { id: "a", status: "DRAFT" },
      { id: "b", status: "READY" },
      { id: "c", status: "READY" },
      { id: "d", status: "ARCHIVED" },
    ]);

    expect(groups.DRAFT.map((item) => item.id)).toEqual(["a"]);
    expect(groups.READY.map((item) => item.id)).toEqual(["b", "c"]);
    expect(groups.ARCHIVED.map((item) => item.id)).toEqual(["d"]);
  });

  it("summarizes long drafts for cards", () => {
    const summary = getContentDraftSummary({
      id: "draft-1",
      status: "SCHEDULED",
      title: "Titulo util",
      hook: "Gancho muito util para o roteiro",
      captionDraft: "Legenda inicial pronta para editar",
      updatedAt: new Date("2026-05-02T12:00:00.000Z"),
    });

    expect(summary.statusLabel).toBe("Agendado");
    expect(summary.updatedAt).toBe("2026-05-02T12:00:00.000Z");
  });
});
