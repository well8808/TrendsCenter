import type { NextRequest } from "next/server";

import { badRequest } from "@/lib/http/errors";
import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { assertInternalRequest } from "@/lib/services/auth-context-service";
import { dispatchOperationalCron } from "@/lib/services/jobs-service";

async function dispatch(request: NextRequest) {
  return withRouteHandler(request, async (routeContext) => {
    assertInternalRequest(request);

    const input =
      request.method === "POST"
        ? await request.json().catch(() => {
            throw badRequest("JSON inválido no corpo da requisição.");
          })
        : {};
    const payload = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const limitFromQuery = request.nextUrl.searchParams.get("limit");
    const outboxFromQuery = request.nextUrl.searchParams.get("outboxLimit");
    const data = await dispatchOperationalCron({
      requestId: routeContext.requestId,
      limit: Number(limitFromQuery ?? payload.limit ?? "10") || 10,
      outboxLimit: Number(outboxFromQuery ?? payload.outboxLimit ?? "20") || 20,
    });

    return ok(routeContext.requestId, data);
  });
}

export async function GET(request: NextRequest) {
  return dispatch(request);
}

export async function POST(request: NextRequest) {
  return dispatch(request);
}
