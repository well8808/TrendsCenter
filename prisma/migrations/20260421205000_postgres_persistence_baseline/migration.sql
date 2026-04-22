-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Market" AS ENUM ('BR', 'US');

-- CreateEnum
CREATE TYPE "DataOrigin" AS ENUM ('OFFICIAL', 'OWNED', 'MANUAL', 'DEMO');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('CREATIVE_CENTER_TRENDS', 'TOP_ADS', 'KEYWORD_INSIGHTS', 'CREATIVE_INSIGHTS', 'AUDIENCE_INSIGHTS', 'TIKTOK_ONE', 'MARKET_SCOPE', 'DISPLAY_API', 'COMMERCIAL_MUSIC_LIBRARY', 'OWNED_UPLOAD', 'MANUAL_RESEARCH', 'DEMO');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('AUDIO', 'FORMAT', 'HASHTAG', 'CREATOR', 'REVIVAL', 'US_TO_BR');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('RISING', 'RETURNING', 'WATCH', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConfidenceBand" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SignalPriority" AS ENUM ('NOW', 'NEXT', 'WATCH', 'HOLD');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TrendStage" AS ENUM ('EMERGING', 'ACCELERATING', 'PROVING', 'REVIVAL', 'MONITOR');

-- CreateEnum
CREATE TYPE "ComplianceSeverity" AS ENUM ('INFO', 'WARNING', 'BLOCKER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('APPROVED', 'PAUSED', 'NEEDS_REVIEW', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DecisionQueueStatus" AS ENUM ('ACTIVE', 'SNOOZED', 'DONE', 'REMOVED');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('SIGNAL_CREATED', 'SIGNAL_UPDATED', 'EVIDENCE_ATTACHED', 'SOURCE_REGISTERED', 'DECISION_QUEUED', 'DECISION_REMOVED', 'JOB_RECORDED', 'COMPLIANCE_BLOCKED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "IngestRequestType" AS ENUM ('SIGNAL_CREATE', 'EVIDENCE_APPEND', 'SOURCE_REGISTER', 'OFFICIAL_SNAPSHOT');

-- CreateEnum
CREATE TYPE "IngestStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "IngestStepName" AS ENUM ('RECEIVE', 'VALIDATE', 'NORMALIZE', 'DEDUPE', 'PERSIST', 'SCORE', 'AUDIT');

-- CreateEnum
CREATE TYPE "ImportBatchKind" AS ENUM ('MANUAL_SIGNAL', 'MANUAL_EVIDENCE', 'OFFICIAL_SNAPSHOT', 'CONNECTOR_BASELINE');

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "origin" "DataOrigin" NOT NULL,
    "status" "ConnectorStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "market" "Market",
    "manualEntryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "officialSurface" TEXT,
    "policyNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "origin" "DataOrigin" NOT NULL,
    "url" TEXT,
    "market" "Market" NOT NULL,
    "confidence" "ConfidenceBand" NOT NULL DEFAULT 'LOW',
    "notes" TEXT,
    "coverage" TEXT,
    "freshness" TEXT,
    "gap" TEXT,
    "dedupeKey" TEXT,
    "connectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceSnapshot" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "jobRunId" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "rawPayloadHash" TEXT NOT NULL,
    "storagePath" TEXT,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "market" "Market" NOT NULL,
    "audience" TEXT NOT NULL,
    "status" "SignalStatus" NOT NULL DEFAULT 'WATCH',
    "priority" "SignalPriority" NOT NULL DEFAULT 'WATCH',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "stage" "TrendStage" NOT NULL DEFAULT 'MONITOR',
    "strength" INTEGER NOT NULL DEFAULT 0,
    "trendWindow" TEXT,
    "decision" TEXT,
    "nextAction" TEXT,
    "tags" JSONB,
    "scoreDrivers" JSONB,
    "dedupeKey" TEXT,
    "importBatchId" TEXT,
    "lastIngestedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "origin" "DataOrigin" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "confidence" "ConfidenceBand" NOT NULL DEFAULT 'LOW',
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalObservation" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER,
    "postCount" INTEGER,
    "viewCount" BIGINT,
    "likeCount" BIGINT,
    "commentCount" BIGINT,
    "shareCount" BIGINT,
    "rawMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalScore" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "confidence" "ConfidenceBand" NOT NULL,
    "velocity7d" INTEGER NOT NULL,
    "acceleration" INTEGER NOT NULL,
    "brazilFit" INTEGER NOT NULL,
    "usTransferability" INTEGER NOT NULL,
    "formatRepeatability" INTEGER NOT NULL,
    "creatorSignal" INTEGER NOT NULL,
    "audioCommercialUsable" INTEGER NOT NULL,
    "revivalStrength" INTEGER NOT NULL,
    "evidenceQuality" INTEGER NOT NULL,
    "riskPenalty" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'score-v0.1',
    "explanation" TEXT,

    CONSTRAINT "SignalScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "signalId" TEXT,
    "sourceId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "jobRunId" TEXT,
    "snapshotId" TEXT,
    "dedupeKey" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "excerpt" TEXT,
    "note" TEXT,
    "quality" "ConfidenceBand" NOT NULL DEFAULT 'LOW',
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionQueueItem" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "status" "DecisionQueueStatus" NOT NULL DEFAULT 'ACTIVE',
    "label" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "type" "AuditEventType" NOT NULL,
    "signalId" TEXT,
    "sourceId" TEXT,
    "importBatchId" TEXT,
    "jobRunId" TEXT,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'violet',
    "message" TEXT,
    "actor" TEXT NOT NULL DEFAULT 'system',
    "metadata" JSONB,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceFlag" (
    "id" TEXT NOT NULL,
    "signalId" TEXT,
    "severity" "ComplianceSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "policyRef" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "ownerLabel" TEXT NOT NULL,
    "origin" "DataOrigin" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "isLicensed" BOOLEAN NOT NULL DEFAULT false,
    "metadataReport" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaDerivative" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaDerivative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "stage" "IngestStepName",
    "requestId" TEXT,
    "importBatchId" TEXT,
    "payload" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRequest" (
    "id" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "type" "IngestRequestType" NOT NULL,
    "status" "IngestStatus" NOT NULL DEFAULT 'QUEUED',
    "market" "Market" NOT NULL,
    "origin" "DataOrigin" NOT NULL,
    "connectorId" TEXT,
    "sourceId" TEXT,
    "signalId" TEXT,
    "title" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL DEFAULT 'operator',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "payload" JSONB,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IngestRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "kind" "ImportBatchKind" NOT NULL,
    "status" "IngestStatus" NOT NULL DEFAULT 'QUEUED',
    "market" "Market" NOT NULL,
    "origin" "DataOrigin" NOT NULL,
    "connectorId" TEXT,
    "requestId" TEXT,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "payloadHash" TEXT,
    "payload" JSONB,
    "collectedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionStep" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "name" "IngestStepName" NOT NULL,
    "status" "IngestStatus" NOT NULL DEFAULT 'QUEUED',
    "sequence" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Connector_slug_key" ON "Connector"("slug");

-- CreateIndex
CREATE INDEX "Connector_origin_kind_status_idx" ON "Connector"("origin", "kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Source_dedupeKey_key" ON "Source"("dedupeKey");

-- CreateIndex
CREATE INDEX "Source_origin_kind_market_idx" ON "Source"("origin", "kind", "market");

-- CreateIndex
CREATE UNIQUE INDEX "Signal_dedupeKey_key" ON "Signal"("dedupeKey");

-- CreateIndex
CREATE INDEX "Signal_market_type_status_idx" ON "Signal"("market", "type", "status");

-- CreateIndex
CREATE INDEX "Signal_priority_riskLevel_stage_idx" ON "Signal"("priority", "riskLevel", "stage");

-- CreateIndex
CREATE INDEX "Signal_origin_isDemo_idx" ON "Signal"("origin", "isDemo");

-- CreateIndex
CREATE INDEX "SignalObservation_signalId_observedAt_idx" ON "SignalObservation"("signalId", "observedAt");

-- CreateIndex
CREATE INDEX "SignalScore_signalId_calculatedAt_idx" ON "SignalScore"("signalId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_dedupeKey_key" ON "Evidence"("dedupeKey");

-- CreateIndex
CREATE INDEX "Evidence_sourceId_capturedAt_idx" ON "Evidence"("sourceId", "capturedAt");

-- CreateIndex
CREATE INDEX "Evidence_signalId_capturedAt_idx" ON "Evidence"("signalId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionQueueItem_signalId_key" ON "DecisionQueueItem"("signalId");

-- CreateIndex
CREATE INDEX "DecisionQueueItem_status_createdAt_idx" ON "DecisionQueueItem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_signalId_eventAt_idx" ON "AuditEvent"("signalId", "eventAt");

-- CreateIndex
CREATE INDEX "AuditEvent_type_eventAt_idx" ON "AuditEvent"("type", "eventAt");

-- CreateIndex
CREATE INDEX "ComplianceFlag_severity_resolvedAt_idx" ON "ComplianceFlag"("severity", "resolvedAt");

-- CreateIndex
CREATE INDEX "JobRun_name_status_createdAt_idx" ON "JobRun"("name", "status", "createdAt");

-- CreateIndex
CREATE INDEX "JobRun_importBatchId_status_idx" ON "JobRun"("importBatchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IngestRequest_requestKey_key" ON "IngestRequest"("requestKey");

-- CreateIndex
CREATE INDEX "IngestRequest_status_submittedAt_idx" ON "IngestRequest"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "IngestRequest_market_origin_type_idx" ON "IngestRequest"("market", "origin", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_idempotencyKey_key" ON "ImportBatch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ImportBatch_status_createdAt_idx" ON "ImportBatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_market_origin_kind_idx" ON "ImportBatch"("market", "origin", "kind");

-- CreateIndex
CREATE INDEX "IngestionStep_batchId_sequence_idx" ON "IngestionStep"("batchId", "sequence");

-- CreateIndex
CREATE INDEX "IngestionStep_name_status_idx" ON "IngestionStep"("name", "status");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSnapshot" ADD CONSTRAINT "SourceSnapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSnapshot" ADD CONSTRAINT "SourceSnapshot_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSnapshot" ADD CONSTRAINT "SourceSnapshot_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalObservation" ADD CONSTRAINT "SignalObservation_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalObservation" ADD CONSTRAINT "SignalObservation_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SourceSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalScore" ADD CONSTRAINT "SignalScore_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SourceSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionQueueItem" ADD CONSTRAINT "DecisionQueueItem_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceFlag" ADD CONSTRAINT "ComplianceFlag_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaDerivative" ADD CONSTRAINT "MediaDerivative_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "IngestRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestRequest" ADD CONSTRAINT "IngestRequest_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestRequest" ADD CONSTRAINT "IngestRequest_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestRequest" ADD CONSTRAINT "IngestRequest_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "IngestRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionStep" ADD CONSTRAINT "IngestionStep_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
