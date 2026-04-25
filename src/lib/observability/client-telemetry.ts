/**
 * Telemetria mínima de erros client-side. Stateless, pluggable, sem dependência
 * de provider concreto. Consumidores apenas registram um reporter no mount —
 * tipicamente em um `useEffect` dentro de um Client Component de bootstrap.
 *
 * Exemplos de integração futura:
 *   registerClientErrorReporter((report) => Sentry.captureMessage(...))
 *   registerClientErrorReporter((report) => datadogRum.addError(...))
 */

export interface ClientErrorReport {
  message: string;
  timestamp: string;
  pathname?: string;
  /** requestId correlacionável com logs do backend quando o erro veio da API. */
  requestId?: string;
  /** Código normalizado (ApiError.code, TRANSPORT_ERROR, UNKNOWN, BOUNDARY). */
  code?: string;
  status?: number;
  /** Dígito opaco do Next.js (error.digest). Disponível em erros RSC/SSR. */
  digest?: string;
  /** Origem do erro dentro do app. Ex: "error-boundary", "hook:useApiResource". */
  context?: string;
  /** true quando é falha de rede/parse (sem resposta do backend). */
  isTransport?: boolean;
}

export type ClientErrorReporter = (report: ClientErrorReport) => void;

let reporter: ClientErrorReporter | null = null;

/**
 * Instala (ou remove, passando null) o reporter global. Um único reporter por vez —
 * mantém a API tão fina quanto Sentry.init() e evita orquestração prematura.
 */
export function registerClientErrorReporter(next: ClientErrorReporter | null): void {
  reporter = next;
}

/**
 * Emite um relatório. Nunca lança — defeito no reporter é silenciado para não
 * cascatear dentro de error boundaries que já estão tratando outro erro.
 */
export function reportClientError(report: ClientErrorReport): void {
  if (reporter) {
    try {
      reporter(report);
    } catch {
      // não cascatear
    }
  }

  if (process.env.NODE_ENV !== "production" && typeof console !== "undefined") {
    // Em dev ajuda a correlacionar o erro client com o requestId do backend.
    console.error("[client-error]", report);
  }
}

/**
 * Retorna `pathname + search` corrente. Usada como default quando o chamador
 * não consegue resolver contexto de rota (ex.: global-error fora do RouterProvider).
 */
export function currentPathname(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.location.pathname + window.location.search;
  } catch {
    return undefined;
  }
}
