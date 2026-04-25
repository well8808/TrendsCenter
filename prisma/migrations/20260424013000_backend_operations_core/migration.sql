ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'DEAD_LETTERED';
ALTER TYPE "AuthEmailStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

ALTER TABLE "AuthEmailOutbox"
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "providerMessageId" TEXT,
  ADD COLUMN "dedupeKey" TEXT,
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN "claimToken" TEXT,
  ADD COLUMN "lastError" TEXT,
  ADD COLUMN "processedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "AuthEmailOutbox_workspaceId_dedupeKey_key" ON "AuthEmailOutbox"("workspaceId", "dedupeKey");
CREATE INDEX "AuthEmailOutbox_kind_status_nextAttemptAt_idx" ON "AuthEmailOutbox"("kind", "status", "nextAttemptAt");
CREATE INDEX "AuthEmailOutbox_workspaceId_status_nextAttemptAt_idx" ON "AuthEmailOutbox"("workspaceId", "status", "nextAttemptAt");

ALTER TABLE "JobRun"
  ADD COLUMN "queue" TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN "handler" TEXT NOT NULL DEFAULT 'generic',
  ADD COLUMN "dedupeKey" TEXT,
  ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN "claimToken" TEXT,
  ADD COLUMN "lastError" TEXT,
  ADD COLUMN "deadLetteredAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "JobRun_workspaceId_dedupeKey_key" ON "JobRun"("workspaceId", "dedupeKey");
CREATE INDEX "JobRun_queue_status_availableAt_idx" ON "JobRun"("queue", "status", "availableAt");
CREATE INDEX "JobRun_workspaceId_status_availableAt_idx" ON "JobRun"("workspaceId", "status", "availableAt");
