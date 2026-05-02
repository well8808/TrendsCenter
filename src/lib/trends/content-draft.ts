import type { ContentIdeaBrief } from "@/lib/trends/content-idea-brief";

export type ContentDraftStatusKey = "DRAFT" | "READY" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export const contentDraftStatusOrder: ContentDraftStatusKey[] = [
  "DRAFT",
  "READY",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

export const contentDraftStatusMeta = {
  DRAFT: {
    label: "Rascunho",
    laneTitle: "Rascunhos",
    body: "Ideias abertas para transformar em roteiro.",
    empty: "Nenhum roteiro em rascunho.",
    tone: "gold",
  },
  READY: {
    label: "Pronto",
    laneTitle: "Prontos",
    body: "Pautas revisadas e prontas para gravar.",
    empty: "Nada pronto ainda.",
    tone: "hot",
  },
  SCHEDULED: {
    label: "Agendado",
    laneTitle: "Agendados",
    body: "Conteudos com data planejada.",
    empty: "Nenhum conteudo agendado.",
    tone: "aqua",
  },
  PUBLISHED: {
    label: "Publicado",
    laneTitle: "Publicados",
    body: "Ideias que ja sairam do papel.",
    empty: "Nada publicado por aqui ainda.",
    tone: "muted",
  },
  ARCHIVED: {
    label: "Arquivado",
    laneTitle: "Arquivados",
    body: "Roteiros fora da fila ativa.",
    empty: "Nenhum roteiro arquivado.",
    tone: "muted",
  },
} satisfies Record<
  ContentDraftStatusKey,
  {
    label: string;
    laneTitle: string;
    body: string;
    empty: string;
    tone: "hot" | "gold" | "aqua" | "muted";
  }
>;

export interface ContentDraftCopyShape {
  title: string;
  centralIdea: string;
  hook: string;
  scriptDraft: string;
  captionDraft: string;
  cta: string;
  structureText: string;
  riskNotes: string;
  notes?: string | null;
  status?: ContentDraftStatusKey | string;
}

export interface InitialContentDraftInput {
  title: string;
  centralIdea: string;
  hook: string;
  scriptDraft: string;
  captionDraft: string;
  cta: string;
  structureText: string;
  riskNotes: string;
  evidenceJson: string[];
  status: ContentDraftStatusKey;
  source: string;
}

export interface ContentDraftSummary {
  id: string;
  title: string;
  status: ContentDraftStatusKey;
  statusLabel: string;
  hook: string;
  captionPreview: string;
  updatedAt?: string;
}

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function clipText(value: string | null | undefined, fallback: string, max = 140) {
  const text = cleanText(value) || fallback;

  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function structureText(idea: ContentIdeaBrief) {
  return idea.suggestedStructure.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

function scriptFromIdea(idea: ContentIdeaBrief) {
  return [
    `Gancho: ${idea.hook}`,
    "",
    "Roteiro inicial:",
    ...idea.suggestedStructure.map((step, index) => `${index + 1}. ${step}`),
    "",
    `CTA: ${idea.cta}`,
    "",
    `Cuidados: ${idea.riskNotes}`,
  ].join("\n");
}

export function normalizeContentDraftStatus(value: unknown): ContentDraftStatusKey {
  if (typeof value !== "string") {
    return "DRAFT";
  }

  const normalized = value.trim().toUpperCase();

  return contentDraftStatusOrder.includes(normalized as ContentDraftStatusKey)
    ? (normalized as ContentDraftStatusKey)
    : "DRAFT";
}

export function buildInitialContentDraftInput(idea: ContentIdeaBrief): InitialContentDraftInput {
  return {
    title: clipText(idea.title, "Pauta criada a partir de Reel real", 160),
    centralIdea: cleanText(idea.angle) || "Ideia a validar com base no Reel original.",
    hook: cleanText(idea.hook) || "Gancho a validar no Reel original.",
    scriptDraft: scriptFromIdea(idea),
    captionDraft: cleanText(idea.captionStarter) || "Legenda inicial a revisar antes de publicar.",
    cta: cleanText(idea.cta) || "Adaptar com asset proprio e revisar antes de publicar.",
    structureText: structureText(idea),
    riskNotes: cleanText(idea.riskNotes) || "Nao copiar a peca original; adaptar a logica.",
    evidenceJson: idea.evidence,
    status: "DRAFT",
    source: "OPPORTUNITY_BRIEF",
  };
}

export function formatContentDraftForCopy(draft: ContentDraftCopyShape) {
  const status = contentDraftStatusMeta[normalizeContentDraftStatus(draft.status)].label;
  const notes = cleanText(draft.notes ?? undefined);

  return [
    draft.title,
    "",
    `Status: ${status}`,
    `Ideia central: ${draft.centralIdea}`,
    `Gancho: ${draft.hook}`,
    "",
    "Estrutura:",
    draft.structureText,
    "",
    "Roteiro:",
    draft.scriptDraft,
    "",
    `Legenda: ${draft.captionDraft}`,
    `CTA: ${draft.cta}`,
    `Cuidados: ${draft.riskNotes}`,
    notes ? `Notas: ${notes}` : null,
  ].filter(Boolean).join("\n");
}

export function getContentDraftSummary(
  draft: {
    id: string;
    title: string;
    hook: string;
    captionDraft: string;
    status: ContentDraftStatusKey | string;
    updatedAt?: Date | string;
  },
): ContentDraftSummary {
  const status = normalizeContentDraftStatus(draft.status);
  const updatedAt =
    draft.updatedAt instanceof Date
      ? draft.updatedAt.toISOString()
      : typeof draft.updatedAt === "string"
        ? draft.updatedAt
        : undefined;

  return {
    id: draft.id,
    title: clipText(draft.title, "Roteiro sem titulo", 120),
    status,
    statusLabel: contentDraftStatusMeta[status].label,
    hook: clipText(draft.hook, "Gancho a revisar", 116),
    captionPreview: clipText(draft.captionDraft, "Legenda a revisar", 116),
    updatedAt,
  };
}

export function groupContentDraftsByStatus<T extends { status: ContentDraftStatusKey | string }>(drafts: T[]) {
  return contentDraftStatusOrder.reduce<Record<ContentDraftStatusKey, T[]>>((groups, status) => {
    groups[status] = drafts.filter((draft) => normalizeContentDraftStatus(draft.status) === status);
    return groups;
  }, {
    DRAFT: [],
    READY: [],
    SCHEDULED: [],
    PUBLISHED: [],
    ARCHIVED: [],
  });
}
