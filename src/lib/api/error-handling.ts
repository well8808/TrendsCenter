import { ApiError, ApiTransportError } from "@/lib/api/client";
import {
  currentPathname,
  reportClientError,
  type ClientErrorReport,
} from "@/lib/observability/client-telemetry";

/**
 * Formato normalizado de erro exposto para componentes/hooks. Preserva o
 * requestId do envelope para correlação com os logs de backend.
 */
export interface ResourceErrorInfo {
  message: string;
  code: string;
  status: number;
  requestId: string;
  /** true se o erro é rede/parse (sem requestId backend). */
  isTransport: boolean;
}

/**
 * Converte qualquer erro em `ResourceErrorInfo`. Não tem efeito colateral —
 * é seguro chamar antes de decidir se reporta/redireciona.
 */
export function toResourceErrorInfo(error: unknown): ResourceErrorInfo {
  if (ApiError.is(error)) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      requestId: error.requestId,
      isTransport: false,
    };
  }

  if (error instanceof ApiTransportError) {
    return {
      message: error.message,
      code: "TRANSPORT_ERROR",
      status: 0,
      requestId: "n/a",
      isTransport: true,
    };
  }

  return {
    message: error instanceof Error ? error.message : "Falha desconhecida.",
    code: "UNKNOWN",
    status: 0,
    requestId: "n/a",
    isTransport: false,
  };
}

/**
 * Redireciona para /login preservando a rota alvo em `?next=`. Só executa no
 * browser — em SSR é no-op, evitando quebrar render. Mutável via setter abaixo
 * para testes e customização (ex.: push de router).
 */
let unauthorizedHandler: () => void = () => {
  if (typeof window === "undefined") return;
  const target = window.location.pathname + window.location.search;
  window.location.href = `/login?next=${encodeURIComponent(target)}`;
};

export function defaultUnauthorizedHandler(): void {
  unauthorizedHandler();
}

/**
 * Substitui o handler padrão de 401. Use em testes ou para trocar o redirect
 * por `router.push` quando quiser evitar hard navigation.
 */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export interface HandleClientApiErrorContext {
  /** Origem do erro (ex.: "hook:useApiResource", "form:ingestion"). */
  context?: string;
  /** Permite override do pathname — útil em boundaries fora do router. */
  pathname?: string;
}

/**
 * Handler central para erros client-side de API. Faz três coisas:
 *   1. Normaliza para `ResourceErrorInfo`.
 *   2. Reporta para a telemetria (pluggable).
 *   3. Redireciona para /login se o erro for 401.
 *
 * Retorna o info pra quem chama ainda mostrar UI local. Chamadores em hooks
 * passam o erro cru; chamadores em event handlers também.
 */
export function handleClientApiError(
  error: unknown,
  ctx: HandleClientApiErrorContext = {},
): ResourceErrorInfo {
  const info = toResourceErrorInfo(error);

  const report: ClientErrorReport = {
    message: info.message,
    code: info.code,
    status: info.status,
    requestId: info.requestId === "n/a" ? undefined : info.requestId,
    isTransport: info.isTransport,
    timestamp: new Date().toISOString(),
    pathname: ctx.pathname ?? currentPathname(),
    context: ctx.context,
  };
  reportClientError(report);

  const unauthorized =
    info.status === 401 || (ApiError.is(error) && error.isUnauthorized);
  if (unauthorized) {
    defaultUnauthorizedHandler();
  }

  return info;
}
