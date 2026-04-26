import type { NextRequest } from "next/server";

import { notFound } from "@/lib/http/errors";
import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { requireApiTenantContext } from "@/lib/services/auth-context-service";
import { getTrendById } from "@/lib/services/trends-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withRouteHandler(request, async (routeContext) => {
    const context = await requireApiTenantContext(request, "readWorkspace");
    const { id } = await params;
    const data = await getTrendById(context, id);

    if (!data) {
      throw notFound("Trend não encontrada neste workspace.");
    }

    return ok(routeContext.requestId, data);
  });
}
