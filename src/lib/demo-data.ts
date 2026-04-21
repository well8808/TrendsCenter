import { calculateTrendScore } from "@/lib/scoring";
import type { MetricTile, SourceRecord, TrendSignal } from "@/lib/types";

const demoSources: SourceRecord[] = [
  {
    id: "src-demo-trends-br",
    title: "Mock snapshot: Creative Center Trends BR",
    kind: "DEMO",
    origin: "DEMO",
    collectedAt: "2026-04-21T08:00:00-03:00",
    market: "BR",
    confidence: "medium",
    evidenceCount: 4,
  },
  {
    id: "src-demo-top-ads-us",
    title: "Mock snapshot: US early-signal review",
    kind: "DEMO",
    origin: "DEMO",
    collectedAt: "2026-04-21T08:15:00-03:00",
    market: "US",
    confidence: "low",
    evidenceCount: 2,
  },
  {
    id: "src-demo-cml",
    title: "Mock snapshot: Commercial Music Library",
    kind: "DEMO",
    origin: "DEMO",
    collectedAt: "2026-04-21T08:30:00-03:00",
    market: "BR",
    confidence: "medium",
    evidenceCount: 3,
  },
];

const signalSeeds: Array<Omit<TrendSignal, "origin" | "score">> = [
  {
    id: "sig-demo-dance-cuts",
    title: "Demo: danca em 3 cortes com troca de figurino",
    summary:
      "Formato seguro de movimento e transicao, util para testar retencao inicial sem depender de audio proprietario.",
    type: "FORMAT",
    market: "BR",
    audience: "Danca feminina, beleza e lifestyle",
    status: "rising",
    source: demoSources[0],
    tags: ["9:16", "hook visual", "transicao", "demo"],
    scoreInput: {
      velocity7d: 74,
      acceleration: 68,
      brazilFit: 88,
      usTransferability: 28,
      formatRepeatability: 84,
      creatorSignal: 56,
      audioCommercialUsable: 42,
      revivalStrength: 20,
      evidenceQuality: 54,
      riskPenalty: 6,
    },
  },
  {
    id: "sig-demo-audio-safe",
    title: "Demo: audio comercial com energia funk-pop",
    summary:
      "Hipotese marcada como mock para testar a experiencia de audios licenciaveis antes da integracao CML real.",
    type: "AUDIO",
    market: "BR",
    audience: "Criativos de performance e social commerce",
    status: "watch",
    source: demoSources[2],
    tags: ["audio", "CML-ready", "licenca", "demo"],
    scoreInput: {
      velocity7d: 62,
      acceleration: 48,
      brazilFit: 76,
      usTransferability: 20,
      formatRepeatability: 66,
      creatorSignal: 30,
      audioCommercialUsable: 94,
      revivalStrength: 18,
      evidenceQuality: 50,
      riskPenalty: 2,
    },
  },
  {
    id: "sig-demo-us-to-br",
    title: "Demo: micro-review honesto antes/depois",
    summary:
      "Sinal dos EUA simulado para validar o radar de traducao cultural antes de qualquer fonte oficial conectada.",
    type: "US_TO_BR",
    market: "US",
    audience: "Early signal para adaptacao BR",
    status: "watch",
    source: demoSources[1],
    tags: ["US", "antes-depois", "review", "demo"],
    scoreInput: {
      velocity7d: 58,
      acceleration: 64,
      brazilFit: 54,
      usTransferability: 78,
      formatRepeatability: 72,
      creatorSignal: 48,
      audioCommercialUsable: 35,
      revivalStrength: 30,
      evidenceQuality: 38,
      riskPenalty: 5,
    },
  },
  {
    id: "sig-demo-revival",
    title: "Demo: retorno de formato de comentario-resposta",
    summary:
      "Revival simulado de video-resposta para comentarios, com foco em prova social honesta e contexto visivel.",
    type: "REVIVAL",
    market: "BR",
    audience: "Creators, conteudo educativo e marcas pessoais",
    status: "returning",
    source: demoSources[0],
    tags: ["revival", "comentarios", "BTS", "demo"],
    scoreInput: {
      velocity7d: 52,
      acceleration: 44,
      brazilFit: 72,
      usTransferability: 45,
      formatRepeatability: 82,
      creatorSignal: 52,
      audioCommercialUsable: 40,
      revivalStrength: 86,
      evidenceQuality: 46,
      riskPenalty: 4,
    },
  },
];

export const demoSignals: TrendSignal[] = signalSeeds.map((signal) => ({
  ...signal,
  origin: "DEMO",
  score: calculateTrendScore(signal.scoreInput),
}));

export const commandMetrics: MetricTile[] = [
  { label: "Sinais BR em observacao", value: "04", delta: "demo dataset", tone: "acid" },
  { label: "Early signals EUA", value: "01", delta: "mock watch", tone: "aqua" },
  { label: "Risco bloqueado", value: "0", delta: "sem producao", tone: "coral" },
  { label: "Fontes oficiais", value: "preparado", delta: "nao conectado", tone: "gold" },
];

export const sourceQueue = demoSources;
