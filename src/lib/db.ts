import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

type PrismaGlobal = typeof globalThis & {
  prismaClient?: PrismaClient;
};

export function getPrisma() {
  const globalForPrisma = globalThis as PrismaGlobal;

  if (!globalForPrisma.prismaClient) {
    const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
    globalForPrisma.prismaClient = new PrismaClient({ adapter });
  }

  return globalForPrisma.prismaClient;
}
