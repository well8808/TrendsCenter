import { createLogger } from "@/lib/http/logger";
import { incrementMetric } from "@/lib/observability/metrics";

type ObservabilityGlobal = typeof globalThis & {
  __tmccObservabilityRegistered?: boolean;
};

export function registerObservability() {
  const globalForObservability = globalThis as ObservabilityGlobal;

  if (globalForObservability.__tmccObservabilityRegistered) {
    return;
  }

  globalForObservability.__tmccObservabilityRegistered = true;
  incrementMetric("runtime.boots_total", 1, { runtime: process.env.NEXT_RUNTIME ?? "nodejs" });
  createLogger({
    scope: "instrumentation",
  }).info("observability_registered", {
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    nodeEnv: process.env.NODE_ENV ?? "development",
  });
}

export async function reportRequestError(input: {
  error: Error;
  route?: string;
  method?: string;
  requestId?: string;
  context?: Record<string, unknown>;
}) {
  incrementMetric("http.server_errors_total", 1, {
    route: input.route ?? "unknown",
    method: input.method ?? "unknown",
  });

  createLogger({
    scope: "instrumentation.request_error",
    requestId: input.requestId,
    route: input.route,
    method: input.method,
  }).error("request_error_captured", {
    error: input.error.message,
    context: input.context,
  });
}
