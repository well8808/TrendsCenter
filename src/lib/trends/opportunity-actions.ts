export type OpportunityDecisionActionKey =
  | "save_for_brief"
  | "observe_trend"
  | "dismiss"
  | "mark_used"
  | "create_content_idea";

export type OpportunityDecisionSection = "action_now" | "saved" | "observing" | "used" | "hidden";

export interface OpportunityDecisionMeta {
  key: OpportunityDecisionActionKey;
  label: string;
  shortLabel: string;
  body: string;
  cta: string;
  section: OpportunityDecisionSection;
  tone: "hot" | "gold" | "aqua" | "muted";
}

export const opportunityDecisionActions: OpportunityDecisionMeta[] = [
  {
    key: "save_for_brief",
    label: "Salvar para pauta",
    shortLabel: "pauta",
    body: "Guardar este Reel como referencia para transformar em roteiro ou pauta depois.",
    cta: "Salvar para pauta",
    section: "saved",
    tone: "gold",
  },
  {
    key: "observe_trend",
    label: "Observar tendencia",
    shortLabel: "observando",
    body: "Manter em acompanhamento e decidir depois de uma nova leitura ou coleta.",
    cta: "Observar tendencia",
    section: "observing",
    tone: "aqua",
  },
  {
    key: "dismiss",
    label: "Descartar",
    shortLabel: "descartado",
    body: "Remover da fila ativa sem apagar o Reel ou as evidencias reais.",
    cta: "Descartar",
    section: "hidden",
    tone: "muted",
  },
  {
    key: "mark_used",
    label: "Marcar como usado",
    shortLabel: "usado",
    body: "Indicar que este Reel ja virou referencia aplicada ou pauta executada.",
    cta: "Marcar como usado",
    section: "used",
    tone: "hot",
  },
  {
    key: "create_content_idea",
    label: "Transformar em pauta",
    shortLabel: "ideia",
    body: "Criar uma decisao persistida de pauta/ideia sem gerar conteudo automatico nesta fase.",
    cta: "Transformar em pauta",
    section: "saved",
    tone: "hot",
  },
];

export const opportunityDecisionActionKeys = opportunityDecisionActions.map((action) => action.key);

export interface OpportunityDecisionView {
  id: string;
  action: OpportunityDecisionActionKey;
  label: string;
  shortLabel: string;
  body: string;
  section: OpportunityDecisionSection;
  tone: OpportunityDecisionMeta["tone"];
  notes?: string;
  updatedAt: string;
}

export function getOpportunityDecisionMeta(action: OpportunityDecisionActionKey): OpportunityDecisionMeta {
  return opportunityDecisionActions.find((item) => item.key === action) ?? opportunityDecisionActions[0];
}

export function normalizeOpportunityDecisionAction(value: unknown): OpportunityDecisionActionKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return opportunityDecisionActionKeys.includes(normalized as OpportunityDecisionActionKey)
    ? (normalized as OpportunityDecisionActionKey)
    : null;
}

export function recommendedDecisionFromBriefAction(action: string): OpportunityDecisionActionKey {
  if (action === "act_now") {
    return "create_content_idea";
  }

  if (action === "save_agenda") {
    return "save_for_brief";
  }

  if (action === "watch_trend") {
    return "observe_trend";
  }

  return "dismiss";
}

export function shouldShowInActionNow(decision?: Pick<OpportunityDecisionView, "section">) {
  return !decision || (decision.section !== "hidden" && decision.section !== "used");
}
