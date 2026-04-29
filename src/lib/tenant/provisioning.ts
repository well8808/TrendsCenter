import type { Prisma } from "@prisma/client";

import { buildSourceDedupeKey } from "@/lib/ingestion/dedupe";
import {
  assertAllowedInstagramSourceUrl,
  instagramOfficialSources,
  type InstagramTrendSourceStatus,
  type InstagramTrendSourceType,
} from "@/lib/instagram/official-sources";

type Tx = Prisma.TransactionClient;

const baselineConnectors = [
  {
    slug: "manual-safe-intake",
    title: "Manual safe intake",
    kind: "MANUAL_RESEARCH",
    origin: "MANUAL",
    status: "APPROVED",
    market: "BR",
    officialSurface: "Operator entry",
    policyNotes: "Entrada manual rastreável; sem scraping e sem coleta externa automática.",
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
] as const;

const manualSource = {
  title: "Manual research intake BR",
  kind: "MANUAL_RESEARCH",
  origin: "MANUAL",
  market: "BR",
} as const;

const ingestionStepNames = ["RECEIVE", "VALIDATE", "NORMALIZE", "DEDUPE", "PERSIST", "SCORE", "AUDIT"] as const;

const trendSourceTypeMap: Record<InstagramTrendSourceType, Prisma.TrendSourceCreateInput["sourceType"]> = {
  reel: "REEL",
  audio: "AUDIO",
  account_insights: "ACCOUNT_INSIGHTS",
  meta_ad_library: "META_AD_LIBRARY",
  hashtag: "HASHTAG",
  creator: "CREATOR",
  manual: "MANUAL",
};

const trendSourceStatusMap: Record<InstagramTrendSourceStatus, Prisma.TrendSourceCreateInput["status"]> = {
  active: "ACTIVE",
  paused: "PAUSED",
  error: "ERROR",
};

function toTrendSourceType(value: InstagramTrendSourceType) {
  return trendSourceTypeMap[value];
}

function toTrendSourceStatus(value: InstagramTrendSourceStatus) {
  return trendSourceStatusMap[value];
}

export async function provisionWorkspaceBaseline(
  tx: Tx,
  {
    workspaceId,
    actor = "system",
    now = new Date(),
  }: {
    workspaceId: string;
    actor?: string;
    now?: Date;
  },
) {
  const manualConnector = await tx.connector.upsert({
    where: { workspaceId_slug: { workspaceId, slug: "manual-safe-intake" } },
    update: {
      status: "APPROVED",
      manualEntryEnabled: true,
      updatedAt: now,
    },
    create: {
      workspaceId,
      ...baselineConnectors[0],
      manualEntryEnabled: true,
    },
  });

  for (const connector of baselineConnectors.slice(1)) {
    await tx.connector.upsert({
      where: { workspaceId_slug: { workspaceId, slug: connector.slug } },
      update: {
        status: connector.status,
        manualEntryEnabled: true,
        policyNotes: connector.policyNotes,
        updatedAt: now,
      },
      create: {
        workspaceId,
        ...connector,
        manualEntryEnabled: true,
      },
    });
  }

  const sourceDedupeKey = buildSourceDedupeKey(manualSource);
  const source = await tx.source.upsert({
    where: { workspaceId_dedupeKey: { workspaceId, dedupeKey: sourceDedupeKey } },
    update: {
      connectorId: manualConnector.id,
      updatedAt: now,
    },
    create: {
      workspaceId,
      ...manualSource,
      confidence: "LOW",
      connectorId: manualConnector.id,
      dedupeKey: sourceDedupeKey,
      coverage: "entrada operacional manual",
      freshness: "ao vivo via Postgres",
      gap: "sem coleta externa automática",
      notes: "Fonte baseline real para iniciar o Ingestion Lab.",
    },
  });

  for (const trendSource of instagramOfficialSources) {
    await tx.trendSource.upsert({
      where: {
        workspaceId_platform_sourceType_sourceUrl: {
          workspaceId,
          platform: "INSTAGRAM",
          sourceType: toTrendSourceType(trendSource.sourceType),
          sourceUrl: assertAllowedInstagramSourceUrl(trendSource.sourceUrl),
        },
      },
      update: {
        title: trendSource.title,
        region: trendSource.region,
        category: trendSource.category,
        status: toTrendSourceStatus(trendSource.status),
        updatedAt: now,
      },
      create: {
        workspaceId,
        platform: "INSTAGRAM",
        title: trendSource.title,
        sourceType: toTrendSourceType(trendSource.sourceType),
        sourceUrl: assertAllowedInstagramSourceUrl(trendSource.sourceUrl),
        region: trendSource.region,
        category: trendSource.category,
        status: toTrendSourceStatus(trendSource.status),
      },
    });
  }

  const request = await tx.ingestRequest.upsert({
    where: { workspaceId_requestKey: { workspaceId, requestKey: "baseline:connector-registry" } },
    update: {
      status: "SUCCEEDED",
      completedAt: now,
      processedAt: now,
      payload: {
        connectorSlugs: baselineConnectors.map((connector) => connector.slug),
        trendSources: instagramOfficialSources.map((sourceItem) => sourceItem.id),
        itemCount: baselineConnectors.length + instagramOfficialSources.length,
        payloadHash: "baseline-connector-registry-v4-instagram-reels-sources",
        externalIntegrations: false,
      },
    },
    create: {
      workspaceId,
      requestKey: "baseline:connector-registry",
      type: "SOURCE_REGISTER",
      status: "SUCCEEDED",
      market: "BR",
      origin: "MANUAL",
      connectorId: manualConnector.id,
      sourceId: source.id,
      title: "Baseline connector registry",
      submittedBy: actor,
      collectedAt: now,
      processedAt: now,
      completedAt: now,
      payload: {
        mode: "tenant-baseline",
        externalIntegrations: false,
      },
    },
  });

  const batch = await tx.importBatch.upsert({
    where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey: "baseline:connector-registry" } },
    update: {
      status: "SUCCEEDED",
      completedAt: now,
      processedAt: now,
    },
    create: {
      workspaceId,
      idempotencyKey: "baseline:connector-registry",
      kind: "CONNECTOR_BASELINE",
      status: "SUCCEEDED",
      market: "BR",
      origin: "MANUAL",
      connectorId: manualConnector.id,
      requestId: request.id,
      sourceId: source.id,
      title: "Baseline connector registry",
      itemCount: baselineConnectors.length + instagramOfficialSources.length,
      payloadHash: "baseline-connector-registry-v4-instagram-reels-sources",
      payload: {
        connectorSlugs: baselineConnectors.map((connector) => connector.slug),
        trendSources: instagramOfficialSources.map((sourceItem) => sourceItem.id),
        externalIntegrations: false,
      },
      collectedAt: now,
      processedAt: now,
      completedAt: now,
    },
  });

  await tx.ingestionStep.deleteMany({ where: { workspaceId, batchId: batch.id } });
  await tx.ingestionStep.createMany({
    data: ingestionStepNames.map((name, index) => ({
      workspaceId,
      batchId: batch.id,
      name,
      status: "SUCCEEDED",
      sequence: index + 1,
      startedAt: now,
      completedAt: now,
      notes: "Baseline operacional aplicado ao workspace.",
    })),
  });

  const job = await tx.jobRun.upsert({
    where: { id: `job-${workspaceId}-baseline` },
    update: {
      status: "SUCCEEDED",
      finishedAt: now,
      importBatchId: batch.id,
    },
    create: {
      id: `job-${workspaceId}-baseline`,
      workspaceId,
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

  await tx.auditEvent.upsert({
    where: { id: `audit-${workspaceId}-baseline` },
    update: {
      eventAt: now,
      sourceId: source.id,
      importBatchId: batch.id,
      jobRunId: job.id,
    },
    create: {
      id: `audit-${workspaceId}-baseline`,
      workspaceId,
      type: "SYSTEM",
      sourceId: source.id,
      importBatchId: batch.id,
      jobRunId: job.id,
      label: "baseline",
      value: "tenant",
      tone: "aqua",
      message: "Workspace inicializado com connectors reais e sem dados de tendência fictícios.",
      actor,
      metadata: {
        connectorCount: baselineConnectors.length,
        trendSourceCount: instagramOfficialSources.length,
        externalIntegrations: false,
      },
    },
  });

  return {
    connectorCount: baselineConnectors.length,
    trendSourceCount: instagramOfficialSources.length,
    sourceId: source.id,
    requestId: request.id,
    batchId: batch.id,
    jobId: job.id,
  };
}
