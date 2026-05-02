export type OpportunityAction = "act_now" | "save_agenda" | "watch_trend" | "discard_now";

export interface OpportunityBriefInput {
  title: string;
  caption?: string;
  creator?: string;
  market: string;
  origin: string;
  trendScore: number;
  growthViews: number;
  velocityScore: number;
  accelerationScore: number;
  evidenceCount: number;
  snapshotCount: number;
  views: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  sound?: string;
  hashtags: string[];
  collectedAt?: string;
  postedAt?: string;
}

export interface OpportunityBrief {
  status: {
    label: string;
    tone: "hot" | "gold" | "aqua" | "muted";
    body: string;
  };
  opportunityType: string;
  cardReason: string;
  strategicSummary: string;
  whyItMatters: string;
  replicableFormat: {
    hook: string;
    structure: string;
    copyableElement: string;
    adaptation: string;
    confidenceNote: string;
  };
  action: {
    key: OpportunityAction;
    label: string;
    body: string;
    cta: string;
  };
  provenance: {
    source: string;
    collectedAt?: string;
    market: string;
    confidence: "high" | "medium" | "low";
    evidenceCount: number;
  };
}

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompact(value: number | undefined) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return compactFormatter.format(Math.max(0, safeValue));
}

function compactText(value: string | undefined, fallback: string, max = 96) {
  const text = value?.replace(/\s+/g, " ").trim() || fallback;

  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function normalizedText(input: OpportunityBriefInput) {
  return [
    input.title,
    input.caption,
    input.creator,
    input.sound,
    ...input.hashtags,
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function engagementRate(input: OpportunityBriefInput) {
  if (!input.views) return 0;

  return ((input.likes ?? 0) + (input.comments ?? 0) + (input.shares ?? 0) + (input.saves ?? 0)) / input.views;
}

function confidenceFor(input: OpportunityBriefInput): OpportunityBrief["provenance"]["confidence"] {
  const proofCount = Math.max(input.evidenceCount, input.snapshotCount);

  if (input.trendScore >= 78 && proofCount >= 2) return "high";
  if (input.trendScore >= 52 || proofCount >= 1 || input.views >= 100_000) return "medium";

  return "low";
}

function statusFor(input: OpportunityBriefInput): OpportunityBrief["status"] {
  if (input.trendScore >= 78 || input.velocityScore >= 72) {
    return {
      label: "pronto para agir",
      tone: "hot",
      body: "Sinal forte o suficiente para virar pauta ou teste criativo agora, mantendo a fonte original como referencia.",
    };
  }

  if (input.trendScore >= 60 || input.views >= 1_000_000) {
    return {
      label: "salvar para pauta",
      tone: "gold",
      body: "Bom candidato para roteiro ou comparacao com Reels similares antes de produzir.",
    };
  }

  if (input.trendScore >= 42 || input.snapshotCount > 1) {
    return {
      label: "observar tendencia",
      tone: "aqua",
      body: "Vale acompanhar novas coletas antes de transformar em decisao principal.",
    };
  }

  return {
    label: "baixo sinal",
    tone: "muted",
    body: "Dados ainda fracos para acao. Use apenas como contexto ou descarte por enquanto.",
  };
}

function opportunityTypeFor(input: OpportunityBriefInput) {
  const text = normalizedText(input);

  if (input.sound && hasAny(text, ["audio", "sound", "musica", "song", "remix", "trend"])) {
    return "Tendencia de audio";
  }

  if (hasAny(text, ["como", "tutorial", "passo", "dica", "guia", "aprenda", "how to", "tips"])) {
    return "Tutorial/educativo";
  }

  if (hasAny(text, ["produto", "marca", "brand", "drop", "colecao", "review", "unboxing", "loja"])) {
    return "Produto/marca";
  }

  if (hasAny(text, ["meme", "humor", "funny", "reaction", "react", "surprise", "fans"])) {
    return "Entretenimento replicavel";
  }

  if (hasAny(text, ["noticia", "news", "breaking", "evento", "anuncia", "oficial"])) {
    return "Evento/noticia";
  }

  if (hasAny(text, ["pov", "transicao", "transition", "visual", "template", "edit", "aesthetic", "estetica"])) {
    return "Trend visual";
  }

  if (input.creator && (input.views >= 500_000 || input.trendScore >= 62)) {
    return "Creator/figura publica";
  }

  if (input.views >= 1_000_000 || input.trendScore >= 70) {
    return "Alta tracao";
  }

  return "Formato replicavel";
}

function actionFor(input: OpportunityBriefInput): OpportunityBrief["action"] {
  if (input.trendScore >= 78 || input.velocityScore >= 72) {
    return {
      key: "act_now",
      label: "Fazer agora",
      body: "Abrir o Reel, mapear gancho e transformar em uma pauta curta com asset proprio/licenciado.",
      cta: "Transformar em pauta",
    };
  }

  if (input.trendScore >= 60 || input.views >= 1_000_000) {
    return {
      key: "save_agenda",
      label: "Salvar para pauta",
      body: "Guardar como referencia e comparar com mais 2 ou 3 Reels antes de produzir.",
      cta: "Usar como inspiracao",
    };
  }

  if (input.trendScore >= 42 || input.snapshotCount > 1) {
    return {
      key: "watch_trend",
      label: "Observar evolucao",
      body: "Rodar nova leitura depois e confirmar se o sinal cresce ou perde forca.",
      cta: "Observar evolucao",
    };
  }

  return {
    key: "discard_now",
    label: "Descartar por enquanto",
    body: "Nao transformar em pauta agora; os dados ainda nao sustentam prioridade.",
    cta: "Manter fora da pauta",
  };
}

function hookFor(input: OpportunityBriefInput) {
  const caption = compactText(input.caption, "", 92);

  if (caption.length >= 28) {
    return caption;
  }

  if (input.title) {
    return compactText(input.title, "Reel importado", 92);
  }

  return "Legenda limitada; o gancho precisa ser confirmado abrindo o Reel original.";
}

function structureFor(input: OpportunityBriefInput) {
  if (input.sound && input.hashtags.length > 0) {
    return `Gancho visual + audio "${compactText(input.sound, "audio", 34)}" + hashtags ${input.hashtags.slice(0, 2).map((tag) => `#${tag}`).join(" ")}`;
  }

  if (input.sound) {
    return `Gancho visual + audio "${compactText(input.sound, "audio", 42)}" + prova de alcance.`;
  }

  if (input.hashtags.length > 0) {
    return `Caption/thumbnail + hashtags ${input.hashtags.slice(0, 3).map((tag) => `#${tag}`).join(" ")} + prova de alcance.`;
  }

  return "Thumbnail + caption curta + metricas reais. Estrutura criativa ainda precisa de leitura manual do Reel.";
}

function copyableElementFor(input: OpportunityBriefInput, opportunityType: string) {
  if (opportunityType === "Tendencia de audio") {
    return "O ritmo/entrada do audio pode inspirar um teste, desde que exista direito de uso comercial.";
  }

  if (opportunityType === "Tutorial/educativo") {
    return "A sequencia de promessa, demonstracao e fechamento pode virar roteiro curto.";
  }

  if (opportunityType === "Produto/marca") {
    return "A forma de apresentar beneficio/prova do produto pode ser adaptada sem copiar a peca original.";
  }

  if (opportunityType === "Trend visual") {
    return "A composicao visual ou transicao pode virar template com asset proprio.";
  }

  if (input.creator) {
    return `O enquadramento usado por @${input.creator} pode indicar tom, gancho ou ritmo replicavel.`;
  }

  return "Gancho, duracao percebida, thumbnail e promessa principal devem ser extraidos como referencia.";
}

export function buildOpportunityBrief(input: OpportunityBriefInput): OpportunityBrief {
  const opportunityType = opportunityTypeFor(input);
  const status = statusFor(input);
  const action = actionFor(input);
  const confidence = confidenceFor(input);
  const proofCount = Math.max(input.evidenceCount, input.snapshotCount);
  const engagement = engagementRate(input);
  const engagementCopy = engagement > 0 ? `, engajamento observado de ${(engagement * 100).toFixed(1)}%` : "";
  const creatorCopy = input.creator ? `@${input.creator}` : input.origin;
  const scoreCopy = `score ${input.trendScore}/100`;
  const viewsCopy = `${formatCompact(input.views)} views`;
  const growthCopy = input.growthViews > 0 ? ` e crescimento de ${formatCompact(input.growthViews)} views` : "";
  const evidenceCopy = `${proofCount} prova${proofCount === 1 ? "" : "s"}`;
  const limitedCaption = !input.caption || input.caption.trim().length < 28;

  return {
    status,
    opportunityType,
    cardReason: `${opportunityType}: ${status.label}. ${scoreCopy}, ${viewsCopy}.`,
    strategicSummary: limitedCaption
      ? `Este Reel de ${creatorCopy} tem dados reais suficientes para leitura inicial, mas a legenda e limitada. Trate como oportunidade de observacao ate abrir a fonte.`
      : `Este Reel de ${creatorCopy} aponta uma oportunidade de ${opportunityType.toLowerCase()} no mercado ${input.market}.`,
    whyItMatters: `Fonte ${input.origin}, mercado ${input.market}, ${scoreCopy}, ${viewsCopy}${growthCopy}${engagementCopy}. A leitura usa ${evidenceCopy} e confianca ${confidence}.`,
    replicableFormat: {
      hook: hookFor(input),
      structure: structureFor(input),
      copyableElement: copyableElementFor(input, opportunityType),
      adaptation:
        input.market === "BR"
          ? "Adaptar para linguagem BR, com prova visual propria e sem copiar criativo de terceiros."
          : "Usar como early-signal dos EUA e testar uma versao localizada antes de apostar alto no BR.",
      confidenceNote: limitedCaption
        ? "Dados limitados de caption: confirme o gancho no Reel original antes de produzir."
        : "Leitura baseada em caption, metricas, fonte, mercado e evidencias salvas.",
    },
    action,
    provenance: {
      source: input.origin,
      collectedAt: input.collectedAt,
      market: input.market,
      confidence,
      evidenceCount: proofCount,
    },
  };
}
