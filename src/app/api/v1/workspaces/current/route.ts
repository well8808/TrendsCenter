import type { NextRequest } from "next/server";

import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";
import { getCurrentWorkspace } from "@/lib/services/workspaces-service";

export async function GET(request: NextRequest) {
  return withRouteHandler(request, async (routeContext) => {
    const context = await requireApiTenantContext(request, "readWorkspace");
    const data = await getCurrentWorkspace(context);

    return ok(routeContext.requestId, data);
  });
}
