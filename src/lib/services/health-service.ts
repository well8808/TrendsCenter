import { getPrisma } from "@/lib/db";
import { getMetricsSnapshot } from "@/lib/observability/metrics";

export async function getHealthStatus() {
  const startedAt = Date.now();

  await getPrisma().$queryRaw`SELECT 1`;

  return {
    status: "ok",
    database: "ok",
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    observability: getMetricsSnapshot(),
  };
}
