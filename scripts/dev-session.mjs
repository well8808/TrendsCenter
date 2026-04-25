/**
 * Dev-only helper — cria uma sessao valida no DB e imprime o cookie/ids.
 * NAO e redesign: ferramenta de validacao HTTP pra gerar o cabecalho Cookie.
 *
 * Uso:
 *   node scripts/dev-session.mjs
 *
 * Saida:
 *   COOKIE=tmcc_session=<token>
 *   WORKSPACE=<id>
 *   USER=<id>
 *   FOREIGN_WORKSPACE=<id>  (segundo workspace para testar isolamento 404)
 */
import { randomUUID, createHash } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const [{ PrismaClient }, { PrismaNeon }] = await Promise.all([
  import("@prisma/client"),
  import("@prisma/adapter-neon"),
]);

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada.");
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

const slug = `devsess-${randomUUID().slice(0, 8)}`;
const now = new Date();

try {
  const user = await prisma.user.create({
    data: {
      email: `${slug}@dev.local`,
      name: "dev-session",
      passwordHash: "dev-session-no-login",
      status: "ACTIVE",
      emailVerifiedAt: now,
    },
  });

  const workspace = await prisma.workspace.create({
    data: { slug: `${slug}-workspace`, name: `Dev Session ${slug}` },
  });

  const foreignWorkspace = await prisma.workspace.create({
    data: { slug: `${slug}-foreign`, name: `Dev Foreign ${slug}` },
  });

  await prisma.workspaceMember.create({
    data: { userId: user.id, workspaceId: workspace.id, role: "OWNER", status: "ACTIVE" },
  });

  // Seed minimo pra /trends ter dado real: 1 source + 1 video no workspace principal
  const source = await prisma.source.create({
    data: {
      workspaceId: workspace.id,
      title: `Dev Source ${slug}`,
      kind: "MANUAL_RESEARCH",
      origin: "MANUAL",
      market: "BR",
      confidence: "MEDIUM",
      dedupeKey: `dev-source:${slug}`,
    },
  });

  const video = await prisma.video.create({
    data: {
      workspaceId: workspace.id,
      sourceId: source.id,
      title: `Dev Trend ${slug}`,
      market: "BR",
      origin: "MANUAL",
      collectedAt: now,
      firstSeenAt: now,
      lastSeenAt: now,
      currentViewCount: BigInt(12000),
      growthViews: BigInt(3000),
      velocityScore: 60,
      accelerationScore: 55,
      recencyScore: 72,
      consistencyScore: 58,
      trendScore: 66,
      confidence: "HIGH",
      dedupeKey: `dev-video:${slug}`,
    },
  });

  // Video em workspace diferente (pra testar 404 de outro tenant)
  const foreignSource = await prisma.source.create({
    data: {
      workspaceId: foreignWorkspace.id,
      title: `Foreign Dev Source ${slug}`,
      kind: "MANUAL_RESEARCH",
      origin: "MANUAL",
      market: "BR",
      confidence: "MEDIUM",
      dedupeKey: `dev-foreign-source:${slug}`,
    },
  });
  const foreignVideo = await prisma.video.create({
    data: {
      workspaceId: foreignWorkspace.id,
      sourceId: foreignSource.id,
      title: `Foreign Trend ${slug}`,
      market: "BR",
      origin: "MANUAL",
      collectedAt: now,
      firstSeenAt: now,
      lastSeenAt: now,
      currentViewCount: BigInt(1),
      velocityScore: 1,
      accelerationScore: 1,
      recencyScore: 1,
      consistencyScore: 1,
      trendScore: 1,
      confidence: "LOW",
      dedupeKey: `dev-foreign-video:${slug}`,
    },
  });

  const sessionToken = randomUUID() + randomUUID();
  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(sessionToken),
      userId: user.id,
      workspaceId: workspace.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      userAgent: "dev-session-script",
    },
  });

  console.log(`COOKIE=tmcc_session=${encodeURIComponent(sessionToken)}`);
  console.log(`WORKSPACE=${workspace.id}`);
  console.log(`USER=${user.id}`);
  console.log(`FOREIGN_WORKSPACE=${foreignWorkspace.id}`);
  console.log(`OWNED_VIDEO=${video.id}`);
  console.log(`FOREIGN_VIDEO=${foreignVideo.id}`);
} finally {
  await prisma.$disconnect();
}
