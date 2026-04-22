-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'ANALYST',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- Legacy tenant for data created before auth/tenancy.
INSERT INTO "Workspace" ("id", "slug", "name", "createdAt", "updatedAt")
VALUES ('workspace-default-command-center', 'default-command-center', 'Default Command Center', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "slug" = EXCLUDED."slug",
  "name" = EXCLUDED."name",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Tenant columns
ALTER TABLE "Connector" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Source" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "SourceSnapshot" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Signal" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "SignalObservation" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "SignalScore" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "DecisionQueueItem" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "AuditEvent" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "ComplianceFlag" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "MediaDerivative" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "JobRun" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "IngestRequest" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "ImportBatch" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "IngestionStep" ADD COLUMN "workspaceId" TEXT;

UPDATE "Connector" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "Source" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "SourceSnapshot" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "Signal" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "SignalObservation" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "SignalScore" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "Evidence" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "DecisionQueueItem" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "AuditEvent" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "ComplianceFlag" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "MediaAsset" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "MediaDerivative" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "JobRun" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "IngestRequest" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "ImportBatch" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;
UPDATE "IngestionStep" SET "workspaceId" = 'workspace-default-command-center' WHERE "workspaceId" IS NULL;

ALTER TABLE "Connector" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Source" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "SourceSnapshot" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Signal" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "SignalObservation" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "SignalScore" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Evidence" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "DecisionQueueItem" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AuditEvent" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "ComplianceFlag" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "MediaAsset" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "MediaDerivative" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "JobRun" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "IngestRequest" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "ImportBatch" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "IngestionStep" ALTER COLUMN "workspaceId" SET NOT NULL;

-- Replace global uniqueness with tenant-scoped uniqueness.
DROP INDEX IF EXISTS "Connector_slug_key";
DROP INDEX IF EXISTS "Source_dedupeKey_key";
DROP INDEX IF EXISTS "Signal_dedupeKey_key";
DROP INDEX IF EXISTS "Evidence_dedupeKey_key";
DROP INDEX IF EXISTS "DecisionQueueItem_signalId_key";
DROP INDEX IF EXISTS "IngestRequest_requestKey_key";
DROP INDEX IF EXISTS "ImportBatch_idempotencyKey_key";

-- Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");
CREATE INDEX "WorkspaceMember_workspaceId_role_status_idx" ON "WorkspaceMember"("workspaceId", "role", "status");
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");
CREATE INDEX "AuthSession_workspaceId_expiresAt_idx" ON "AuthSession"("workspaceId", "expiresAt");

CREATE UNIQUE INDEX "Connector_workspaceId_slug_key" ON "Connector"("workspaceId", "slug");
CREATE INDEX "Connector_workspaceId_origin_kind_status_idx" ON "Connector"("workspaceId", "origin", "kind", "status");
CREATE UNIQUE INDEX "Source_workspaceId_dedupeKey_key" ON "Source"("workspaceId", "dedupeKey");
CREATE INDEX "Source_workspaceId_origin_kind_market_idx" ON "Source"("workspaceId", "origin", "kind", "market");
CREATE INDEX "SourceSnapshot_workspaceId_collectedAt_idx" ON "SourceSnapshot"("workspaceId", "collectedAt");
CREATE UNIQUE INDEX "Signal_workspaceId_dedupeKey_key" ON "Signal"("workspaceId", "dedupeKey");
CREATE INDEX "Signal_workspaceId_market_type_status_idx" ON "Signal"("workspaceId", "market", "type", "status");
CREATE INDEX "Signal_workspaceId_priority_riskLevel_stage_idx" ON "Signal"("workspaceId", "priority", "riskLevel", "stage");
CREATE INDEX "SignalObservation_workspaceId_observedAt_idx" ON "SignalObservation"("workspaceId", "observedAt");
CREATE INDEX "SignalScore_workspaceId_calculatedAt_idx" ON "SignalScore"("workspaceId", "calculatedAt");
CREATE UNIQUE INDEX "Evidence_workspaceId_dedupeKey_key" ON "Evidence"("workspaceId", "dedupeKey");
CREATE INDEX "Evidence_workspaceId_capturedAt_idx" ON "Evidence"("workspaceId", "capturedAt");
CREATE UNIQUE INDEX "DecisionQueueItem_workspaceId_signalId_key" ON "DecisionQueueItem"("workspaceId", "signalId");
CREATE INDEX "DecisionQueueItem_workspaceId_status_createdAt_idx" ON "DecisionQueueItem"("workspaceId", "status", "createdAt");
CREATE INDEX "AuditEvent_workspaceId_type_eventAt_idx" ON "AuditEvent"("workspaceId", "type", "eventAt");
CREATE INDEX "ComplianceFlag_workspaceId_severity_resolvedAt_idx" ON "ComplianceFlag"("workspaceId", "severity", "resolvedAt");
CREATE INDEX "MediaAsset_workspaceId_origin_createdAt_idx" ON "MediaAsset"("workspaceId", "origin", "createdAt");
CREATE INDEX "MediaDerivative_workspaceId_createdAt_idx" ON "MediaDerivative"("workspaceId", "createdAt");
CREATE INDEX "JobRun_workspaceId_status_createdAt_idx" ON "JobRun"("workspaceId", "status", "createdAt");
CREATE UNIQUE INDEX "IngestRequest_workspaceId_requestKey_key" ON "IngestRequest"("workspaceId", "requestKey");
CREATE INDEX "IngestRequest_workspaceId_status_submittedAt_idx" ON "IngestRequest"("workspaceId", "status", "submittedAt");
CREATE UNIQUE INDEX "ImportBatch_workspaceId_idempotencyKey_key" ON "ImportBatch"("workspaceId", "idempotencyKey");
CREATE INDEX "ImportBatch_workspaceId_status_createdAt_idx" ON "ImportBatch"("workspaceId", "status", "createdAt");
CREATE INDEX "IngestionStep_workspaceId_name_status_idx" ON "IngestionStep"("workspaceId", "name", "status");

-- Foreign keys
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Connector" ADD CONSTRAINT "Connector_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceSnapshot" ADD CONSTRAINT "SourceSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalObservation" ADD CONSTRAINT "SignalObservation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalScore" ADD CONSTRAINT "SignalScore_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DecisionQueueItem" ADD CONSTRAINT "DecisionQueueItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceFlag" ADD CONSTRAINT "ComplianceFlag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaDerivative" ADD CONSTRAINT "MediaDerivative_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IngestRequest" ADD CONSTRAINT "IngestRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IngestionStep" ADD CONSTRAINT "IngestionStep_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
