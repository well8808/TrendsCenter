import type { NextRequest } from "next/server";

import { badRequest } from "@/lib/http/errors";
import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { assertInternalRequest } from "@/lib/services/auth-context-service";
import { processAuthOutbox } from "@/lib/services/outbox-service";

export async function POST(request: NextRequest) {
  return withRouteHandler(request, async (routeContext) => {
    assertInternalRequest(request);
    const body = await request.json().catch(() => ({}));
    const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const limit = Number(payload.limit ?? "20");

    if (Number.isNaN(limit) || limit <= 0) {
      throw badRequest("limit invalido.");
    }

    const data = await processAuthOutbox({
      requestId: routeContext.requestId,
      limit,
    });

    return ok(routeContext.requestId, data);
  });
}
