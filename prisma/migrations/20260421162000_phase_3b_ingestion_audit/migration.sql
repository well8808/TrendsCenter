-- CreateTable
CREATE TABLE "SourceConnector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
    "market" TEXT,
    "manualEntryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "officialSurface" TEXT,
    "policyNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IngestRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "market" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "connectorId" TEXT,
    "sourceId" TEXT,
    "signalId" TEXT,
    "title" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL DEFAULT 'operator',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedAt" DATETIME,
    "processedAt" DATETIME,
    "completedAt" DATETIME,
    "error" TEXT,
    "payload" JSONB,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "IngestRequest_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "SourceConnector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IngestRequest_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IngestRequest_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "TrendSignal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "market" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "connectorId" TEXT,
    "requestId" TEXT,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "payloadHash" TEXT,
    "payload" JSONB,
    "collectedAt" DATETIME,
    "processedAt" DATETIME,
    "completedAt" DATETIME,
    "error" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImportBatch_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "SourceConnector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ImportBatch_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "IngestRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ImportBatch_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IngestionStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "sequence" INTEGER NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "error" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngestionStep_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EvidenceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "quality" TEXT NOT NULL DEFAULT 'LOW',
    "capturedAt" DATETIME NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceItem_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "TrendSignal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SourceSnapshot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EvidenceItem" ("capturedAt", "createdAt", "excerpt", "id", "isDemo", "note", "quality", "signalId", "sourceId", "title", "url") SELECT "capturedAt", "createdAt", "excerpt", "id", "isDemo", "note", "quality", "signalId", "sourceId", "title", "url" FROM "EvidenceItem";
DROP TABLE "EvidenceItem";
ALTER TABLE "new_EvidenceItem" RENAME TO "EvidenceItem";
CREATE UNIQUE INDEX "EvidenceItem_dedupeKey_key" ON "EvidenceItem"("dedupeKey");
CREATE INDEX "EvidenceItem_sourceId_capturedAt_idx" ON "EvidenceItem"("sourceId", "capturedAt");
CREATE INDEX "EvidenceItem_signalId_capturedAt_idx" ON "EvidenceItem"("signalId", "capturedAt");
CREATE TABLE "new_JobRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "stage" TEXT,
    "requestId" TEXT,
    "importBatchId" TEXT,
    "payload" JSONB,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobRun_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "IngestRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JobRun_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JobRun" ("createdAt", "error", "finishedAt", "id", "name", "payload", "startedAt", "status") SELECT "createdAt", "error", "finishedAt", "id", "name", "payload", "startedAt", "status" FROM "JobRun";
DROP TABLE "JobRun";
ALTER TABLE "new_JobRun" RENAME TO "JobRun";
CREATE INDEX "JobRun_name_status_createdAt_idx" ON "JobRun"("name", "status", "createdAt");
CREATE INDEX "JobRun_importBatchId_status_idx" ON "JobRun"("importBatchId", "status");
CREATE TABLE "new_Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "url" TEXT,
    "market" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'LOW',
    "notes" TEXT,
    "coverage" TEXT,
    "freshness" TEXT,
    "gap" TEXT,
    "dedupeKey" TEXT,
    "connectorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Source_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "SourceConnector" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Source" ("confidence", "coverage", "createdAt", "freshness", "gap", "id", "kind", "market", "notes", "origin", "title", "updatedAt", "url") SELECT "confidence", "coverage", "createdAt", "freshness", "gap", "id", "kind", "market", "notes", "origin", "title", "updatedAt", "url" FROM "Source";
DROP TABLE "Source";
ALTER TABLE "new_Source" RENAME TO "Source";
CREATE UNIQUE INDEX "Source_dedupeKey_key" ON "Source"("dedupeKey");
CREATE INDEX "Source_origin_kind_market_idx" ON "Source"("origin", "kind", "market");
CREATE TABLE "new_SourceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "jobRunId" TEXT,
    "collectedAt" DATETIME NOT NULL,
    "rawPayloadHash" TEXT NOT NULL,
    "storagePath" TEXT,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceSnapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SourceSnapshot_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SourceSnapshot_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SourceSnapshot" ("collectedAt", "createdAt", "id", "isDemo", "rawPayloadHash", "recordCount", "sourceId", "storagePath") SELECT "collectedAt", "createdAt", "id", "isDemo", "rawPayloadHash", "recordCount", "sourceId", "storagePath" FROM "SourceSnapshot";
DROP TABLE "SourceSnapshot";
ALTER TABLE "new_SourceSnapshot" RENAME TO "SourceSnapshot";
CREATE TABLE "new_TrendSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WATCH',
    "priority" TEXT NOT NULL DEFAULT 'WATCH',
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "stage" TEXT NOT NULL DEFAULT 'MONITOR',
    "strength" INTEGER NOT NULL DEFAULT 0,
    "trendWindow" TEXT,
    "decision" TEXT,
    "nextAction" TEXT,
    "tags" JSONB,
    "scoreDrivers" JSONB,
    "dedupeKey" TEXT,
    "importBatchId" TEXT,
    "lastIngestedAt" DATETIME,
    "processedAt" DATETIME,
    "origin" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'LOW',
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrendSignal_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrendSignal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TrendSignal" ("audience", "confidence", "createdAt", "decision", "evidenceCount", "id", "isDemo", "market", "nextAction", "origin", "priority", "riskLevel", "scoreDrivers", "sourceId", "stage", "status", "strength", "summary", "tags", "title", "trendWindow", "type", "updatedAt") SELECT "audience", "confidence", "createdAt", "decision", "evidenceCount", "id", "isDemo", "market", "nextAction", "origin", "priority", "riskLevel", "scoreDrivers", "sourceId", "stage", "status", "strength", "summary", "tags", "title", "trendWindow", "type", "updatedAt" FROM "TrendSignal";
DROP TABLE "TrendSignal";
ALTER TABLE "new_TrendSignal" RENAME TO "TrendSignal";
CREATE UNIQUE INDEX "TrendSignal_dedupeKey_key" ON "TrendSignal"("dedupeKey");
CREATE INDEX "TrendSignal_market_type_status_idx" ON "TrendSignal"("market", "type", "status");
CREATE INDEX "TrendSignal_priority_riskLevel_stage_idx" ON "TrendSignal"("priority", "riskLevel", "stage");
CREATE INDEX "TrendSignal_origin_isDemo_idx" ON "TrendSignal"("origin", "isDemo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SourceConnector_slug_key" ON "SourceConnector"("slug");

-- CreateIndex
CREATE INDEX "SourceConnector_origin_kind_status_idx" ON "SourceConnector"("origin", "kind", "status");

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
