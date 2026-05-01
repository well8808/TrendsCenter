import type { Market } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { badRequest } from "@/lib/http/errors";
import type { ApiTenantContext } from "@/lib/services/auth-context-service";

type AssistantProvider = "openai" | "rules";
type AssistantSort = "score" | "growth" | "recency";
type AssistantMarket = Market | "ALL";

export interface ReelsSearchAssistantInput {
  goal: string;
  market?: AssistantMarket;
}

export interface ReelsSearchAssistantPlan {
  provider: AssistantProvider;
  configured: boolean;
  summary: string;
  recommendedQuery: string;
  market: AssistantMarket;
  sort: AssistantSort;
  collectionMode: "profile_reels" | "reel_urls";
  suggestedProfiles: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
  scoringFocus: string[];
  automationNotes: string[];
  nextActions: string[];
  riskNotes: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

interface RecentSignal {
  title: string;
  caption?: string;
  creator?: string;
  market: Market;
  views: string;
  trendScore: number;
  growthViews: string;
  hashtags: string[];
}

const stopwords = new Set([
  "a",
  "as",
  "ao",
  "aos",
  "com",
  "como",
  "da",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "eu",
  "me",
  "minha",
  "meu",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "que",
  "quero",
  "reels",
  "video",
  "videos",
  "viral",
  "virais",
]);

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function arrayOfText(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.map((item) => text(item)).filter(Boolean).slice(0, 12)
    : fallback;
}

function parseMarket(value: unknown): AssistantMarket {
  const market = text(value).toUpperCase();

  if (market === "BR" || market === "US" || market === "ALL") {
    return market;
  }

  return "BR";
}

function normalizeGoal(value: unknown) {
  const goal = text(value).slice(0, 1200);

  if (goal.length < 8) {
    throw badRequest("Descreva melhor o que voce quer encontrar no radar.");
  }

  return goal;
}

function extractInstagramUrls(goal: string) {
  const matches = goal.match(/https:\/\/(?:www\.)?instagram\.com\/[^\s,)]+/gi) ?? [];

  return [...new Set(matches.map((url) => url.replace(/[.]+$/, "")))].slice(0, 10);
}

function tokenize(goal: string) {
  const cleaned = goal
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .split(/[^a-z0-9_#@]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !stopwords.has(item));

  return [...new Set(cleaned)].slice(0, 10);
}

function inferSort(goal: string): AssistantSort {
  const normalized = goal.toLowerCase();

  if (/\b(crescendo|crescimento|subindo|ganhando|explodindo|acelerando)\b/i.test(normalized)) {
    return "growth";
  }

  if (/\b(novo|novos|recente|recentes|hoje|agora)\b/i.test(normalized)) {
    return "recency";
  }

  return "score";
}

function inferMarket(goal: string, fallback: AssistantMarket) {
  if (/\b(eua|usa|us|americano|americana|estados unidos)\b/i.test(goal)) {
    return "US";
  }

  if (/\b(br|brasil|brasileiro|brasileira|portugues)\b/i.test(goal)) {
    return "BR";
  }

  return fallback;
}

function buildRulesPlan(goal: string, market: AssistantMarket, recentSignals: RecentSignal[]): ReelsSearchAssistantPlan {
  const keywords = tokenize(goal);
  const urls = extractInstagramUrls(goal);
  const inferredMarket = inferMarket(goal, market);
  const sort = inferSort(goal);
  const recommendedQuery = keywords.slice(0, 5).join(" ") || recentSignals[0]?.creator || "creator formato funil";
  const topCreator = recentSignals.find((signal) => signal.creator)?.creator;

  return {
    provider: "rules",
    configured: false,
    summary:
      "Modo local: usei seu objetivo e os Reels ja salvos para montar uma busca inicial. Quando a IA externa tiver credito ativo, ela refina esse plano automaticamente.",
    recommendedQuery,
    market: inferredMarket,
    sort,
    collectionMode: urls.length > 0 && urls.every((url) => url.includes("/reel/")) ? "reel_urls" : "profile_reels",
    suggestedProfiles: urls,
    includeKeywords: keywords,
    excludeKeywords: ["menor", "teen", "underage", "conteudo explicito"].filter((item) => !keywords.includes(item)),
    scoringFocus: [
      sort === "growth" ? "crescimento entre leituras" : "potencial geral",
      "views atuais",
      "recencia",
      "evidencias conectadas",
    ],
    automationNotes: [
      urls.length > 0
        ? "Use os perfis/links detectados no campo de coleta Bright Data."
        : "Adicione 5 a 20 perfis base para o radar automatico buscar todos os dias.",
      topCreator ? `Compare os novos achados com o criador @${topCreator}.` : "Depois da primeira coleta, a IA consegue comparar com sua propria base.",
    ],
    nextActions: [
      "Aplique a busca sugerida no radar.",
      "Cole perfis confiaveis na coleta licenciada.",
      "Rode a mesma coleta em horarios diferentes para medir crescimento real.",
    ],
    riskNotes: [
      "A IA nao deve inventar perfis ou afirmar que encontrou videos sem fonte.",
      "Conteudo adulto deve continuar limitado a analise segura 18+ de marketing, formato e funil.",
    ],
    confidence: urls.length > 0 || recentSignals.length > 0 ? "MEDIUM" : "LOW",
  };
}

function safePlanFromUnknown(value: unknown, fallback: ReelsSearchAssistantPlan): ReelsSearchAssistantPlan {
  const item = record(value);
  const sort = text(item.sort);
  const collectionMode = text(item.collectionMode);
  const confidence = text(item.confidence);

  return {
    provider: "openai",
    configured: true,
    summary: text(item.summary) || fallback.summary,
    recommendedQuery: text(item.recommendedQuery) || fallback.recommendedQuery,
    market: parseMarket(item.market || fallback.market),
    sort: sort === "growth" || sort === "recency" || sort === "score" ? sort : fallback.sort,
    collectionMode: collectionMode === "reel_urls" ? "reel_urls" : "profile_reels",
    suggestedProfiles: arrayOfText(item.suggestedProfiles, fallback.suggestedProfiles).filter((url) =>
      /^https:\/\/(?:www\.)?instagram\.com\//i.test(url),
    ),
    includeKeywords: arrayOfText(item.includeKeywords, fallback.includeKeywords),
    excludeKeywords: arrayOfText(item.excludeKeywords, fallback.excludeKeywords),
    scoringFocus: arrayOfText(item.scoringFocus, fallback.scoringFocus),
    automationNotes: arrayOfText(item.automationNotes, fallback.automationNotes),
    nextActions: arrayOfText(item.nextActions, fallback.nextActions),
    riskNotes: arrayOfText(item.riskNotes, fallback.riskNotes),
    confidence: confidence === "HIGH" || confidence === "MEDIUM" || confidence === "LOW" ? confidence : fallback.confidence,
  };
}

function outputTextFromResponse(value: unknown) {
  const root = record(value);

  if (typeof root.output_text === "string") {
    return root.output_text;
  }

  const output = Array.isArray(root.output) ? root.output : [];
  const parts: string[] = [];

  for (const item of output) {
    const content = record(item).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      const partRecord = record(part);
      if (partRecord.type === "output_text" && typeof partRecord.text === "string") {
        parts.push(partRecord.text);
      }
    }
  }

  return parts.join("\n").trim();
}

async function recentSignals(context: ApiTenantContext): Promise<RecentSignal[]> {
  const videos = await getPrisma().video.findMany({
    where: { workspaceId: context.workspaceId },
    orderBy: [{ trendScore: "desc" }, { collectedAt: "desc" }],
    take: 12,
    include: {
      creator: { select: { handle: true } },
      hashtags: {
        take: 8,
        include: { hashtag: { select: { tag: true } } },
      },
    },
  });

  return videos.map((video) => ({
    title: video.title,
    caption: video.caption ?? undefined,
    creator: video.creator?.handle,
    market: video.market,
    views: video.currentViewCount.toString(),
    trendScore: video.trendScore,
    growthViews: video.growthViews.toString(),
    hashtags: video.hashtags.map((item) => item.hashtag.tag),
  }));
}

async function buildOpenAiPlan(goal: string, market: AssistantMarket, fallback: ReelsSearchAssistantPlan, signals: RecentSignal[]) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const model = process.env.REELS_AI_MODEL || "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Voce e um estrategista de radar de Instagram Reels. Gere criterios de busca e coleta uteis, sem inventar que encontrou videos. Nunca sugira conteudo explicito, menores, idade ambigua ou bypass. Trate adulto apenas como analise segura 18+ de marketing, formato, linguagem e funil.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                objetivo_do_usuario: goal,
                mercado_preferido: market,
                sinais_recentes_do_workspace: signals,
                contrato:
                  "Retorne apenas JSON aderente ao schema. suggestedProfiles so pode conter URLs do Instagram que o usuario forneceu ou que estejam nos sinais recentes; nao invente perfis.",
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "reels_search_assistant_plan",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "summary",
              "recommendedQuery",
              "market",
              "sort",
              "collectionMode",
              "suggestedProfiles",
              "includeKeywords",
              "excludeKeywords",
              "scoringFocus",
              "automationNotes",
              "nextActions",
              "riskNotes",
              "confidence",
            ],
            properties: {
              summary: { type: "string" },
              recommendedQuery: { type: "string" },
              market: { type: "string", enum: ["BR", "US", "ALL"] },
              sort: { type: "string", enum: ["score", "growth", "recency"] },
              collectionMode: { type: "string", enum: ["profile_reels", "reel_urls"] },
              suggestedProfiles: { type: "array", items: { type: "string" }, maxItems: 10 },
              includeKeywords: { type: "array", items: { type: "string" }, maxItems: 12 },
              excludeKeywords: { type: "array", items: { type: "string" }, maxItems: 12 },
              scoringFocus: { type: "array", items: { type: "string" }, maxItems: 8 },
              automationNotes: { type: "array", items: { type: "string" }, maxItems: 8 },
              nextActions: { type: "array", items: { type: "string" }, maxItems: 8 },
              riskNotes: { type: "array", items: { type: "string" }, maxItems: 8 },
              confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            },
          },
        },
      },
      max_output_tokens: 1400,
    }),
  });

  const body = await response.json().catch(async () => ({ raw: await response.text() }));

  if (!response.ok) {
    console.warn("[reels-search-assistant] OpenAI unavailable; using local rules", {
      status: response.status,
      provider: "openai",
    });
    return fallback;
  }

  const outputText = outputTextFromResponse(body);

  if (!outputText) {
    console.warn("[reels-search-assistant] OpenAI returned empty output; using local rules");
    return fallback;
  }

  try {
    return safePlanFromUnknown(JSON.parse(outputText), fallback);
  } catch (error) {
    console.warn("[reels-search-assistant] OpenAI JSON parse failed; using local rules", error);
    return fallback;
  }
}

export async function buildReelsSearchAssistantPlan(context: ApiTenantContext, input: unknown) {
  const body = record(input);
  const goal = normalizeGoal(body.goal);
  const market = parseMarket(body.market);
  const signals = await recentSignals(context);
  const fallback = buildRulesPlan(goal, market, signals);

  return buildOpenAiPlan(goal, market, fallback, signals).catch((error) => {
    console.warn("[reels-search-assistant] OpenAI request failed; using local rules", error);
    return fallback;
  });
}
