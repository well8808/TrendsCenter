import type { NextRequest } from "next/server";

import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";
import { listWorkspaceJobRuns } from "@/lib/services/jobs-service";

export async function GET(request: NextRequest) {
  return withRouteHandler(request, async (routeContext) => {
    const context = await requireApiTenantContext(request, "readWorkspace");
    const data = await listWorkspaceJobRuns(context, request.nextUrl.searchParams);

    return ok(routeContext.requestId, data);
  });
}
