process.env.DATABASE_URL ??= "file:./dev.db";

const [{ PrismaClient }, { PrismaBetterSqlite3 }] = await Promise.all([
  import("@prisma/client"),
  import("@prisma/adapter-better-sqlite3"),
]);

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const collectedAt = {
  trendsBr: new Date("2026-04-21T08:00:00-03:00"),
  topAdsUs: new Date("2026-04-21T08:15:00-03:00"),
  cml: new Date("2026-04-21T08:30:00-03:00"),
  creators: new Date("2026-04-21T08:45:00-03:00"),
};

const weights = {
  velocity7d: 0.22,
  acceleration: 0.14,
  brazilFit: 0.18,
  usTransferability: 0.1,
  formatRepeatability: 0.1,
  creatorSignal: 0.08,
  audioCommercialUsable: 0.07,
  revivalStrength: 0.07,
  evidenceQuality: 0.04,
};

function band(score) {
  if (score >= 78) {
    return "HIGH";
  }

  if (score >= 52) {
    return "MEDIUM";
  }

  return "LOW";
}

function scoreValue(input) {
  const weighted =
    input.velocity7d * weights.velocity7d +
    input.acceleration * weights.acceleration +
    input.brazilFit * weights.brazilFit +
    input.usTransferability * weights.usTransferability +
    input.formatRepeatability * weights.formatRepeatability +
    input.creatorSignal * weights.creatorSignal +
    input.audioCommercialUsable * weights.audioCommercialUsable +
    input.revivalStrength * weights.revivalStrength +
    input.evidenceQuality * weights.evidenceQuality;

  return Math.max(0, Math.min(100, Math.round(weighted - input.riskPenalty)));
}

function normalizeForDedupe(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sourceKey(source) {
  return [
    "source",
    source.origin.toLowerCase(),
    source.kind.toLowerCase(),
    source.market.toLowerCase(),
    normalizeForDedupe(source.title),
  ].join(":");
}

function signalKey(signal) {
  return ["signal", signal.market.toLowerCase(), signal.type.toLowerCase(), normalizeForDedupe(signal.title)].join(":");
}

function evidenceKey(signal, evidence) {
  return ["evidence", signalKey(signal), normalizeForDedupe(evidence.title)].join(":");
}

const connectors = [
  {
    id: "connector-demo-creative-center",
    slug: "demo-creative-center-br",
    title: "Demo Creative Center BR intake",
    kind: "DEMO",
    origin: "DEMO",
    status: "APPROVED",
    market: "BR",
    officialSurface: "TikTok Creative Center",
  },
  {
    id: "connector-demo-us-review",
    slug: "demo-us-early-review",
    title: "Demo US early-signal review",
    kind: "DEMO",
    origin: "DEMO",
    status: "APPROVED",
    market: "US",
    officialSurface: "Manual US review",
  },
  {
    id: "connector-demo-cml",
    slug: "demo-commercial-music-library",
    title: "Demo Commercial Music Library intake",
    kind: "DEMO",
    origin: "DEMO",
    status: "APPROVED",
    market: "BR",
    officialSurface: "Commercial Music Library",
  },
  {
    id: "connector-manual-safe-intake",
    slug: "manual-safe-intake",
    title: "Manual safe intake",
    kind: "MANUAL_RESEARCH",
    origin: "MANUAL",
    status: "APPROVED",
    market: "BR",
    officialSurface: "Operator entry",
  },
  {
    id: "connector-official-placeholder",
    slug: "official-placeholder-approved",
    title: "Official source placeholder",
    kind: "CREATIVE_CENTER_TRENDS",
    origin: "OFFICIAL",
    status: "NEEDS_REVIEW",
    market: "BR",
    officialSurface: "Approved official surface pending credentials",
  },
];

const connectorBySourceId = {
  "src-demo-trends-br": "connector-demo-creative-center",
  "src-demo-top-ads-us": "connector-demo-us-review",
  "src-demo-cml": "connector-demo-cml",
  "src-demo-creator-watch": "connector-manual-safe-intake",
};

const sourceIngestion = new Map();
const ingestionStepNames = ["RECEIVE", "VALIDATE", "NORMALIZE", "DEDUPE", "PERSIST", "SCORE", "AUDIT"];

const sources = [
  {
    id: "src-demo-trends-br",
    title: "Mock snapshot: Creative Center Trends BR",
    kind: "DEMO",
    origin: "DEMO",
    market: "BR",
    confidence: "MEDIUM",
    evidenceCount: 8,
    coverage: "hashtags, videos e audios em review manual",
    freshness: "snapshot demo de hoje",
    gap: "sem API oficial conectada",
    collectedAt: collectedAt.trendsBr,
    rawPayloadHash: "sha256-demo-trends-br-20260421",
  },
  {
    id: "src-demo-top-ads-us",
    title: "Mock snapshot: US early-signal review",
    kind: "DEMO",
    origin: "DEMO",
    market: "US",
    confidence: "LOW",
    evidenceCount: 4,
    coverage: "formatos e criativos de referencia",
    freshness: "mock controlado",
    gap: "transferencia cultural ainda nao provada",
    collectedAt: collectedAt.topAdsUs,
    rawPayloadHash: "sha256-demo-top-ads-us-20260421",
  },
  {
    id: "src-demo-cml",
    title: "Mock snapshot: Commercial Music Library",
    kind: "DEMO",
    origin: "DEMO",
    market: "BR",
    confidence: "MEDIUM",
    evidenceCount: 5,
    coverage: "hipoteses de audio licenciavel",
    freshness: "mock controlado",
    gap: "licencas reais pendentes",
    collectedAt: collectedAt.cml,
    rawPayloadHash: "sha256-demo-cml-20260421",
  },
  {
    id: "src-demo-creator-watch",
    title: "Mock creator watchlist BR",
    kind: "DEMO",
    origin: "DEMO",
    market: "BR",
    confidence: "LOW",
    evidenceCount: 3,
    coverage: "clusters de creators sem perfis reais",
    freshness: "mock controlado",
    gap: "sem creator IDs reais",
    collectedAt: collectedAt.creators,
    rawPayloadHash: "sha256-demo-creator-watch-20260421",
  },
];

const signals = [
  {
    id: "sig-demo-dance-cuts",
    title: "Demo: danca em 3 cortes com troca de figurino",
    summary:
      "Formato de movimento e transicao com leitura rapida, forte para testar retencao inicial sem depender de audio proprietario.",
    type: "FORMAT",
    market: "BR",
    audience: "Danca feminina, beleza e lifestyle",
    status: "RISING",
    priority: "NOW",
    riskLevel: "LOW",
    stage: "ACCELERATING",
    strength: 84,
    trendWindow: "24-72h para testar variacoes",
    decision: "Priorizar adaptacao com criativo proprio e audio licenciavel.",
    nextAction: "Criar 3 hooks visuais e medir retencao nos 2 primeiros segundos.",
    saved: true,
    sourceId: "src-demo-trends-br",
    tags: ["9:16", "hook visual", "transicao", "dance", "demo"],
    scoreDrivers: ["fit BR alto", "formato repetivel", "risco baixo"],
    evidence: [
      {
        id: "ev-demo-dance-1",
        title: "Cluster visual de transicao rapida",
        sourceLabel: "Creative Center mock",
        quality: "MEDIUM",
        timestamp: collectedAt.trendsBr,
        note: "Evidencia simulada para validar leitura de cluster, nao dado real.",
      },
      {
        id: "ev-demo-dance-2",
        title: "Padrao repetivel em beauty/lifestyle",
        sourceLabel: "Manual review mock",
        quality: "MEDIUM",
        timestamp: new Date("2026-04-21T08:06:00-03:00"),
        note: "Mostra como a UI vai explicar repetibilidade do formato.",
      },
    ],
    history: [
      { label: "velocidade", value: "+18 demo", tone: "acid" },
      { label: "risco", value: "baixo", tone: "aqua" },
      { label: "janela", value: "72h", tone: "gold" },
    ],
    scoreInput: {
      velocity7d: 88,
      acceleration: 82,
      brazilFit: 92,
      usTransferability: 28,
      formatRepeatability: 90,
      creatorSignal: 64,
      audioCommercialUsable: 58,
      revivalStrength: 24,
      evidenceQuality: 66,
      riskPenalty: 4,
    },
  },
  {
    id: "sig-demo-audio-safe",
    title: "Demo: audio comercial com energia funk-pop",
    summary:
      "Hipotese marcada como mock para testar leitura de audios licenciaveis antes da integracao real com biblioteca comercial.",
    type: "AUDIO",
    market: "BR",
    audience: "Criativos de performance e social commerce",
    status: "WATCH",
    priority: "NEXT",
    riskLevel: "LOW",
    stage: "PROVING",
    strength: 72,
    trendWindow: "3-5 dias para validar disponibilidade",
    decision: "Manter como candidato se a licenca for confirmada em fonte oficial.",
    nextAction: "Mapear 2 edicoes sem depender de letra ou audio proprietario.",
    saved: true,
    sourceId: "src-demo-cml",
    tags: ["audio", "CML-ready", "licenca", "performance", "demo"],
    scoreDrivers: ["audio comercial", "fit BR", "risco baixo"],
    evidence: [
      {
        id: "ev-demo-audio-1",
        title: "Compatibilidade comercial ainda simulada",
        sourceLabel: "CML mock",
        quality: "MEDIUM",
        timestamp: collectedAt.cml,
        note: "A UI diferencia audio promissor de audio confirmado.",
      },
    ],
    history: [
      { label: "licenca", value: "pendente", tone: "gold" },
      { label: "fit BR", value: "alto", tone: "acid" },
      { label: "risco", value: "baixo", tone: "aqua" },
    ],
    scoreInput: {
      velocity7d: 70,
      acceleration: 56,
      brazilFit: 82,
      usTransferability: 22,
      formatRepeatability: 72,
      creatorSignal: 36,
      audioCommercialUsable: 94,
      revivalStrength: 18,
      evidenceQuality: 58,
      riskPenalty: 2,
    },
  },
  {
    id: "sig-demo-us-to-br",
    title: "Demo: micro-review honesto antes/depois",
    summary:
      "Sinal dos EUA simulado para validar o radar de traducao cultural, com foco em prova visual e promessa moderada.",
    type: "US_TO_BR",
    market: "US",
    audience: "Early signal para adaptacao BR",
    status: "WATCH",
    priority: "NEXT",
    riskLevel: "MEDIUM",
    stage: "EMERGING",
    strength: 68,
    trendWindow: "5-10 dias para observar traducao BR",
    decision: "Acompanhar antes de investir; alto potencial se ganhar linguagem local.",
    nextAction: "Criar matriz de adaptacao com 2 referencias BR seguras.",
    saved: false,
    sourceId: "src-demo-top-ads-us",
    tags: ["US", "antes-depois", "review", "adaptacao", "demo"],
    scoreDrivers: ["transferencia US", "boa repetibilidade", "evidencia baixa"],
    evidence: [
      {
        id: "ev-demo-us-1",
        title: "Formato US com promessa visual curta",
        sourceLabel: "US review mock",
        quality: "LOW",
        timestamp: collectedAt.topAdsUs,
        note: "A transferencia para BR ainda esta marcada como hipotese.",
      },
      {
        id: "ev-demo-us-2",
        title: "Necessita localizacao de linguagem",
        sourceLabel: "Strategy note mock",
        quality: "LOW",
        timestamp: new Date("2026-04-21T08:18:00-03:00"),
        note: "Evita tratar sinal internacional como certeza.",
      },
    ],
    history: [
      { label: "transfer", value: "78", tone: "gold" },
      { label: "fit BR", value: "medio", tone: "violet" },
      { label: "risco", value: "medio", tone: "coral" },
    ],
    scoreInput: {
      velocity7d: 64,
      acceleration: 70,
      brazilFit: 58,
      usTransferability: 82,
      formatRepeatability: 76,
      creatorSignal: 52,
      audioCommercialUsable: 42,
      revivalStrength: 34,
      evidenceQuality: 42,
      riskPenalty: 8,
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
    status: "RETURNING",
    priority: "NEXT",
    riskLevel: "LOW",
    stage: "REVIVAL",
    strength: 76,
    trendWindow: "48h para publicar resposta propria",
    decision: "Usar quando houver comentario real e contexto verificavel.",
    nextAction: "Selecionar pergunta real e montar roteiro de resposta em 3 blocos.",
    saved: true,
    sourceId: "src-demo-trends-br",
    tags: ["revival", "comentarios", "BTS", "creator", "demo"],
    scoreDrivers: ["revival forte", "baixo risco", "execucao simples"],
    evidence: [
      {
        id: "ev-demo-revival-1",
        title: "Padrao retornando apos dormencia",
        sourceLabel: "Revival lab mock",
        quality: "MEDIUM",
        timestamp: new Date("2026-04-21T08:08:00-03:00"),
        note: "Exibe como a tela vai tratar retorno sem falsa escassez.",
      },
    ],
    history: [
      { label: "dormencia", value: "21d", tone: "violet" },
      { label: "retorno", value: "+12 demo", tone: "acid" },
      { label: "risco", value: "baixo", tone: "aqua" },
    ],
    scoreInput: {
      velocity7d: 60,
      acceleration: 54,
      brazilFit: 78,
      usTransferability: 46,
      formatRepeatability: 86,
      creatorSignal: 58,
      audioCommercialUsable: 44,
      revivalStrength: 92,
      evidenceQuality: 56,
      riskPenalty: 4,
    },
  },
  {
    id: "sig-demo-hashtag-grwm",
    title: "Demo: hashtag de rotina arrume-se comigo",
    summary:
      "Cluster de hashtag simulado para estudar estrutura de rotina, preparacao e bastidor sem sugerir prova falsa.",
    type: "HASHTAG",
    market: "BR",
    audience: "Beleza, moda, creators e social commerce",
    status: "RISING",
    priority: "WATCH",
    riskLevel: "MEDIUM",
    stage: "PROVING",
    strength: 66,
    trendWindow: "1 semana para testar nichos adjacentes",
    decision: "Monitorar saturacao antes de transformar em campanha principal.",
    nextAction: "Comparar 3 hashtags adjacentes e evitar claims de resultado.",
    saved: false,
    sourceId: "src-demo-trends-br",
    tags: ["hashtag", "rotina", "GRWM", "beleza", "demo"],
    scoreDrivers: ["fit BR", "saturacao media", "bom contexto"],
    evidence: [
      {
        id: "ev-demo-hashtag-1",
        title: "Cluster de rotina com alta adaptabilidade",
        sourceLabel: "Hashtag mock",
        quality: "MEDIUM",
        timestamp: new Date("2026-04-21T08:03:00-03:00"),
        note: "Mantem separacao entre tendencia observada e decisao de negocio.",
      },
    ],
    history: [
      { label: "fit", value: "alto", tone: "acid" },
      { label: "saturacao", value: "media", tone: "gold" },
      { label: "risco", value: "medio", tone: "coral" },
    ],
    scoreInput: {
      velocity7d: 66,
      acceleration: 52,
      brazilFit: 84,
      usTransferability: 36,
      formatRepeatability: 78,
      creatorSignal: 44,
      audioCommercialUsable: 34,
      revivalStrength: 36,
      evidenceQuality: 54,
      riskPenalty: 10,
    },
  },
  {
    id: "sig-demo-creator-cluster",
    title: "Demo: cluster de creators de danca segura",
    summary:
      "Watchlist ficticia de creators para testar monitoramento por consistencia, formato e sinais de colaboracao.",
    type: "CREATOR",
    market: "BR",
    audience: "Creators de danca, lifestyle e produto visual",
    status: "WATCH",
    priority: "WATCH",
    riskLevel: "LOW",
    stage: "MONITOR",
    strength: 58,
    trendWindow: "2 semanas para observar consistencia",
    decision: "Salvar como watchlist; nao acionar sem fonte oficial ou permissao.",
    nextAction: "Definir criterios de inclusao antes de adicionar perfis reais.",
    saved: false,
    sourceId: "src-demo-creator-watch",
    tags: ["creator", "watchlist", "danca", "consistencia", "demo"],
    scoreDrivers: ["watchlist", "baixo risco", "fonte fraca"],
    evidence: [
      {
        id: "ev-demo-creator-1",
        title: "Watchlist sem perfis reais",
        sourceLabel: "Creator watch mock",
        quality: "LOW",
        timestamp: collectedAt.creators,
        note: "Prepara UX de creator monitoring sem expor pessoas reais.",
      },
    ],
    history: [
      { label: "consist.", value: "media", tone: "gold" },
      { label: "risco", value: "baixo", tone: "aqua" },
      { label: "fonte", value: "mock", tone: "violet" },
    ],
    scoreInput: {
      velocity7d: 48,
      acceleration: 42,
      brazilFit: 70,
      usTransferability: 22,
      formatRepeatability: 68,
      creatorSignal: 82,
      audioCommercialUsable: 36,
      revivalStrength: 22,
      evidenceQuality: 34,
      riskPenalty: 3,
    },
  },
  {
    id: "sig-demo-us-silent-story",
    title: "Demo: storytelling silencioso com legenda forte",
    summary:
      "Formato US simulado de edicao sem fala para avaliar se a estrutura visual traduz para criativos BR.",
    type: "FORMAT",
    market: "US",
    audience: "Early signal para formatos adaptaveis",
    status: "WATCH",
    priority: "HOLD",
    riskLevel: "MEDIUM",
    stage: "EMERGING",
    strength: 52,
    trendWindow: "monitorar antes de salvar como prioridade",
    decision: "Nao priorizar ainda; usar apenas como referencia de estrutura.",
    nextAction: "Aguardar evidencia BR ou fonte oficial adicional.",
    saved: false,
    sourceId: "src-demo-top-ads-us",
    tags: ["US", "silent edit", "caption", "estrutura", "demo"],
    scoreDrivers: ["early US", "evidencia baixa", "aguardar BR"],
    evidence: [
      {
        id: "ev-demo-silent-1",
        title: "Estrutura visual promissora, sem prova BR",
        sourceLabel: "US review mock",
        quality: "LOW",
        timestamp: new Date("2026-04-21T08:22:00-03:00"),
        note: "Ajuda a UI a mostrar sinais em espera.",
      },
    ],
    history: [
      { label: "transfer", value: "61", tone: "gold" },
      { label: "prior.", value: "hold", tone: "violet" },
      { label: "risco", value: "medio", tone: "coral" },
    ],
    scoreInput: {
      velocity7d: 46,
      acceleration: 50,
      brazilFit: 46,
      usTransferability: 66,
      formatRepeatability: 72,
      creatorSignal: 38,
      audioCommercialUsable: 58,
      revivalStrength: 20,
      evidenceQuality: 32,
      riskPenalty: 9,
    },
  },
];

async function reset() {
  await prisma.mediaDerivative.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.complianceFlag.deleteMany();
  await prisma.workspaceSavedSignal.deleteMany();
  await prisma.signalHistoryEvent.deleteMany();
  await prisma.evidenceItem.deleteMany();
  await prisma.trendScore.deleteMany();
  await prisma.trendObservation.deleteMany();
  await prisma.trendSignal.deleteMany();
  await prisma.sourceSnapshot.deleteMany();
  await prisma.jobRun.deleteMany();
  await prisma.ingestionStep.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.ingestRequest.deleteMany();
  await prisma.source.deleteMany();
  await prisma.sourceConnector.deleteMany();
}

async function seedConnectors() {
  for (const connector of connectors) {
    await prisma.sourceConnector.create({
      data: {
        ...connector,
        manualEntryEnabled: true,
        policyNotes: "Seed Fase 3B: connector aprovado/pendente sem rede externa automatica.",
      },
    });
  }
}

async function seedSources() {
  for (const source of sources) {
    await prisma.source.create({
      data: {
        id: source.id,
        title: source.title,
        kind: source.kind,
        origin: source.origin,
        market: source.market,
        confidence: source.confidence,
        coverage: source.coverage,
        freshness: source.freshness,
        gap: source.gap,
        connectorId: connectorBySourceId[source.id],
        dedupeKey: sourceKey(source),
        notes: "Seed demo/mock para Fase 3B; nao representa dado de producao.",
      },
    });
  }
}

async function createSteps(batchId, status, failedStep) {
  for (const [index, name] of ingestionStepNames.entries()) {
    const stepStatus =
      failedStep && ingestionStepNames.indexOf(name) > ingestionStepNames.indexOf(failedStep)
        ? "SKIPPED"
        : failedStep === name
          ? "FAILED"
          : status;

    await prisma.ingestionStep.create({
      data: {
        batchId,
        name,
        status: stepStatus,
        sequence: index + 1,
        startedAt: collectedAt.trendsBr,
        completedAt: collectedAt.trendsBr,
        notes: stepStatus === "SUCCEEDED" ? "Seed local concluido sem rede externa." : "Seed de falha visivel.",
        error: stepStatus === "FAILED" ? "Credencial oficial ausente no ambiente demo." : undefined,
      },
    });
  }
}

async function seedImportBatches() {
  for (const source of sources) {
    const request = await prisma.ingestRequest.create({
      data: {
        id: `${source.id}-request-20260421`,
        requestKey: `demo-seed-request:${source.id}`,
        type: "OFFICIAL_SNAPSHOT",
        status: "SUCCEEDED",
        market: source.market,
        origin: source.origin,
        connectorId: connectorBySourceId[source.id],
        sourceId: source.id,
        title: `Seed request: ${source.title}`,
        submittedBy: "seed",
        submittedAt: source.collectedAt,
        collectedAt: source.collectedAt,
        processedAt: source.collectedAt,
        completedAt: source.collectedAt,
        payload: {
          mode: "demo/mock",
          externalIntegrations: false,
          sourceId: source.id,
        },
        isDemo: true,
      },
    });
    const batch = await prisma.importBatch.create({
      data: {
        id: `${source.id}-batch-20260421`,
        idempotencyKey: `demo-seed-batch:${source.id}`,
        kind: "DEMO_SEED",
        status: "SUCCEEDED",
        market: source.market,
        origin: source.origin,
        connectorId: connectorBySourceId[source.id],
        requestId: request.id,
        sourceId: source.id,
        title: `Seed batch: ${source.title}`,
        itemCount: source.evidenceCount,
        payloadHash: source.rawPayloadHash,
        payload: {
          mode: "demo/mock",
          externalIntegrations: false,
          sourceId: source.id,
        },
        collectedAt: source.collectedAt,
        processedAt: source.collectedAt,
        completedAt: source.collectedAt,
        isDemo: true,
      },
    });
    const job = await prisma.jobRun.create({
      data: {
        id: `${source.id}-job-20260421`,
        name: "demo-seed-ingest",
        status: "SUCCEEDED",
        stage: "AUDIT",
        requestId: request.id,
        importBatchId: batch.id,
        payload: {
          phase: "3B",
          source: "prisma/seed.mjs",
          mode: "demo/mock",
          externalIntegrations: false,
        },
        startedAt: source.collectedAt,
        finishedAt: source.collectedAt,
      },
    });
    const snapshot = await prisma.sourceSnapshot.create({
      data: {
        id: `${source.id}-snapshot-20260421`,
        sourceId: source.id,
        importBatchId: batch.id,
        jobRunId: job.id,
        collectedAt: source.collectedAt,
        rawPayloadHash: source.rawPayloadHash,
        recordCount: source.evidenceCount,
        isDemo: true,
      },
    });

    await createSteps(batch.id, "SUCCEEDED");
    sourceIngestion.set(source.id, { request, batch, job, snapshot });
  }
}

async function seedSignals() {
  for (const signal of signals) {
    const score = scoreValue(signal.scoreInput);
    const confidence = band(score);
    const ingestion = sourceIngestion.get(signal.sourceId);
    const signalDedupeKey = signalKey(signal);

    await prisma.trendSignal.create({
      data: {
        id: signal.id,
        title: signal.title,
        summary: signal.summary,
        type: signal.type,
        market: signal.market,
        audience: signal.audience,
        status: signal.status,
        priority: signal.priority,
        riskLevel: signal.riskLevel,
        stage: signal.stage,
        strength: signal.strength,
        trendWindow: signal.trendWindow,
        decision: signal.decision,
        nextAction: signal.nextAction,
        tags: signal.tags,
        scoreDrivers: signal.scoreDrivers,
        dedupeKey: signalDedupeKey,
        importBatchId: ingestion?.batch.id,
        lastIngestedAt: ingestion?.batch.completedAt,
        processedAt: ingestion?.batch.completedAt,
        origin: "DEMO",
        sourceId: signal.sourceId,
        confidence,
        evidenceCount: signal.evidence.length,
        isDemo: true,
        observations: {
          create: {
            snapshotId: ingestion?.snapshot.id,
            observedAt: sources.find((source) => source.id === signal.sourceId)?.collectedAt ?? collectedAt.trendsBr,
            rank: signal.priority === "NOW" ? 1 : signal.priority === "NEXT" ? 2 : 4,
            postCount: signal.evidence.length,
            rawMetrics: {
              seed: true,
              isDemo: true,
              signalStrength: signal.strength,
            },
          },
        },
        scores: {
          create: {
            score,
            confidence,
            velocity7d: signal.scoreInput.velocity7d,
            acceleration: signal.scoreInput.acceleration,
            brazilFit: signal.scoreInput.brazilFit,
            usTransferability: signal.scoreInput.usTransferability,
            formatRepeatability: signal.scoreInput.formatRepeatability,
            creatorSignal: signal.scoreInput.creatorSignal,
            audioCommercialUsable: signal.scoreInput.audioCommercialUsable,
            revivalStrength: signal.scoreInput.revivalStrength,
            evidenceQuality: signal.scoreInput.evidenceQuality,
            riskPenalty: signal.scoreInput.riskPenalty,
            modelVersion: "score-v0.1",
            explanation: "Score calculado a partir de seed demo/mock, sem dados reais.",
          },
        },
        evidence: {
          create: signal.evidence.map((item) => ({
            id: item.id,
            sourceId: signal.sourceId,
            importBatchId: ingestion?.batch.id,
            jobRunId: ingestion?.job.id,
            snapshotId: ingestion?.snapshot.id,
            dedupeKey: evidenceKey(signal, item),
            title: item.title,
            excerpt: item.sourceLabel,
            note: item.note,
            quality: item.quality,
            capturedAt: item.timestamp,
            isDemo: true,
          })),
        },
        history: {
          create: signal.history.map((item, index) => ({
            label: item.label,
            value: item.value,
            tone: item.tone,
            eventAt: new Date(collectedAt.trendsBr.getTime() + index * 60_000),
          })),
        },
        savedBy: signal.saved
          ? {
              create: {
                label: "Seed demo saved",
                notes: "Marcado no seed para validar workspace flow persistente.",
              },
            }
          : undefined,
      },
    });
  }
}

async function seedJobRuns() {
  const request = await prisma.ingestRequest.create({
    data: {
      id: "req-demo-official-blocked-20260421",
      requestKey: "demo-failed-official:creative-center-missing-credential",
      type: "OFFICIAL_SNAPSHOT",
      status: "FAILED",
      market: "BR",
      origin: "OFFICIAL",
      connectorId: "connector-official-placeholder",
      title: "Official connector blocked: credential missing",
      submittedBy: "seed",
      submittedAt: new Date("2026-04-21T09:00:00-03:00"),
      collectedAt: new Date("2026-04-21T09:00:00-03:00"),
      processedAt: new Date("2026-04-21T09:01:00-03:00"),
      completedAt: new Date("2026-04-21T09:01:00-03:00"),
      error: "Credencial oficial ausente; nenhuma coleta externa executada.",
      payload: {
        phase: "3B",
        source: "prisma/seed.mjs",
        externalIntegrations: false,
        blockedBeforeNetwork: true,
      },
    },
  });
  const batch = await prisma.importBatch.create({
    data: {
      id: "batch-demo-official-blocked-20260421",
      idempotencyKey: "demo-failed-official:creative-center-missing-credential",
      kind: "OFFICIAL_SNAPSHOT",
      status: "FAILED",
      market: "BR",
      origin: "OFFICIAL",
      connectorId: "connector-official-placeholder",
      requestId: request.id,
      title: "Blocked official snapshot",
      itemCount: 0,
      payloadHash: "sha256-demo-blocked-official-20260421",
      payload: {
        externalIntegrations: false,
        blockedBeforeNetwork: true,
      },
      collectedAt: new Date("2026-04-21T09:00:00-03:00"),
      processedAt: new Date("2026-04-21T09:01:00-03:00"),
      completedAt: new Date("2026-04-21T09:01:00-03:00"),
      error: "Credencial oficial ausente; nenhuma coleta externa executada.",
      isDemo: true,
    },
  });

  await prisma.jobRun.create({
    data: {
      id: "job-demo-official-blocked-20260421",
      name: "official-connector-preflight",
      status: "FAILED",
      stage: "VALIDATE",
      requestId: request.id,
      importBatchId: batch.id,
      payload: {
        phase: "3B",
        externalIntegrations: false,
        blockedBeforeNetwork: true,
      },
      startedAt: new Date("2026-04-21T09:00:00-03:00"),
      finishedAt: new Date("2026-04-21T09:01:00-03:00"),
      error: "Credencial oficial ausente; nenhuma coleta externa executada.",
    },
  });
  await createSteps(batch.id, "SUCCEEDED", "VALIDATE");
}

async function main() {
  await reset();
  await seedConnectors();
  await seedSources();
  await seedImportBatches();
  await seedSignals();
  await seedJobRuns();

  const [
    connectorCount,
    sourceCount,
    signalCount,
    evidenceCount,
    savedCount,
    historyCount,
    snapshotCount,
    requestCount,
    batchCount,
    stepCount,
    jobCount,
  ] =
    await Promise.all([
      prisma.sourceConnector.count(),
      prisma.source.count(),
      prisma.trendSignal.count(),
      prisma.evidenceItem.count(),
      prisma.workspaceSavedSignal.count(),
      prisma.signalHistoryEvent.count(),
      prisma.sourceSnapshot.count(),
      prisma.ingestRequest.count(),
      prisma.importBatch.count(),
      prisma.ingestionStep.count(),
      prisma.jobRun.count(),
    ]);

  console.log(
    JSON.stringify(
      {
        connectorCount,
        sourceCount,
        signalCount,
        evidenceCount,
        savedCount,
        historyCount,
        snapshotCount,
        requestCount,
        batchCount,
        stepCount,
        jobCount,
        mode: "demo/mock",
      },
      null,
      2,
    ),
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
