import type { NextRequest } from "next/server";

import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";
import { listTrends } from "@/lib/services/trends-service";

export async function GET(request: NextRequest) {
  return withRouteHandler(request, async (routeContext) => {
    const context = await requireApiTenantContext(request, "readWorkspace");
    const data = await listTrends(context, request.nextUrl.searchParams);

    return ok(routeContext.requestId, data);
  });
}
