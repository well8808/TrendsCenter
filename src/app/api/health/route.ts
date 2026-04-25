import type { NextRequest } from "next/server";

import { withRouteHandler } from "@/lib/http/route-handler";
import { ok } from "@/lib/http/responses";
import { getHealthStatus } from "@/lib/services/health-service";

export async function GET(request: NextRequest) {
  return withRouteHandler(request, async (context) => {
    const data = await getHealthStatus();

    return ok(context.requestId, data);
  });
}
