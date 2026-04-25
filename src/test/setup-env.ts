import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

process.env.DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;
