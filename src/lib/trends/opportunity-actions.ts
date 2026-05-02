export type OpportunityDecisionActionKey =
  | "save_for_brief"
  | "observe_trend"
  | "dismiss"
  | "mark_used"
  | "create_content_idea";

export type OpportunityDecisionSection = "action_now" | "saved" | "observing" | "used" | "hidden";
export type OpportunityDecisionQueueGroup = "ideas" | "saved" | "observing" | "used" | "hidden" | "none";

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
    body: "Guardar como referencia para roteiro, briefing ou calendario de conteudo.",
    cta: "Salvar para pauta",
    section: "saved",
    tone: "gold",
  },
  {
    key: "observe_trend",
    label: "Observar tendencia",
    shortLabel: "observando",
    body: "Manter em acompanhamento antes de virar pauta ou sair da fila ativa.",
    cta: "Observar tendencia",
    section: "observing",
    tone: "aqua",
  },
  {
    key: "dismiss",
    label: "Descartar",
    shortLabel: "descartado",
    body: "Tirar da fila ativa sem apagar o Reel, a midia ou as evidencias reais.",
    cta: "Descartar",
    section: "hidden",
    tone: "muted",
  },
  {
    key: "mark_used",
    label: "Marcar como usado",
    shortLabel: "usado",
    body: "Registrar que a oportunidade ja virou referencia aplicada ou pauta executada.",
    cta: "Marcar como usado",
    section: "used",
    tone: "hot",
  },
  {
    key: "create_content_idea",
    label: "Transformar em pauta",
    shortLabel: "ideia",
    body: "Promover para pauta ativa. Nesta fase nao gera conteudo automatico.",
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

export const opportunityDecisionGroupMeta = {
  ideas: {
    title: "Pautas criadas",
    shortTitle: "pauta",
    body: "Reels que ja viraram uma ideia de conteudo para executar.",
    empty: "Nenhuma pauta criada ainda.",
    tone: "hot",
  },
  saved: {
    title: "Salvos",
    shortTitle: "salvo",
    body: "Referencias boas, mas ainda sem roteiro decidido.",
    empty: "Nada salvo para depois.",
    tone: "gold",
  },
  observing: {
    title: "Observando",
    shortTitle: "observando",
    body: "Oportunidades que merecem nova leitura antes de agir.",
    empty: "Nenhum Reel em observacao.",
    tone: "aqua",
  },
  used: {
    title: "Ja usados",
    shortTitle: "usado",
    body: "Referencias que ja foram aproveitadas ou executadas.",
    empty: "Nada marcado como usado.",
    tone: "hot",
  },
  hidden: {
    title: "Descartados",
    shortTitle: "descartado",
    body: "Fora da fila ativa, mas preservados na biblioteca.",
    empty: "Nada descartado.",
    tone: "muted",
  },
  none: {
    title: "Sem decisao",
    shortTitle: "novo",
    body: "Ainda esperando uma escolha no Opportunity Brief.",
    empty: "Abra um Reel para tomar a primeira decisao.",
    tone: "muted",
  },
} satisfies Record<
  OpportunityDecisionQueueGroup,
  {
    title: string;
    shortTitle: string;
    body: string;
    empty: string;
    tone: OpportunityDecisionMeta["tone"];
  }
>;

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

export function getOpportunityDecisionQueueGroup(
  decision?: Pick<OpportunityDecisionView, "action" | "section">,
): OpportunityDecisionQueueGroup {
  if (!decision) {
    return "none";
  }

  if (decision.action === "create_content_idea") {
    return "ideas";
  }

  if (decision.section === "saved") {
    return "saved";
  }

  if (decision.section === "observing") {
    return "observing";
  }

  if (decision.section === "used") {
    return "used";
  }

  if (decision.section === "hidden") {
    return "hidden";
  }

  return "none";
}

export function shouldShowInActionNow(decision?: Pick<OpportunityDecisionView, "section">) {
  return !decision || (decision.section !== "hidden" && decision.section !== "used");
}
