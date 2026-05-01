import type { NextRequest } from "next/server";

import { badRequest } from "@/lib/http/errors";
import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";
import { buildReelsSearchAssistantPlan } from "@/lib/services/reels-search-assistant-service";

export async function POST(request: NextRequest) {
  return withRouteHandler(request, async (routeContext) => {
    const context = await requireApiTenantContext(request, "readWorkspace");
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw badRequest("JSON invalido no corpo da requisicao.");
    }

    const data = await buildReelsSearchAssistantPlan(context, body);

    return ok(routeContext.requestId, data);
  });
}
