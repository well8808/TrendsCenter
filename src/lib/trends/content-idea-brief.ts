import type { OpportunityDecisionView } from "@/lib/trends/opportunity-actions";
import type { OpportunityBrief } from "@/lib/trends/opportunity-brief";

export interface ContentIdeaBriefReelInput {
  title: string;
  caption?: string;
  creator?: string;
  market: string;
  origin: string;
  trendScore: number;
  views: number;
  growthViews: number;
  evidenceCount: number;
  snapshotCount: number;
  sound?: string;
  hashtags: string[];
}

export interface ContentIdeaBriefSignalInput {
  title: string;
  summary?: string;
  decision?: string;
  nextAction?: string;
  confidence?: string;
  evidenceCount?: number;
  score?: number;
  scoreDrivers?: string[];
}

export interface ContentIdeaBriefInput {
  reel: ContentIdeaBriefReelInput;
  opportunityBrief: OpportunityBrief;
  decision?: OpportunityDecisionView;
  signal?: ContentIdeaBriefSignalInput;
}

export interface ContentIdeaBrief {
  isReady: boolean;
  title: string;
  hook: string;
  angle: string;
  formatToCopy: string;
  suggestedStructure: string[];
  captionStarter: string;
  cta: string;
  adaptationNotes: string;
  riskNotes: string;
  evidence: string[];
  confidenceLabel: "Alta" | "Media" | "Baixa";
}

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompact(value: number | undefined) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return compactFormatter.format(Math.max(0, Number(value)));
}

function cleanText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function clipText(value: string | undefined, fallback: string, max = 116) {
  const text = cleanText(value) || fallback;

  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function confidenceLabelFor(input: ContentIdeaBriefInput): ContentIdeaBrief["confidenceLabel"] {
  const signalConfidence = input.signal?.confidence?.toLowerCase();
  const confidence = signalConfidence || input.opportunityBrief.provenance.confidence;

  if (confidence === "high" || confidence === "alta") return "Alta";
  if (confidence === "medium" || confidence === "media") return "Media";

  return "Baixa";
}

function captionIsUseful(caption: string | undefined) {
  return cleanText(caption).length >= 28;
}

function hookFor(input: ContentIdeaBriefInput) {
  if (captionIsUseful(input.reel.caption)) {
    return `Use a abertura da caption real como referencia: "${clipText(input.reel.caption, "", 86)}"`;
  }

  return "Gancho a validar no Reel original; a caption salva ainda nao sustenta uma promessa especifica.";
}

function angleFor(input: ContentIdeaBriefInput) {
  const signalDecision = cleanText(input.signal?.decision);

  if (signalDecision) {
    return clipText(signalDecision, "Adaptar a oportunidade detectada no Signal.", 118);
  }

  return `Adaptar um formato de ${input.opportunityBrief.opportunityType.toLowerCase()} para o mercado ${input.reel.market}.`;
}

function captionStarterFor(input: ContentIdeaBriefInput) {
  if (captionIsUseful(input.reel.caption)) {
    return `Comece pela logica da caption real: "${clipText(input.reel.caption, "", 92)}"`;
  }

  if (input.reel.creator) {
    return `Comece com uma frase direta sobre o aprendizado observado em @${input.reel.creator}.`;
  }

  return "Comece com uma frase direta sobre o aprendizado principal do Reel e valide o texto na fonte original.";
}

function ctaFor(input: ContentIdeaBriefInput) {
  if (input.decision?.action === "create_content_idea") {
    return "Transformar este insight em roteiro curto e testar com asset proprio.";
  }

  if (input.opportunityBrief.action.key === "watch_trend") {
    return "Observar a proxima coleta antes de produzir.";
  }

  if (input.opportunityBrief.action.key === "discard_now") {
    return "Manter fora da pauta ate surgir mais evidencia.";
  }

  return "Transformar em pauta para organizar gancho, estrutura e CTA.";
}

function riskNotesFor(input: ContentIdeaBriefInput) {
  const notes = ["Nao copiar a peca; copiar apenas a logica do formato com asset proprio/licenciado."];

  if (input.reel.sound) {
    notes.push("Checar direito de uso do audio antes de publicar.");
  }

  if (!captionIsUseful(input.reel.caption)) {
    notes.push("Caption limitada: confirme gancho e contexto abrindo o Reel original.");
  }

  return notes.join(" ");
}

function evidenceFor(input: ContentIdeaBriefInput) {
  const evidence: string[] = [];
  const proofCount = Math.max(input.reel.evidenceCount, input.reel.snapshotCount);

  if (input.reel.trendScore > 0) {
    evidence.push(`Score real: ${input.reel.trendScore}/100.`);
  }

  if (input.reel.views > 0) {
    evidence.push(`Views reais: ${formatCompact(input.reel.views)}.`);
  }

  if (input.reel.growthViews > 0) {
    evidence.push(`Crescimento registrado: ${formatCompact(input.reel.growthViews)} views.`);
  }

  if (proofCount > 0) {
    evidence.push(`${proofCount} prova${proofCount === 1 ? "" : "s"} ou leitura${proofCount === 1 ? "" : "s"} salva${proofCount === 1 ? "" : "s"}.`);
  }

  if (input.signal) {
    evidence.push(`Signal relacionado: ${clipText(input.signal.title, "Signal relacionado", 86)}.`);
  }

  if (input.reel.origin) {
    evidence.push(`Fonte real: ${input.reel.origin}.`);
  }

  if (evidence.length === 0) {
    evidence.push("Evidencia limitada: use como observacao, nao como certeza de pauta.");
  }

  return evidence;
}

export function buildContentIdeaBrief(input: ContentIdeaBriefInput): ContentIdeaBrief {
  const isReady = input.decision?.action === "create_content_idea";
  const titlePrefix = isReady ? "Pauta pronta" : "Rascunho de pauta";
  const angle = angleFor(input);
  const formatToCopy = input.opportunityBrief.replicableFormat.copyableElement;
  const hook = hookFor(input);
  const cta = ctaFor(input);

  return {
    isReady,
    title: `${titlePrefix}: ${clipText(angle, "adaptar oportunidade do Reel", 72)}`,
    hook,
    angle,
    formatToCopy,
    suggestedStructure: [
      captionIsUseful(input.reel.caption)
        ? "Abrir com a promessa, contraste ou cena sugerida pela caption real."
        : "Abrir com uma cena forte do seu proprio acervo e validar o gancho no Reel original.",
      `Contextualizar rapidamente para o mercado ${input.reel.market}.`,
      `Recriar a logica de ${input.opportunityBrief.opportunityType.toLowerCase()} sem copiar a peca original.`,
      `Fechar com CTA simples: ${cta}`,
    ],
    captionStarter: captionStarterFor(input),
    cta,
    adaptationNotes: input.opportunityBrief.replicableFormat.adaptation,
    riskNotes: riskNotesFor(input),
    evidence: evidenceFor(input),
    confidenceLabel: confidenceLabelFor(input),
  };
}
