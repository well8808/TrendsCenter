import { createHash } from "node:crypto";
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
const workspaceId = "workspace-default-command-center";

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
    title: "Instagram Reels official surfaces BR",
    kind: "INSTAGRAM_REELS_TRENDS",
    origin: "OFFICIAL",
    status: "NEEDS_REVIEW",
    market: "BR",
    officialSurface: "Instagram Reels / Professional Dashboard",
    policyNotes: "Superficie oficial registrada; pendente de credenciais/ingestao aprovada.",
  },
  {
    slug: "official-meta-ad-library",
    title: "Meta Ad Library - Instagram placements",
    kind: "META_AD_LIBRARY",
    origin: "OFFICIAL",
    status: "NEEDS_REVIEW",
    market: "BR",
    officialSurface: "Meta Ad Library",
    policyNotes: "Usar apenas como transparencia/analise de criativos; sem copiar midia ou remover watermark.",
  },
  {
    slug: "owned-upload-lab",
    title: "Owned/licensed upload lab",
    kind: "OWNED_UPLOAD",
    origin: "OWNED",
    status: "APPROVED",
    market: "BR",
    officialSurface: "Owned media",
    policyNotes: "Somente arquivos proprios/licenciados e conteudo adulto com idade 18+ inequivoca; metadados removidos apenas com relatorio.",
  },
];

const instagramTrendSources = [
  {
    title: "Instagram Reels official surface",
    sourceType: "REEL",
    sourceUrl: "https://www.instagram.com/reels/",
    region: "global",
    category: "reels",
    status: "ACTIVE",
  },
  {
    title: "Instagram Professional Dashboard / Insights",
    sourceType: "ACCOUNT_INSIGHTS",
    sourceUrl: "https://business.instagram.com/",
    region: "global",
    category: "account_insights",
    status: "ACTIVE",
  },
  {
    title: "Instagram Graph API",
    sourceType: "ACCOUNT_INSIGHTS",
    sourceUrl: "https://developers.facebook.com/docs/instagram-platform/",
    region: "global",
    category: "official_api",
    status: "ACTIVE",
  },
  {
    title: "Meta Ad Library - Instagram placements",
    sourceType: "META_AD_LIBRARY",
    sourceUrl: "https://www.facebook.com/ads/library",
    region: "global",
    category: "ads_transparency",
    status: "ACTIVE",
  },
];

const manualSource = {
  title: "Manual research intake BR",
  kind: "MANUAL_RESEARCH",
  origin: "MANUAL",
  market: "BR",
};

const ingestionStepNames = ["RECEIVE", "VALIDATE", "NORMALIZE", "DEDUPE", "PERSIST", "SCORE", "AUDIT"];

function slug(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertAllowedInstagramUrl(value) {
  const allowedHosts = new Set([
    "instagram.com",
    "www.instagram.com",
    "business.instagram.com",
    "business.facebook.com",
    "facebook.com",
    "www.facebook.com",
    "developers.facebook.com",
  ]);
  const url = new URL(value);

  if (url.protocol !== "https:" || url.username || url.password || !allowedHosts.has(url.hostname.toLowerCase())) {
    throw new Error(`URL Instagram invalida no seed: ${value}`);
  }

  return value;
}

function sourceKey(source) {
  return [
    "source",
    source.origin.toLowerCase(),
    source.kind.toLowerCase(),
    source.market.toLowerCase(),
    slug(source.title),
  ].join(":");
}

async function upsertInstagramTrendSources(workspaceIdForSources) {
  for (const trendSource of instagramTrendSources) {
    await prisma.trendSource.upsert({
      where: {
        workspaceId_platform_sourceType_sourceUrl: {
          workspaceId: workspaceIdForSources,
          platform: "INSTAGRAM",
          sourceType: trendSource.sourceType,
          sourceUrl: assertAllowedInstagramUrl(trendSource.sourceUrl),
        },
      },
      update: {
        title: trendSource.title,
        region: trendSource.region,
        category: trendSource.category,
        status: trendSource.status,
        updatedAt: now,
      },
      create: {
        workspaceId: workspaceIdForSources,
        platform: "INSTAGRAM",
        ...trendSource,
        sourceUrl: assertAllowedInstagramUrl(trendSource.sourceUrl),
      },
    });
  }
}

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: workspaceId },
    update: {
      name: "Default Command Center",
      slug: "default-command-center",
      updatedAt: now,
    },
    create: {
      id: workspaceId,
      name: "Default Command Center",
      slug: "default-command-center",
    },
  });

  const manualConnector = await prisma.connector.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "manual-safe-intake" } },
    update: {
      status: "APPROVED",
      manualEntryEnabled: true,
      updatedAt: now,
    },
    create: {
      workspaceId: workspace.id,
      ...connectors[0],
      manualEntryEnabled: true,
    },
  });

  for (const connector of connectors.slice(1)) {
    await prisma.connector.upsert({
      where: { workspaceId_slug: { workspaceId: workspace.id, slug: connector.slug } },
      update: {
        status: connector.status,
        manualEntryEnabled: true,
        policyNotes: connector.policyNotes,
        updatedAt: now,
      },
      create: {
        workspaceId: workspace.id,
        ...connector,
        manualEntryEnabled: true,
      },
    });
  }

  const sourceDedupeKey = sourceKey(manualSource);
  const source = await prisma.source.upsert({
    where: { workspaceId_dedupeKey: { workspaceId: workspace.id, dedupeKey: sourceDedupeKey } },
    update: {
      connectorId: manualConnector.id,
      updatedAt: now,
    },
    create: {
      workspaceId: workspace.id,
      ...manualSource,
      confidence: "LOW",
      connectorId: manualConnector.id,
      dedupeKey: sourceDedupeKey,
      coverage: "entrada operacional manual",
      freshness: "ao vivo via Postgres",
      gap: "sem coleta externa automatica",
      notes: "Fonte baseline real para iniciar o Ingestion Lab.",
    },
  });

  await upsertInstagramTrendSources(workspace.id);

  const request = await prisma.ingestRequest.upsert({
    where: { workspaceId_requestKey: { workspaceId: workspace.id, requestKey: "baseline:connector-registry" } },
    update: {
      status: "SUCCEEDED",
      completedAt: now,
      processedAt: now,
      payload: {
        connectorSlugs: connectors.map((connector) => connector.slug),
        trendSources: instagramTrendSources.map((trendSource) => trendSource.sourceUrl),
        itemCount: connectors.length + instagramTrendSources.length,
        payloadHash: stableHash({
          connectors: connectors.map((connector) => connector.slug),
          trendSources: instagramTrendSources.map((trendSource) => trendSource.sourceUrl),
        }),
        externalIntegrations: false,
      },
    },
    create: {
      workspaceId: workspace.id,
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
        mode: "tenant-baseline",
        externalIntegrations: false,
      },
    },
  });

  const batch = await prisma.importBatch.upsert({
    where: { workspaceId_idempotencyKey: { workspaceId: workspace.id, idempotencyKey: "baseline:connector-registry" } },
    update: {
      status: "SUCCEEDED",
      completedAt: now,
      processedAt: now,
    },
    create: {
      workspaceId: workspace.id,
      idempotencyKey: "baseline:connector-registry",
      kind: "CONNECTOR_BASELINE",
      status: "SUCCEEDED",
      market: "BR",
      origin: "MANUAL",
      connectorId: manualConnector.id,
      requestId: request.id,
      sourceId: source.id,
      title: "Baseline connector registry",
      itemCount: connectors.length + instagramTrendSources.length,
      payloadHash: stableHash({
        connectors: connectors.map((connector) => connector.slug),
        trendSources: instagramTrendSources.map((trendSource) => trendSource.sourceUrl),
      }),
      payload: {
        connectorSlugs: connectors.map((connector) => connector.slug),
        trendSources: instagramTrendSources.map((trendSource) => trendSource.sourceUrl),
        externalIntegrations: false,
      },
      collectedAt: now,
      processedAt: now,
      completedAt: now,
    },
  });

  await prisma.ingestionStep.deleteMany({ where: { workspaceId: workspace.id, batchId: batch.id } });
  await prisma.ingestionStep.createMany({
    data: ingestionStepNames.map((name, index) => ({
      workspaceId: workspace.id,
      batchId: batch.id,
      name,
      status: "SUCCEEDED",
      sequence: index + 1,
      startedAt: now,
      completedAt: now,
      notes: "Baseline operacional aplicado ao workspace.",
    })),
  });

  const job = await prisma.jobRun.upsert({
    where: { id: `job-${workspace.id}-baseline` },
    update: {
      status: "SUCCEEDED",
      finishedAt: now,
      importBatchId: batch.id,
    },
    create: {
      id: `job-${workspace.id}-baseline`,
      workspaceId: workspace.id,
      name: "tenant-baseline-seed",
      status: "SUCCEEDED",
      stage: "AUDIT",
      requestId: request.id,
      importBatchId: batch.id,
      payload: {
        mode: "tenant-baseline",
        externalIntegrations: false,
      },
      startedAt: now,
      finishedAt: now,
    },
  });

  await prisma.auditEvent.upsert({
    where: { id: `audit-${workspace.id}-baseline` },
    update: {
      eventAt: now,
      sourceId: source.id,
      importBatchId: batch.id,
      jobRunId: job.id,
    },
    create: {
      id: `audit-${workspace.id}-baseline`,
      workspaceId: workspace.id,
      type: "SYSTEM",
      sourceId: source.id,
      importBatchId: batch.id,
      jobRunId: job.id,
      label: "baseline",
      value: "tenant",
      tone: "aqua",
      message: "Workspace inicializado com connectors reais e sem dados de tendencia ficticios.",
      actor: "seed",
      metadata: {
        connectorCount: connectors.length,
        trendSourceCount: instagramTrendSources.length,
        externalIntegrations: false,
      },
    },
  });

  const existingWorkspaces = await prisma.workspace.findMany({
    where: { id: { not: workspace.id } },
    select: { id: true },
  });

  for (const existingWorkspace of existingWorkspaces) {
    await upsertInstagramTrendSources(existingWorkspace.id);
  }

  const [
    workspaceCount,
    connectorCount,
    sourceCount,
    trendSourceCount,
    signalCount,
    evidenceCount,
    queueCount,
    auditCount,
    jobCount,
  ] =
    await Promise.all([
      prisma.workspace.count(),
      prisma.connector.count({ where: { workspaceId: workspace.id } }),
      prisma.source.count({ where: { workspaceId: workspace.id } }),
      prisma.trendSource.count({ where: { workspaceId: workspace.id } }),
      prisma.signal.count({ where: { workspaceId: workspace.id } }),
      prisma.evidence.count({ where: { workspaceId: workspace.id } }),
      prisma.decisionQueueItem.count({ where: { workspaceId: workspace.id } }),
      prisma.auditEvent.count({ where: { workspaceId: workspace.id } }),
      prisma.jobRun.count({ where: { workspaceId: workspace.id } }),
    ]);

  console.log(
    JSON.stringify(
      {
        workspaceCount,
        workspaceId: workspace.id,
        instagramSeededWorkspaceCount: existingWorkspaces.length + 1,
        connectorCount,
        sourceCount,
        trendSourceCount,
        signalCount,
        evidenceCount,
        queueCount,
        auditCount,
        jobCount,
        mode: "postgres-tenant-baseline",
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
