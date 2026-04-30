import type { NextRequest } from "next/server";

import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";
import { getProviderReelsImportStatus } from "@/lib/services/reels-provider-import-service";

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withRouteHandler(request, async (routeContext) => {
    const context = await requireApiTenantContext(request, "operateSignals");
    const { id } = await params;
    const data = await getProviderReelsImportStatus(context, id);

    return ok(routeContext.requestId, data);
  });
}
