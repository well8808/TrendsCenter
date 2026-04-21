-- CreateTable
CREATE TABLE "Source" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SourceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL,
    "rawPayloadHash" TEXT NOT NULL,
    "storagePath" TEXT,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceSnapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendSignal" (
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
    "origin" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'LOW',
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrendSignal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "observedAt" DATETIME NOT NULL,
    "rank" INTEGER,
    "postCount" INTEGER,
    "viewCount" BIGINT,
    "likeCount" BIGINT,
    "commentCount" BIGINT,
    "shareCount" BIGINT,
    "rawMetrics" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrendObservation_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "TrendSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrendObservation_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SourceSnapshot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
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
    CONSTRAINT "TrendScore_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "TrendSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "excerpt" TEXT,
    "note" TEXT,
    "quality" TEXT NOT NULL DEFAULT 'LOW',
    "capturedAt" DATETIME NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceItem_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "TrendSignal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceSavedSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT NOT NULL,
    "label" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceSavedSignal_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "TrendSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SignalHistoryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "eventAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignalHistoryEvent_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "TrendSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "policyRef" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceFlag_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "TrendSignal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerLabel" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "isLicensed" BOOLEAN NOT NULL DEFAULT false,
    "metadataReport" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MediaDerivative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaDerivative_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TrendSignal_market_type_status_idx" ON "TrendSignal"("market", "type", "status");

-- CreateIndex
CREATE INDEX "TrendSignal_priority_riskLevel_stage_idx" ON "TrendSignal"("priority", "riskLevel", "stage");

-- CreateIndex
CREATE INDEX "TrendSignal_origin_isDemo_idx" ON "TrendSignal"("origin", "isDemo");

-- CreateIndex
CREATE INDEX "TrendObservation_signalId_observedAt_idx" ON "TrendObservation"("signalId", "observedAt");

-- CreateIndex
CREATE INDEX "TrendScore_signalId_calculatedAt_idx" ON "TrendScore"("signalId", "calculatedAt");

-- CreateIndex
CREATE INDEX "EvidenceItem_sourceId_capturedAt_idx" ON "EvidenceItem"("sourceId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceSavedSignal_signalId_key" ON "WorkspaceSavedSignal"("signalId");

-- CreateIndex
CREATE INDEX "WorkspaceSavedSignal_signalId_createdAt_idx" ON "WorkspaceSavedSignal"("signalId", "createdAt");

-- CreateIndex
CREATE INDEX "SignalHistoryEvent_signalId_eventAt_idx" ON "SignalHistoryEvent"("signalId", "eventAt");

-- CreateIndex
CREATE INDEX "ComplianceFlag_severity_resolvedAt_idx" ON "ComplianceFlag"("severity", "resolvedAt");

-- CreateIndex
CREATE INDEX "JobRun_name_status_createdAt_idx" ON "JobRun"("name", "status", "createdAt");
