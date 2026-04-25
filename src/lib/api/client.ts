import type {
  ApiErrorBody,
  ApiErrorResponse,
  ApiResponseEnvelope,
  ApiResponseMeta,
  ApiSuccessResponse,
} from "@/lib/http/contracts";

/**
 * Erro tipado de API. Sempre carrega requestId para correlação com logs backend.
 * Use `ApiError.is(err)` em lugar de `instanceof` para sobreviver a bundling.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;
  readonly details?: unknown;
  readonly meta?: ApiResponseMeta;

  constructor(body: ApiErrorBody, meta?: ApiResponseMeta) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.status = body.status;
    this.requestId = body.requestId;
    this.details = body.details;
    this.meta = meta;
  }

  static is(error: unknown): error is ApiError {
    return (
      typeof error === "object" &&
      error !== null &&
      (error as { name?: string }).name === "ApiError" &&
      typeof (error as { requestId?: unknown }).requestId === "string"
    );
  }

  get isUnauthorized() {
    return this.status === 401 || this.code === "UNAUTHORIZED";
  }
  get isForbidden() {
    return this.status === 403 || this.code === "FORBIDDEN";
  }
  get isNotFound() {
    return this.status === 404 || this.code === "NOT_FOUND";
  }
  get isServerError() {
    return this.status >= 500;
  }
}

/**
 * Erro de rede / parse. Não tem requestId (backend nunca respondeu).
 */
export class ApiTransportError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ApiTransportError";
    this.cause = cause;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Cabeçalhos adicionais. Content-Type é setado automaticamente para JSON. */
  headers?: Record<string, string>;
  /** Next.js fetch cache/revalidate options (válido só em Server Components). */
  next?: { revalidate?: number | false; tags?: string[] };
  /** Por padrão Next.js caches GET. "no-store" força bypass. */
  cache?: RequestCache;
}

/**
 * Resolve base URL. No client browser, paths relativos funcionam direto.
 * Em Server Components / RSC, precisamos URL absoluta — usamos NEXT_PUBLIC_APP_URL
 * ou derivamos de headers via fetch interno do Next (que aceita paths relativos em RSC modernos).
 */
function resolveUrl(path: string, searchParams?: ApiRequestOptions["searchParams"]) {
  const qs = buildQuery(searchParams);
  const suffix = qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path;

  if (typeof window !== "undefined") {
    return suffix;
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${suffix}`;
}

function buildQuery(params?: ApiRequestOptions["searchParams"]) {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (entries.length === 0) return "";
  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }
  return search.toString();
}

/**
 * Executa uma chamada HTTP e desenrola o envelope { ok, data/error, meta }.
 * Jamais retorna resposta "nua" — sempre passa pela validação do envelope.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<{ data: T; meta: ApiResponseMeta }> {
  const url = resolveUrl(path, options.searchParams);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] ??= "application/json";
    body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body,
      credentials: "include",
      signal: options.signal,
      cache: options.cache ?? (typeof window === "undefined" ? "no-store" : undefined),
      next: options.next,
    });
  } catch (cause) {
    throw new ApiTransportError("Falha de rede ao contatar a API.", cause);
  }

  const requestIdHeader = response.headers.get("x-request-id") ?? "unknown";
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new ApiError(
      {
        code: "INVALID_RESPONSE",
        message: `Resposta nao-JSON recebida (status ${response.status}).`,
        status: response.status || 500,
        requestId: requestIdHeader,
      },
      { requestId: requestIdHeader, timestamp: new Date().toISOString() },
    );
  }

  let envelope: ApiResponseEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiResponseEnvelope<T>;
  } catch (cause) {
    throw new ApiTransportError("Resposta JSON invalida.", cause);
  }

  if (!isEnvelope(envelope)) {
    throw new ApiError(
      {
        code: "INVALID_ENVELOPE",
        message: "Resposta sem envelope { ok, data/error, meta }.",
        status: response.status || 500,
        requestId: requestIdHeader,
      },
      { requestId: requestIdHeader, timestamp: new Date().toISOString() },
    );
  }

  if (envelope.ok) {
    return { data: envelope.data, meta: envelope.meta };
  }

  throw new ApiError(envelope.error, envelope.meta);
}

function isEnvelope<T>(value: unknown): value is ApiResponseEnvelope<T> {
  if (typeof value !== "object" || value === null) return false;
  const shape = value as { ok?: unknown; meta?: unknown };
  if (typeof shape.ok !== "boolean") return false;
  if (typeof shape.meta !== "object" || shape.meta === null) return false;
  const meta = shape.meta as { requestId?: unknown };
  return typeof meta.requestId === "string";
}

/** Atalho para GET. */
export function apiGet<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
  return apiFetch<T>(path, { ...options, method: "GET" });
}

/** Atalho para POST. */
export function apiPost<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
  return apiFetch<T>(path, { ...options, method: "POST", body });
}

/** Re-export para consumidores que precisam dos tipos brutos. */
export type { ApiErrorBody, ApiErrorResponse, ApiResponseEnvelope, ApiResponseMeta, ApiSuccessResponse };
