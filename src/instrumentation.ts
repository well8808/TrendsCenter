import { registerObservability, reportRequestError } from "./lib/observability/runtime";

function readHeader(
  request: { headers?: Headers | { get(name: string): string | null } } | undefined,
  name: string,
) {
  const headers = request?.headers;

  if (!headers || typeof headers.get !== "function") {
    return undefined;
  }

  return headers.get(name) ?? undefined;
}

export async function register() {
  registerObservability();
}

export async function onRequestError(
  error: Error,
  request: { path?: string; method?: string; headers?: Headers | { get(name: string): string | null } },
  context: Record<string, unknown>,
) {
  await reportRequestError({
    error,
    route: request.path,
    method: request.method,
    requestId: readHeader(request, "x-request-id"),
    context,
  });
}
