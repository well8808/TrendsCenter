-- CreateEnum
CREATE TYPE "OpportunityDecisionAction" AS ENUM ('SAVE_FOR_BRIEF', 'OBSERVE_TREND', 'DISMISS', 'MARK_USED', 'CREATE_CONTENT_IDEA');

-- CreateTable
CREATE TABLE "OpportunityDecision" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "signalId" TEXT,
    "action" "OpportunityDecisionAction" NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityDecision_workspaceId_userId_videoId_key" ON "OpportunityDecision"("workspaceId", "userId", "videoId");

-- CreateIndex
CREATE INDEX "OpportunityDecision_workspaceId_action_updatedAt_idx" ON "OpportunityDecision"("workspaceId", "action", "updatedAt");

-- CreateIndex
CREATE INDEX "OpportunityDecision_workspaceId_userId_action_updatedAt_idx" ON "OpportunityDecision"("workspaceId", "userId", "action", "updatedAt");

-- CreateIndex
CREATE INDEX "OpportunityDecision_workspaceId_signalId_idx" ON "OpportunityDecision"("workspaceId", "signalId");

-- AddForeignKey
ALTER TABLE "OpportunityDecision" ADD CONSTRAINT "OpportunityDecision_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityDecision" ADD CONSTRAINT "OpportunityDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityDecision" ADD CONSTRAINT "OpportunityDecision_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityDecision" ADD CONSTRAINT "OpportunityDecision_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
