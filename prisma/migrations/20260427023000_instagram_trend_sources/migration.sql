ALTER TYPE "SourceKind" ADD VALUE IF NOT EXISTS 'INSTAGRAM_REELS_TRENDS';
ALTER TYPE "SourceKind" ADD VALUE IF NOT EXISTS 'INSTAGRAM_GRAPH_API';
ALTER TYPE "SourceKind" ADD VALUE IF NOT EXISTS 'INSTAGRAM_PROFESSIONAL_DASHBOARD';
ALTER TYPE "SourceKind" ADD VALUE IF NOT EXISTS 'META_AD_LIBRARY';
ALTER TYPE "SourceKind" ADD VALUE IF NOT EXISTS 'META_BUSINESS_SUITE';
ALTER TYPE "SourceKind" ADD VALUE IF NOT EXISTS 'META_CREATOR_MARKETPLACE';

-- CreateEnum
CREATE TYPE "TrendSourcePlatform" AS ENUM ('INSTAGRAM');

-- CreateEnum
CREATE TYPE "TrendSourceType" AS ENUM ('HASHTAG', 'AUDIO', 'CREATOR', 'REEL', 'ACCOUNT_INSIGHTS', 'META_AD_LIBRARY', 'MANUAL');

-- CreateEnum
CREATE TYPE "TrendSourceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateTable
CREATE TABLE "TrendSource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platform" "TrendSourcePlatform" NOT NULL DEFAULT 'INSTAGRAM',
    "title" TEXT NOT NULL,
    "sourceType" "TrendSourceType" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'global',
    "category" TEXT NOT NULL DEFAULT 'reels',
    "status" "TrendSourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrendSource_workspaceId_platform_sourceType_sourceUrl_key" ON "TrendSource"("workspaceId", "platform", "sourceType", "sourceUrl");

-- CreateIndex
CREATE INDEX "TrendSource_workspaceId_platform_status_idx" ON "TrendSource"("workspaceId", "platform", "status");

-- CreateIndex
CREATE INDEX "TrendSource_workspaceId_category_status_idx" ON "TrendSource"("workspaceId", "category", "status");

-- AddForeignKey
ALTER TABLE "TrendSource" ADD CONSTRAINT "TrendSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
