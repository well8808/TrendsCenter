import { NextResponse } from "next/server";

import type { ApiErrorResponse, ApiResponseMeta, ApiSuccessResponse } from "@/lib/http/contracts";
import { toAppError } from "@/lib/http/errors";

function meta(requestId: string): ApiResponseMeta {
  return {
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export function ok<T>(requestId: string, data: T, status = 200) {
  const body: ApiSuccessResponse<T> = {
    ok: true,
    data,
    meta: meta(requestId),
  };

  return NextResponse.json(body, {
    status,
    headers: { "x-request-id": requestId },
  });
}

export function fail(requestId: string, error: unknown) {
  const appError = toAppError(error);
  const body: ApiErrorResponse = {
    ok: false,
    error: {
      code: appError.code,
      message: appError.message,
      status: appError.status,
      requestId,
      details: appError.details,
    },
    meta: meta(requestId),
  };

  return NextResponse.json(body, {
    status: appError.status,
    headers: { "x-request-id": requestId },
  });
}
