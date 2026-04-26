import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

type PrismaGlobal = typeof globalThis & {
  prismaClient?: PrismaClient;
};

function databaseUrl() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;

  if (!url) {
    throw new Error("DATABASE_URL não configurada. Conecte um Postgres gerenciado antes de iniciar o app.");
  }

  return url;
}

export function getPrisma() {
  const globalForPrisma = globalThis as PrismaGlobal;

  if (!globalForPrisma.prismaClient) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl() });
    globalForPrisma.prismaClient = new PrismaClient({ adapter });
  }

  return globalForPrisma.prismaClient;
}
