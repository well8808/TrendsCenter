import { randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const [{ PrismaClient }, { PrismaNeon }] = await Promise.all([
  import("@prisma/client"),
  import("@prisma/adapter-neon"),
]);

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada para smoke HTTP.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const root = process.cwd();
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const port = 3401;
const baseUrl = `http://127.0.0.1:${port}`;
const cronSecret = `smoke-${randomUUID()}-${randomUUID()}`;
const slug = `smoke-${randomUUID().slice(0, 8)}`;
let child;
let workspaceId;
let foreignWorkspaceId;
let userId;
let videoId;
let foreignVideoId;
let sourceId;
let cookieHeader;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function waitForServer(timeoutMs = 60000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);

      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Servidor local nao iniciou a tempo. Ultimo erro: ${String(lastError)}`);
}

async function startServer() {
  child = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_APP_URL: baseUrl,
      CRON_SECRET: cronSecret,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  await waitForServer();
}

async function stopServer() {
  if (!child || child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    }, 5000);

    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function createFixture() {
  const now = new Date();
  const user = await prisma.user.create({
    data: {
      email: `${slug}@example.com`,
      name: "Smoke HTTP",
      passwordHash: "smoke-http",
      status: "ACTIVE",
      emailVerifiedAt: now,
    },
  });
  userId = user.id;

  const workspace = await prisma.workspace.create({
    data: {
      slug: `${slug}-workspace`,
      name: `Smoke Workspace ${slug}`,
    },
  });
  workspaceId = workspace.id;

  const foreignWorkspace = await prisma.workspace.create({
    data: {
      slug: `${slug}-foreign`,
      name: `Smoke Foreign ${slug}`,
    },
  });
  foreignWorkspaceId = foreignWorkspace.id;

  await prisma.workspaceMember.create({
    data: {
      userId,
      workspaceId,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  const sessionToken = randomUUID();
  cookieHeader = `tmcc_session=${encodeURIComponent(sessionToken)}`;

  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(sessionToken),
      userId,
      workspaceId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userAgent: "smoke-http-script",
    },
  });

  const source = await prisma.source.create({
    data: {
      workspaceId,
      title: `Smoke Source ${slug}`,
      kind: "MANUAL_RESEARCH",
      origin: "MANUAL",
      market: "BR",
      confidence: "MEDIUM",
      dedupeKey: `smoke-source:${slug}`,
    },
  });
  sourceId = source.id;

  const creator = await prisma.creator.create({
    data: {
      workspaceId,
      sourceId,
      handle: `smoke_${slug}`,
      displayName: "Smoke Creator",
      market: "BR",
      origin: "MANUAL",
      dedupeKey: `smoke-creator:${slug}`,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });

  const sound = await prisma.sound.create({
    data: {
      workspaceId,
      sourceId,
      title: `Smoke Sound ${slug}`,
      market: "BR",
      origin: "MANUAL",
      dedupeKey: `smoke-sound:${slug}`,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });

  const hashtag = await prisma.hashtag.create({
    data: {
      workspaceId,
      sourceId,
      tag: `smoke${slug.replace(/-/g, "")}`,
      displayTag: `#smoke${slug.replace(/-/g, "")}`,
      market: "BR",
      origin: "MANUAL",
      dedupeKey: `smoke-hashtag:${slug}`,
      firstSeenAt: now,
      lastSeenAt: now,
    },
  });

  const video = await prisma.video.create({
    data: {
      workspaceId,
      sourceId,
      creatorId: creator.id,
      soundId: sound.id,
      title: `Smoke Trend ${slug}`,
      market: "BR",
      origin: "MANUAL",
      collectedAt: now,
      firstSeenAt: now,
      lastSeenAt: now,
      currentViewCount: BigInt(64000),
      currentLikeCount: BigInt(4100),
      currentCommentCount: BigInt(120),
      currentShareCount: BigInt(88),
      currentSaveCount: BigInt(44),
      growthViews: BigInt(12000),
      velocityScore: 63,
      accelerationScore: 57,
      recencyScore: 75,
      consistencyScore: 61,
      trendScore: 70,
      confidence: "HIGH",
      dedupeKey: `smoke-video:${slug}`,
    },
  });
  videoId = video.id;

  await prisma.videoHashtag.create({
    data: {
      videoId,
      hashtagId: hashtag.id,
    },
  });

  await prisma.trendSnapshot.create({
    data: {
      workspaceId,
      entityType: "VIDEO",
      videoId,
      sourceId,
      observedAt: now,
      viewCount: BigInt(64000),
      growthViews: BigInt(12000),
      velocityScore: 63,
      accelerationScore: 57,
      recencyScore: 75,
      consistencyScore: 61,
      trendScore: 70,
    },
  });

  await prisma.trendEvidence.create({
    data: {
      workspaceId,
      sourceId,
      videoId,
      title: "Smoke Evidence",
      origin: "MANUAL",
      confidence: "MEDIUM",
      capturedAt: now,
      dedupeKey: `smoke-evidence:${slug}`,
    },
  });

  const foreignSource = await prisma.source.create({
    data: {
      workspaceId: foreignWorkspaceId,
      title: `Foreign Smoke Source ${slug}`,
      kind: "MANUAL_RESEARCH",
      origin: "MANUAL",
      market: "US",
      confidence: "MEDIUM",
      dedupeKey: `foreign-smoke-source:${slug}`,
    },
  });

  const foreignVideo = await prisma.video.create({
    data: {
      workspaceId: foreignWorkspaceId,
      sourceId: foreignSource.id,
      title: `Foreign Smoke Trend ${slug}`,
      market: "US",
      origin: "MANUAL",
      collectedAt: now,
      firstSeenAt: now,
      lastSeenAt: now,
      currentViewCount: BigInt(22000),
      currentLikeCount: BigInt(900),
      currentCommentCount: BigInt(50),
      currentShareCount: BigInt(19),
      currentSaveCount: BigInt(8),
      growthViews: BigInt(5000),
      velocityScore: 42,
      accelerationScore: 38,
      recencyScore: 49,
      consistencyScore: 43,
      trendScore: 46,
      confidence: "MEDIUM",
      dedupeKey: `foreign-smoke-video:${slug}`,
    },
  });
  foreignVideoId = foreignVideo.id;
}

async function cleanupFixture() {
  if (workspaceId || foreignWorkspaceId) {
    await prisma.workspace.deleteMany({
      where: {
        id: { in: [workspaceId, foreignWorkspaceId].filter(Boolean) },
      },
    });
  }

  if (userId) {
    await prisma.user.deleteMany({
      where: { id: userId },
    });
  }
}

async function expectJson(response) {
  return await response.json();
}

async function main() {
  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
    throw new Error("Build local ausente. Rode npm run build antes de executar o smoke HTTP.");
  }

  await createFixture();
  await startServer();

  const health = await fetch(`${baseUrl}/api/health`, {
    headers: { "x-request-id": "smoke-health-001" },
  });
  const unauthorized = await fetch(`${baseUrl}/api/v1/workspaces/current`);
  const workspace = await fetch(`${baseUrl}/api/v1/workspaces/current`, {
    headers: { Cookie: cookieHeader },
  });
  const trends = await fetch(`${baseUrl}/api/v1/trends`, {
    headers: { Cookie: cookieHeader },
  });
  const trendDetail = await fetch(`${baseUrl}/api/v1/trends/${videoId}`, {
    headers: { Cookie: cookieHeader },
  });
  const foreignDetail = await fetch(`${baseUrl}/api/v1/trends/${foreignVideoId}`, {
    headers: { Cookie: cookieHeader },
  });

  const ingestPayload = {
    type: "SIGNAL_CREATE",
    signalTitle: `Smoke signal ${slug}`,
    summary: "Smoke-created signal",
    signalType: "FORMAT",
    market: "BR",
    audience: "adult audience",
    sourceTitle: "Smoke source",
    sourceKind: "MANUAL_RESEARCH",
    sourceOrigin: "MANUAL",
    evidenceTitle: "Smoke evidence",
    evidenceNote: "Smoke note",
  };
  const ingestion = await fetch(`${baseUrl}/api/v1/ingestion/requests`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingestPayload),
  });
  const ingestionRepeat = await fetch(`${baseUrl}/api/v1/ingestion/requests`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingestPayload),
  });
  const jobs = await fetch(`${baseUrl}/api/v1/jobs/runs`, {
    headers: { Cookie: cookieHeader },
  });
  const cronGet = await fetch(`${baseUrl}/api/internal/cron/dispatch?limit=10`, {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  await prisma.authEmailOutbox.create({
    data: {
      kind: "EMAIL_VERIFICATION",
      toEmail: `${slug}+email@example.com`,
      subject: "Verify",
      body: "Verify now",
      workspaceId,
      userId,
      dedupeKey: `smoke-outbox:${slug}`,
      nextAttemptAt: new Date(Date.now() - 1000),
    },
  });

  const outbox = await fetch(`${baseUrl}/api/internal/outbox/process`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 10 }),
  });

  const summary = {
    health: { status: health.status, body: await expectJson(health) },
    unauthorized: { status: unauthorized.status, body: await expectJson(unauthorized) },
    workspace: { status: workspace.status, body: await expectJson(workspace) },
    trends: { status: trends.status, body: await expectJson(trends) },
    trendDetail: { status: trendDetail.status, body: await expectJson(trendDetail) },
    foreignDetail: { status: foreignDetail.status, body: await expectJson(foreignDetail) },
    ingestion: { status: ingestion.status, body: await expectJson(ingestion) },
    ingestionRepeat: { status: ingestionRepeat.status, body: await expectJson(ingestionRepeat) },
    jobs: { status: jobs.status, body: await expectJson(jobs) },
    cronGet: { status: cronGet.status, body: await expectJson(cronGet) },
    outbox: { status: outbox.status, body: await expectJson(outbox) },
  };

  console.log(JSON.stringify(summary, null, 2));
}

try {
  await main();
} finally {
  await stopServer().catch(() => {});
  await cleanupFixture().catch(() => {});
  await prisma.$disconnect();
}
