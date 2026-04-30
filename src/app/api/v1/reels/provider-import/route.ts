import type { NextRequest } from "next/server";

import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";
import { startProviderReelsImport } from "@/lib/services/reels-provider-import-service";
import { badRequest } from "@/lib/http/errors";

export const maxDuration = 20;

export async function POST(request: NextRequest) {
  return withRouteHandler(request, async (routeContext) => {
    const context = await requireApiTenantContext(request, "operateSignals");
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw badRequest("JSON invalido no corpo da requisicao.");
    }

    const data = await startProviderReelsImport(context, body);

    return ok(routeContext.requestId, data, 202);
  });
}
