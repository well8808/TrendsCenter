"use client";

import { useEffect } from "react";

import { ErrorFallback } from "@/components/error-fallback";
import { ApiError } from "@/lib/api";
import {
  currentPathname,
  reportClientError,
} from "@/lib/observability/client-telemetry";

/**
 * Error boundary do App Router. Captura qualquer erro não tratado dentro do
 * layout raiz — inclui erros jogados por Server Components, Server Actions,
 * render de Client Components e async event handlers que são rethrown.
 *
 * Mantém o layout raiz montado; `reset()` do Next remonta a sub-árvore.
 */
export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isApi = ApiError.is(error);
    reportClientError({
      message: error.message,
      code: isApi ? error.code : undefined,
      status: isApi ? error.status : undefined,
      requestId: isApi ? error.requestId : undefined,
      digest: error.digest,
      pathname: currentPathname(),
      timestamp: new Date().toISOString(),
      context: "error-boundary",
      isTransport: false,
    });
  }, [error]);

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />
      <section className="relative mx-auto grid w-full max-w-[960px] items-start gap-6 px-4 py-10 md:px-6 md:py-16">
        <ErrorFallback error={error} onRetry={reset} surface="app" />
      </section>
    </main>
  );
}
