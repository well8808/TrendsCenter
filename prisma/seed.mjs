import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const [{ PrismaClient }, { PrismaNeon }] = await Promise.all([
  import("@prisma/client"),
  import("@prisma/adapter-neon"),
]);

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada para seed Postgres.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const now = new Date();

const connectors = [
  {
    slug: "manual-safe-intake",
    title: "Manual safe intake",
    kind: "MANUAL_RESEARCH",
    origin: "MANUAL",
    status: "APPROVED",
    market: "BR",
    officialSurface: "Operator entry",
    policyNotes: "Entrada manual rastreavel; sem scraping e sem coleta externa automatica.",
  },
  {
    slug: "official-creative-center-br",
    title: "TikTok Creative Center BR",
    kind: "CREATIVE_CENTER_TRENDS",
    origin: "OFFICIAL",
    status: "NEEDS_REVIEW",
    market: "BR",
    officialSurface: "TikTok Creative Center",
    policyNotes: "Superficie oficial registrada; pendente de credenciais/ingestao aprovada.",
  },
  {
    slug: "official-commercial-music-library",
    title: "TikTok Commercial Music Library",
    kind: "COMMERCIAL_MUSIC_LIBRARY",
    origin: "OFFICIAL",
    status: "NEEDS_REVIEW",
    market: "BR",
    officialSurface: "Commercial Music Library",
    policyNotes: "Usar apenas para audios comerciais licenciaveis ou licenca comprovada.",
  },
  {
    slug: "owned-upload-lab",
    title: "Owned/licensed upload lab",
    kind: "OWNED_UPLOAD",
    origin: "OWNED",
    status: "APPROVED",
    market: "BR",
    officialSurface: "Owned media",
    policyNotes: "Somente arquivos proprios ou licenciados; metadados removidos apenas com relatorio.",
  },
];

const manualSource = {
  title: "Manual research intake BR",
  kind: "MANUAL_RESEARCH",
  origin: "MANUAL",
  market: "BR",
};

function sourceKey(source) {
  return [
    "source",
    source.origin.toLowerCase(),
    source.kind.toLowerCase(),
    source.market.toLowerCase(),
    source.title
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  ].join(":");
}

async function main() {
  const manualConnector = await prisma.connector.upsert({
    where: { slug: "manual-safe-intake" },
    update: {
      status: "APPROVED",
      manualEntryEnabled: true,
      updatedAt: now,
    },
    create: {
      ...connectors[0],
      manualEntryEnabled: true,
    },
  });

  for (const connector of connectors.slice(1)) {
    await prisma.connector.upsert({
      where: { slug: connector.slug },
      update: {
        status: connector.status,
        manualEntryEnabled: true,
        policyNotes: connector.policyNotes,
        updatedAt: now,
      },
      create: {
        ...connector,
        manualEntryEnabled: true,
      },
    });
  }

  const source = await prisma.source.upsert({
    where: { dedupeKey: sourceKey(manualSource) },
    update: {
      connectorId: manualConnector.id,
      updatedAt: now,
    },
    create: {
      ...manualSource,
      confidence: "LOW",
      connectorId: manualConnector.id,
      dedupeKey: sourceKey(manualSource),
      coverage: "entrada operacional manual",
      freshness: "ao vivo via Postgres",
      gap: "sem coleta externa automatica",
      notes: "Fonte baseline real para iniciar o Ingestion Lab.",
    },
  });

  const request = await prisma.ingestRequest.upsert({
    where: { requestKey: "baseline:connector-registry" },
    update: {
      status: "SUCCEEDED",
      completedAt: now,
      processedAt: now,
    },
    create: {
      requestKey: "baseline:connector-registry",
      type: "SOURCE_REGISTER",
      status: "SUCCEEDED",
      market: "BR",
      origin: "MANUAL",
      connectorId: manualConnector.id,
      sourceId: source.id,
      title: "Baseline connector registry",
      submittedBy: "seed",
      collectedAt: now,
      processedAt: now,
      completedAt: now,
      payload: {
        mode: "production-baseline",
        externalIntegrations: false,
      },
    },
  });

  const batch = await prisma.importBatch.upsert({
    where: { idempotencyKey: "baseline:connector-registry" },
    update: {
      status: "SUCCEEDED",
      completedAt: now,
      processedAt: now,
    },
    create: {
      idempotencyKey: "baseline:connector-registry",
      kind: "CONNECTOR_BASELINE",
      status: "SUCCEEDED",
      market: "BR",
      origin: "MANUAL",
      connectorId: manualConnector.id,
      requestId: request.id,
      sourceId: source.id,
      title: "Baseline connector registry",
      itemCount: connectors.length,
      payloadHash: "baseline-connector-registry-v1",
      payload: {
        connectorSlugs: connectors.map((connector) => connector.slug),
        externalIntegrations: false,
      },
      collectedAt: now,
      processedAt: now,
      completedAt: now,
    },
  });

  await prisma.ingestionStep.deleteMany({ where: { batchId: batch.id } });
  await prisma.ingestionStep.createMany({
    data: ["RECEIVE", "VALIDATE", "NORMALIZE", "DEDUPE", "PERSIST", "SCORE", "AUDIT"].map((name, index) => ({
      batchId: batch.id,
      name,
      status: "SUCCEEDED",
      sequence: index + 1,
      startedAt: now,
      completedAt: now,
      notes: "Baseline operacional aplicado ao Postgres.",
    })),
  });

  const job = await prisma.jobRun.upsert({
    where: { id: "job-baseline-postgres-seed" },
    update: {
      status: "SUCCEEDED",
      finishedAt: now,
      importBatchId: batch.id,
    },
    create: {
      id: "job-baseline-postgres-seed",
      name: "postgres-baseline-seed",
      status: "SUCCEEDED",
      stage: "AUDIT",
      requestId: request.id,
      importBatchId: batch.id,
      payload: {
        mode: "production-baseline",
        externalIntegrations: false,
      },
      startedAt: now,
      finishedAt: now,
    },
  });

  await prisma.auditEvent.upsert({
    where: { id: "audit-baseline-postgres-seed" },
    update: {
      eventAt: now,
      sourceId: source.id,
      importBatchId: batch.id,
      jobRunId: job.id,
    },
    create: {
      id: "audit-baseline-postgres-seed",
      type: "SYSTEM",
      sourceId: source.id,
      importBatchId: batch.id,
      jobRunId: job.id,
      label: "baseline",
      value: "Postgres",
      tone: "aqua",
      message: "Banco gerenciado inicializado com connectors reais e sem dados de tendencia ficticios.",
      actor: "seed",
      metadata: {
        connectorCount: connectors.length,
        externalIntegrations: false,
      },
    },
  });

  const [connectorCount, sourceCount, signalCount, evidenceCount, queueCount, auditCount, jobCount] = await Promise.all([
    prisma.connector.count(),
    prisma.source.count(),
    prisma.signal.count(),
    prisma.evidence.count(),
    prisma.decisionQueueItem.count(),
    prisma.auditEvent.count(),
    prisma.jobRun.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        connectorCount,
        sourceCount,
        signalCount,
        evidenceCount,
        queueCount,
        auditCount,
        jobCount,
        mode: "postgres-production-baseline",
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
