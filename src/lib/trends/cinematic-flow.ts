import type { ContentDraftSummary } from "@/lib/trends/content-draft";
import type { OpportunityDecisionView } from "@/lib/trends/opportunity-actions";

export type CinematicFlowStageKey = "reel" | "signal" | "brief" | "idea" | "studio";
export type CinematicFlowStageState = "complete" | "current" | "waiting";
export type CinematicTone = "hot" | "gold" | "aqua" | "muted";

export interface CinematicFlowSignalInput {
  id?: string;
  title?: string;
  score?: number;
  confidence?: string;
}

export interface CinematicFlowInput {
  videoId: string;
  title: string;
  creator?: string;
  origin?: string;
  market?: string;
  trendScore?: number;
  views?: number;
  growthViews?: number;
  evidenceCount?: number;
  signal?: CinematicFlowSignalInput;
  relatedSignalCount?: number;
  decision?: Pick<OpportunityDecisionView, "action" | "label" | "shortLabel" | "section">;
  contentDraft?: Pick<ContentDraftSummary, "id" | "title" | "statusLabel" | "status">;
}

export interface CinematicFlowStage {
  key: CinematicFlowStageKey;
  label: string;
  title: string;
  body: string;
  href?: string;
  state: CinematicFlowStageState;
  tone: CinematicTone;
  metric?: string;
}

export interface CinematicLibrarySummary {
  total: number;
  actionNow: number;
  ideas: number;
  drafts: number;
  highSignal: number;
  topScore: number;
}

export interface CinematicLibrarySummaryInput {
  trendScore?: number;
  decision?: {
    action?: string;
    section?: string;
  };
  contentDraft?: {
    id?: string;
  };
}

export interface CinematicFlowProgress {
  completed: number;
  total: number;
  percent: number;
  current?: CinematicFlowStage;
  next?: CinematicFlowStage;
  label: string;
  summary: string;
  actionLabel: string;
}

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function compactNumber(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return compactFormatter.format(value);
}

function hasDecision(input: CinematicFlowInput) {
  return Boolean(input.decision?.action);
}

function isIdeaDecision(input: CinematicFlowInput) {
  return input.decision?.action === "create_content_idea";
}

function toneFromScore(score?: number): CinematicTone {
  if (typeof score !== "number") return "muted";
  if (score >= 78) return "hot";
  if (score >= 52) return "gold";
  return "aqua";
}

function stageState(complete: boolean, current: boolean): CinematicFlowStageState {
  if (complete) return "complete";
  return current ? "current" : "waiting";
}

export function buildCinematicFlow(input: CinematicFlowInput): CinematicFlowStage[] {
  const signalCount = input.relatedSignalCount ?? (input.signal ? 1 : 0);
  const hasSignal = signalCount > 0;
  const ideaReady = isIdeaDecision(input);
  const draftReady = Boolean(input.contentDraft?.id);
  const scoreMetric = typeof input.trendScore === "number" ? `${input.trendScore}/100` : undefined;
  const viewsMetric = compactNumber(input.views);
  const origin = input.creator ? `@${input.creator}` : input.origin ?? "fonte real";

  return [
    {
      key: "reel",
      label: "1",
      title: "Reel detectado",
      body: `${origin}${input.market ? ` / ${input.market}` : ""}`,
      href: `/trends/${input.videoId}`,
      state: "complete",
      tone: toneFromScore(input.trendScore),
      metric: viewsMetric ?? scoreMetric,
    },
    {
      key: "signal",
      label: "2",
      title: hasSignal ? "Signal conectado" : "Leitura por dados",
      body: input.signal?.title ?? (hasSignal ? `${signalCount} sinais relacionados` : "Sem Signal vinculado; brief usa metricas do Reel."),
      href: `/trends/${input.videoId}#sinais-relacionados`,
      state: stageState(hasSignal, !hasSignal),
      tone: hasSignal ? toneFromScore(input.signal?.score ?? input.trendScore) : "muted",
      metric: hasSignal ? `${signalCount}` : undefined,
    },
    {
      key: "brief",
      label: "3",
      title: "Opportunity Brief",
      body: "O que aconteceu, por que importa e qual acao tomar.",
      href: `/trends/${input.videoId}#opportunity-brief`,
      state: "complete",
      tone: "aqua",
      metric: scoreMetric,
    },
    {
      key: "idea",
      label: "4",
      title: ideaReady ? "Pauta criada" : hasDecision(input) ? "Decisao tomada" : "Decisao pendente",
      body: input.decision?.label ?? "Escolha salvar, observar, descartar, usar ou transformar em pauta.",
      href: `/trends/${input.videoId}#content-idea-brief`,
      state: stageState(ideaReady, !ideaReady),
      tone: ideaReady ? "hot" : hasDecision(input) ? "gold" : "muted",
      metric: input.decision?.shortLabel,
    },
    {
      key: "studio",
      label: "5",
      title: draftReady ? "Draft no Estudio" : "Studio aguardando",
      body: input.contentDraft?.title ?? "Crie um roteiro editavel quando a pauta estiver pronta.",
      href: draftReady ? `/studio/${input.contentDraft?.id}` : "/studio",
      state: stageState(draftReady, ideaReady && !draftReady),
      tone: draftReady ? "aqua" : "muted",
      metric: input.contentDraft?.statusLabel,
    },
  ];
}

export function summarizeCinematicLibrary(
  items: CinematicLibrarySummaryInput[],
): CinematicLibrarySummary {
  return items.reduce<CinematicLibrarySummary>(
    (summary, item) => {
      const action = item.decision?.action;
      const hiddenOrUsed = item.decision?.section === "hidden" || item.decision?.section === "used";

      summary.total += 1;
      summary.topScore = Math.max(summary.topScore, item.trendScore ?? 0);
      if (!hiddenOrUsed) summary.actionNow += 1;
      if (action === "create_content_idea") summary.ideas += 1;
      if (item.contentDraft?.id) summary.drafts += 1;
      if ((item.trendScore ?? 0) >= 78) summary.highSignal += 1;

      return summary;
    },
    {
      total: 0,
      actionNow: 0,
      ideas: 0,
      drafts: 0,
      highSignal: 0,
      topScore: 0,
    },
  );
}

function stageActionLabel(stage?: CinematicFlowStage) {
  if (!stage) return "Fluxo completo";

  if (stage.key === "signal") return "Validar Signal";
  if (stage.key === "brief") return "Ler Brief";
  if (stage.key === "idea") return "Decidir pauta";
  if (stage.key === "studio") return "Continuar no Studio";

  return "Abrir Reel";
}

function stageSummary(stage?: CinematicFlowStage, next?: CinematicFlowStage) {
  if (!stage) {
    return "O Reel ja virou leitura, pauta e roteiro. Use o Studio para finalizar ou publicar.";
  }

  if (stage.key === "signal") {
    return "O Reel ja esta no arquivo; agora falta conectar ou revisar o sinal estrategico por tras dele.";
  }

  if (stage.key === "brief") {
    return "A proxima leitura deve explicar o que aconteceu, por que importa e qual acao faz sentido.";
  }

  if (stage.key === "idea") {
    return "A oportunidade esta pronta para uma decisao: salvar, observar, descartar, usar ou transformar em pauta.";
  }

  if (stage.key === "studio") {
    return next
      ? "A pauta existe; o proximo passo e abrir ou criar o roteiro editavel no Studio."
      : "A pauta ja pode continuar para roteiro, edicao e publicacao no Studio.";
  }

  return "Comece pelo artefato real: origem, metricas, creator e prova preservada.";
}

export function deriveCinematicFlowProgress(stages: CinematicFlowStage[]): CinematicFlowProgress {
  const total = stages.length;
  const completed = stages.filter((stage) => stage.state === "complete").length;
  const current = stages.find((stage) => stage.state === "current")
    ?? stages.find((stage) => stage.state === "waiting");
  const next = current
    ? stages.slice(stages.findIndex((stage) => stage.key === current.key) + 1).find((stage) => stage.state !== "complete")
    : undefined;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent,
    current,
    next,
    label: total > 0 ? `${completed}/${total}` : "0/0",
    summary: stageSummary(current, next),
    actionLabel: stageActionLabel(current ?? next),
  };
}
