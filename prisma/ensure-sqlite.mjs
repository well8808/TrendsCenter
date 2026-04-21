import fs from "node:fs";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

if (!databaseUrl.startsWith("file:") || databaseUrl === "file::memory:") {
  process.exit(0);
}

const rawPath = databaseUrl.replace(/^file:/, "").split("?")[0];
const databasePath = path.resolve(process.cwd(), rawPath);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

if (!fs.existsSync(databasePath)) {
  fs.writeFileSync(databasePath, "");
  console.log(`Created SQLite database file at ${path.relative(process.cwd(), databasePath)}`);
}
