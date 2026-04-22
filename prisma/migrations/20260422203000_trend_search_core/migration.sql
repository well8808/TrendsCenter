CREATE TYPE "TrendEntityType" AS ENUM ('VIDEO', 'CREATOR', 'SOUND', 'HASHTAG');

CREATE TABLE "Creator" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sourceId" TEXT,
  "handle" TEXT NOT NULL,
  "displayName" TEXT,
  "profileUrl" TEXT,
  "market" "Market" NOT NULL,
  "origin" "DataOrigin" NOT NULL,
  "followerCount" BIGINT,
  "averageViews" BIGINT,
  "currentScore" INTEGER NOT NULL DEFAULT 0,
  "dedupeKey" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sound" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sourceId" TEXT,
  "title" TEXT NOT NULL,
  "authorName" TEXT,
  "soundUrl" TEXT,
  "market" "Market" NOT NULL,
  "origin" "DataOrigin" NOT NULL,
  "isCommerciallyUsable" BOOLEAN,
  "commercialRightsStatus" TEXT,
  "videoCount" INTEGER,
  "currentScore" INTEGER NOT NULL DEFAULT 0,
  "dedupeKey" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Sound_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Hashtag" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sourceId" TEXT,
  "tag" TEXT NOT NULL,
  "displayTag" TEXT NOT NULL,
  "market" "Market" NOT NULL,
  "origin" "DataOrigin" NOT NULL,
  "postCount" BIGINT,
  "viewCount" BIGINT,
  "currentScore" INTEGER NOT NULL DEFAULT 0,
  "dedupeKey" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Video" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "creatorId" TEXT,
  "soundId" TEXT,
  "importBatchId" TEXT,
  "jobRunId" TEXT,
  "platformVideoId" TEXT,
  "url" TEXT,
  "title" TEXT NOT NULL,
  "caption" TEXT,
  "market" "Market" NOT NULL,
  "origin" "DataOrigin" NOT NULL,
  "postedAt" TIMESTAMP(3),
  "collectedAt" TIMESTAMP(3) NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentViewCount" BIGINT NOT NULL DEFAULT 0,
  "currentLikeCount" BIGINT NOT NULL DEFAULT 0,
  "currentCommentCount" BIGINT NOT NULL DEFAULT 0,
  "currentShareCount" BIGINT NOT NULL DEFAULT 0,
  "currentSaveCount" BIGINT NOT NULL DEFAULT 0,
  "growthViews" BIGINT NOT NULL DEFAULT 0,
  "velocityScore" INTEGER NOT NULL DEFAULT 0,
  "accelerationScore" INTEGER NOT NULL DEFAULT 0,
  "recencyScore" INTEGER NOT NULL DEFAULT 0,
  "consistencyScore" INTEGER NOT NULL DEFAULT 0,
  "trendScore" INTEGER NOT NULL DEFAULT 0,
  "scoreVersion" TEXT NOT NULL DEFAULT 'video-score-v0.1',
  "confidence" "ConfidenceBand" NOT NULL DEFAULT 'LOW',
  "dedupeKey" TEXT NOT NULL,
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VideoHashtag" (
  "videoId" TEXT NOT NULL,
  "hashtagId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VideoHashtag_pkey" PRIMARY KEY ("videoId", "hashtagId")
);

CREATE TABLE "TrendSnapshot" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "entityType" "TrendEntityType" NOT NULL,
  "videoId" TEXT,
  "creatorId" TEXT,
  "soundId" TEXT,
  "hashtagId" TEXT,
  "sourceId" TEXT,
  "importBatchId" TEXT,
  "jobRunId" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "viewCount" BIGINT,
  "likeCount" BIGINT,
  "commentCount" BIGINT,
  "shareCount" BIGINT,
  "saveCount" BIGINT,
  "followerCount" BIGINT,
  "videoCount" INTEGER,
  "postCount" BIGINT,
  "rawMetrics" JSONB,
  "growthViews" BIGINT NOT NULL DEFAULT 0,
  "velocityScore" INTEGER NOT NULL DEFAULT 0,
  "accelerationScore" INTEGER NOT NULL DEFAULT 0,
  "recencyScore" INTEGER NOT NULL DEFAULT 0,
  "consistencyScore" INTEGER NOT NULL DEFAULT 0,
  "trendScore" INTEGER NOT NULL DEFAULT 0,
  "scoreVersion" TEXT NOT NULL DEFAULT 'video-score-v0.1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrendSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrendEvidence" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "importBatchId" TEXT,
  "jobRunId" TEXT,
  "snapshotId" TEXT,
  "videoId" TEXT,
  "creatorId" TEXT,
  "soundId" TEXT,
  "hashtagId" TEXT,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "excerpt" TEXT,
  "note" TEXT,
  "origin" "DataOrigin" NOT NULL,
  "confidence" "ConfidenceBand" NOT NULL DEFAULT 'LOW',
  "capturedAt" TIMESTAMP(3) NOT NULL,
  "dedupeKey" TEXT,
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrendEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchQueryLog" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT,
  "query" TEXT NOT NULL,
  "market" "Market",
  "entityType" "TrendEntityType",
  "sort" TEXT NOT NULL,
  "filters" JSONB,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SearchQueryLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Creator_workspaceId_dedupeKey_key" ON "Creator"("workspaceId", "dedupeKey");
CREATE INDEX "Creator_workspaceId_market_currentScore_idx" ON "Creator"("workspaceId", "market", "currentScore");
CREATE INDEX "Creator_workspaceId_handle_idx" ON "Creator"("workspaceId", "handle");

CREATE UNIQUE INDEX "Sound_workspaceId_dedupeKey_key" ON "Sound"("workspaceId", "dedupeKey");
CREATE INDEX "Sound_workspaceId_market_currentScore_idx" ON "Sound"("workspaceId", "market", "currentScore");
CREATE INDEX "Sound_workspaceId_title_idx" ON "Sound"("workspaceId", "title");

CREATE UNIQUE INDEX "Hashtag_workspaceId_dedupeKey_key" ON "Hashtag"("workspaceId", "dedupeKey");
CREATE INDEX "Hashtag_workspaceId_market_currentScore_idx" ON "Hashtag"("workspaceId", "market", "currentScore");
CREATE INDEX "Hashtag_workspaceId_tag_idx" ON "Hashtag"("workspaceId", "tag");

CREATE UNIQUE INDEX "Video_workspaceId_dedupeKey_key" ON "Video"("workspaceId", "dedupeKey");
CREATE INDEX "Video_workspaceId_market_trendScore_idx" ON "Video"("workspaceId", "market", "trendScore");
CREATE INDEX "Video_workspaceId_collectedAt_idx" ON "Video"("workspaceId", "collectedAt");
CREATE INDEX "Video_workspaceId_sourceId_idx" ON "Video"("workspaceId", "sourceId");
CREATE INDEX "Video_workspaceId_creatorId_idx" ON "Video"("workspaceId", "creatorId");
CREATE INDEX "Video_workspaceId_soundId_idx" ON "Video"("workspaceId", "soundId");

CREATE INDEX "VideoHashtag_hashtagId_idx" ON "VideoHashtag"("hashtagId");

CREATE INDEX "TrendSnapshot_workspaceId_entityType_observedAt_idx" ON "TrendSnapshot"("workspaceId", "entityType", "observedAt");
CREATE INDEX "TrendSnapshot_workspaceId_videoId_observedAt_idx" ON "TrendSnapshot"("workspaceId", "videoId", "observedAt");
CREATE INDEX "TrendSnapshot_workspaceId_trendScore_idx" ON "TrendSnapshot"("workspaceId", "trendScore");

CREATE UNIQUE INDEX "TrendEvidence_workspaceId_dedupeKey_key" ON "TrendEvidence"("workspaceId", "dedupeKey");
CREATE INDEX "TrendEvidence_workspaceId_capturedAt_idx" ON "TrendEvidence"("workspaceId", "capturedAt");
CREATE INDEX "TrendEvidence_workspaceId_videoId_capturedAt_idx" ON "TrendEvidence"("workspaceId", "videoId", "capturedAt");
CREATE INDEX "TrendEvidence_workspaceId_sourceId_capturedAt_idx" ON "TrendEvidence"("workspaceId", "sourceId", "capturedAt");

CREATE INDEX "SearchQueryLog_workspaceId_createdAt_idx" ON "SearchQueryLog"("workspaceId", "createdAt");
CREATE INDEX "SearchQueryLog_workspaceId_query_idx" ON "SearchQueryLog"("workspaceId", "query");

ALTER TABLE "Creator" ADD CONSTRAINT "Creator_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Creator" ADD CONSTRAINT "Creator_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Sound" ADD CONSTRAINT "Sound_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sound" ADD CONSTRAINT "Sound_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Hashtag" ADD CONSTRAINT "Hashtag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Hashtag" ADD CONSTRAINT "Hashtag_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Video" ADD CONSTRAINT "Video_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Video" ADD CONSTRAINT "Video_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Video" ADD CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Video" ADD CONSTRAINT "Video_soundId_fkey" FOREIGN KEY ("soundId") REFERENCES "Sound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Video" ADD CONSTRAINT "Video_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Video" ADD CONSTRAINT "Video_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VideoHashtag" ADD CONSTRAINT "VideoHashtag_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VideoHashtag" ADD CONSTRAINT "VideoHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrendSnapshot" ADD CONSTRAINT "TrendSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendSnapshot" ADD CONSTRAINT "TrendSnapshot_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendSnapshot" ADD CONSTRAINT "TrendSnapshot_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendSnapshot" ADD CONSTRAINT "TrendSnapshot_soundId_fkey" FOREIGN KEY ("soundId") REFERENCES "Sound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendSnapshot" ADD CONSTRAINT "TrendSnapshot_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendSnapshot" ADD CONSTRAINT "TrendSnapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrendSnapshot" ADD CONSTRAINT "TrendSnapshot_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrendSnapshot" ADD CONSTRAINT "TrendSnapshot_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TrendSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_soundId_fkey" FOREIGN KEY ("soundId") REFERENCES "Sound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendEvidence" ADD CONSTRAINT "TrendEvidence_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SearchQueryLog" ADD CONSTRAINT "SearchQueryLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchQueryLog" ADD CONSTRAINT "SearchQueryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
