import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

export interface RequestContext {
  requestId: string;
  startedAt: number;
  route: string;
  method: string;
}

export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: request.headers.get("x-request-id") ?? randomUUID(),
    startedAt: Date.now(),
    route: request.nextUrl.pathname,
    method: request.method,
  };
}
