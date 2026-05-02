-- CreateEnum
CREATE TYPE "ContentDraftStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "opportunityDecisionId" TEXT,
    "title" TEXT NOT NULL,
    "centralIdea" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "scriptDraft" TEXT NOT NULL,
    "captionDraft" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "structureText" TEXT NOT NULL,
    "riskNotes" TEXT NOT NULL,
    "evidenceJson" JSONB,
    "status" "ContentDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "channel" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'OPPORTUNITY_BRIEF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentDraft_workspaceId_userId_videoId_key" ON "ContentDraft"("workspaceId", "userId", "videoId");

-- CreateIndex
CREATE INDEX "ContentDraft_workspaceId_userId_status_updatedAt_idx" ON "ContentDraft"("workspaceId", "userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ContentDraft_workspaceId_status_updatedAt_idx" ON "ContentDraft"("workspaceId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ContentDraft_workspaceId_videoId_idx" ON "ContentDraft"("workspaceId", "videoId");

-- CreateIndex
CREATE INDEX "ContentDraft_workspaceId_opportunityDecisionId_idx" ON "ContentDraft"("workspaceId", "opportunityDecisionId");

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_opportunityDecisionId_fkey" FOREIGN KEY ("opportunityDecisionId") REFERENCES "OpportunityDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
