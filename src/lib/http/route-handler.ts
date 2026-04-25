import type { NextRequest } from "next/server";

import { createLogger } from "@/lib/http/logger";
import { createRequestContext } from "@/lib/http/request-context";
import { fail } from "@/lib/http/responses";
import { incrementMetric } from "@/lib/observability/metrics";
import { runWithRequestContext } from "@/lib/observability/request-store";

export async function withRouteHandler(
  request: NextRequest,
  handler: (context: ReturnType<typeof createRequestContext>) => Promise<Response>,
) {
  const context = createRequestContext(request);
  const logger = createLogger({
    scope: "api.route",
    requestId: context.requestId,
    route: context.route,
    method: context.method,
  });

  return runWithRequestContext(context, async () => {
    incrementMetric("http.requests_total", 1, {
      route: context.route,
      method: context.method,
    });

    try {
      const response = await handler(context);
      const durationMs = Date.now() - context.startedAt;

      incrementMetric("http.responses_total", 1, {
        route: context.route,
        method: context.method,
        status: String(response.status),
      });
      incrementMetric("http.route_duration_ms_total", durationMs, {
        route: context.route,
        method: context.method,
      });
      logger.info("route_completed", {
        status: response.status,
        durationMs,
      });

      return response;
    } catch (error) {
      const durationMs = Date.now() - context.startedAt;
      const failedResponse = fail(context.requestId, error);

      incrementMetric("http.responses_total", 1, {
        route: context.route,
        method: context.method,
        status: String(failedResponse.status),
      });
      incrementMetric("http.route_errors_total", 1, {
        route: context.route,
        method: context.method,
      });
      incrementMetric("http.route_duration_ms_total", durationMs, {
        route: context.route,
        method: context.method,
      });
      logger.error("route_failed", {
        error: error instanceof Error ? error.message : "unknown_error",
        status: failedResponse.status,
        durationMs,
      });

      return failedResponse;
    }
  });
}
