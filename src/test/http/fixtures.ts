import { randomUUID } from "node:crypto";

import { getPrisma } from "@/lib/db";
import { sessionCookieName } from "@/lib/auth/constants";
import { hashToken } from "@/lib/auth/tokens";

export interface HttpTestFixture {
  slug: string;
  userId: string;
  workspaceId: string;
  foreignWorkspaceId: string;
  sessionToken: string;
  cookieHeader: string;
  primaryVideoId: string;
  foreignVideoId: string;
  sourceId: string;
}

export async function createHttpTestFixture(): Promise<HttpTestFixture> {
  const prisma = getPrisma();
  const slug = `http-it-${randomUUID().slice(0, 8)}`;
  const now = new Date();
  const user = await prisma.user.create({
    data: {
      email: `${slug}@example.com`,
      name: "HTTP Integration",
      passwordHash: "integration-test",
      status: "ACTIVE",
      emailVerifiedAt: now,
    },
  });
  const workspace = await prisma.workspace.create({
    data: {
      slug: `${slug}-workspace`,
      name: `HTTP Workspace ${slug}`,
    },
  });
  const foreignWorkspace = await prisma.workspace.create({
    data: {
      slug: `${slug}-foreign`,
      name: `Foreign Workspace ${slug}`,
    },
  });

  await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  const sessionToken = randomUUID();
  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(sessionToken),
      userId: user.id,
      workspaceId: workspace.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userAgent: "vitest-http-integration",
    },
  });

  const source = await prisma.source.create({
    data: {
      workspaceId: workspace.id,
      title: `HTTP Source ${slug}`,
      kind: "MANUAL_RESEARCH",
      origin: "MANUAL",
      market: "BR",
      confidence: "MEDIUM",
      dedupeKey: `source:${slug}`,
      notes: "Fixture HTTP integration",
    },
  });
  const foreignSource = await prisma.source.create({
    data: {
      workspaceId: foreignWorkspace.id,
      title: `Foreign Source ${slug}`,
      kind: "MANUAL_RESEARCH",
      origin: "MANUAL",
      market: "US",
      confidence: "MEDIUM",
      dedupeKey: `source:foreign:${slug}`,
      notes: "Foreign fixture HTTP integration",
    },
  });
  const creator = await prisma.creator.create({
    data: {
      workspaceId: workspace.id,
      sourceId: source.id,
      handle: `creator_${slug}`,
      displayName: "Creator Fixture",
      market: "BR",
      origin: "MANUAL",
      followerCount: BigInt(98_000),
      averageViews: BigInt(34_000),
      currentScore: 73,
      dedupeKey: `creator:${slug}`,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });
  const sound = await prisma.sound.create({
    data: {
      workspaceId: workspace.id,
      sourceId: source.id,
      title: `Sound ${slug}`,
      authorName: "Fixture DJ",
      market: "BR",
      origin: "MANUAL",
      isCommerciallyUsable: true,
      currentScore: 71,
      dedupeKey: `sound:${slug}`,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });
  const hashtag = await prisma.hashtag.create({
    data: {
      workspaceId: workspace.id,
      sourceId: source.id,
      tag: `trend${slug.replace(/-/g, "")}`,
      displayTag: `#trend${slug.replace(/-/g, "")}`,
      market: "BR",
      origin: "MANUAL",
      currentScore: 69,
      dedupeKey: `hashtag:${slug}`,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });
  const video = await prisma.video.create({
    data: {
      workspaceId: workspace.id,
      sourceId: source.id,
      creatorId: creator.id,
      soundId: sound.id,
      platformVideoId: `vid-${slug}`,
      url: `https://example.com/${slug}`,
      title: `Trend Fixture ${slug}`,
      caption: "Trend fixture caption",
      market: "BR",
      origin: "MANUAL",
      postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      collectedAt: now,
      firstSeenAt: now,
      lastSeenAt: now,
      currentViewCount: BigInt(120_000),
      currentLikeCount: BigInt(11_200),
      currentCommentCount: BigInt(540),
      currentShareCount: BigInt(280),
      currentSaveCount: BigInt(190),
      growthViews: BigInt(52_000),
      velocityScore: 74,
      accelerationScore: 68,
      recencyScore: 82,
      consistencyScore: 66,
      trendScore: 77,
      confidence: "HIGH",
      dedupeKey: `video:${slug}`,
    },
  });
  const foreignVideo = await prisma.video.create({
    data: {
      workspaceId: foreignWorkspace.id,
      sourceId: foreignSource.id,
      platformVideoId: `foreign-${slug}`,
      title: `Foreign Trend ${slug}`,
      market: "US",
      origin: "MANUAL",
      collectedAt: now,
      firstSeenAt: now,
      lastSeenAt: now,
      currentViewCount: BigInt(80_000),
      currentLikeCount: BigInt(3_100),
      currentCommentCount: BigInt(150),
      currentShareCount: BigInt(91),
      currentSaveCount: BigInt(40),
      growthViews: BigInt(10_000),
      velocityScore: 55,
      accelerationScore: 44,
      recencyScore: 60,
      consistencyScore: 53,
      trendScore: 58,
      confidence: "MEDIUM",
      dedupeKey: `foreign-video:${slug}`,
    },
  });

  await prisma.videoHashtag.create({
    data: {
      videoId: video.id,
      hashtagId: hashtag.id,
    },
  });
  await prisma.trendSnapshot.create({
    data: {
      workspaceId: workspace.id,
      entityType: "VIDEO",
      videoId: video.id,
      sourceId: source.id,
      observedAt: now,
      viewCount: BigInt(120_000),
      likeCount: BigInt(11_200),
      commentCount: BigInt(540),
      shareCount: BigInt(280),
      saveCount: BigInt(190),
      growthViews: BigInt(52_000),
      velocityScore: 74,
      accelerationScore: 68,
      recencyScore: 82,
      consistencyScore: 66,
      trendScore: 77,
    },
  });
  await prisma.trendEvidence.create({
    data: {
      workspaceId: workspace.id,
      sourceId: source.id,
      videoId: video.id,
      creatorId: creator.id,
      soundId: sound.id,
      title: `Evidence ${slug}`,
      url: `https://example.com/evidence/${slug}`,
      note: "Evidence fixture",
      origin: "MANUAL",
      confidence: "MEDIUM",
      capturedAt: now,
      dedupeKey: `evidence:${slug}`,
    },
  });

  return {
    slug,
    userId: user.id,
    workspaceId: workspace.id,
    foreignWorkspaceId: foreignWorkspace.id,
    sessionToken,
    cookieHeader: `${sessionCookieName}=${encodeURIComponent(sessionToken)}`,
    primaryVideoId: video.id,
    foreignVideoId: foreignVideo.id,
    sourceId: source.id,
  };
}

export async function destroyHttpTestFixture(fixture: HttpTestFixture) {
  const prisma = getPrisma();

  await prisma.workspace.deleteMany({
    where: {
      id: { in: [fixture.workspaceId, fixture.foreignWorkspaceId] },
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: fixture.userId,
    },
  });
}
