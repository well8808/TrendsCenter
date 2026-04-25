"use client";

import { AlertTriangle, Copy, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export interface ErrorFallbackProps {
  /** Erro original — pode ser ApiError, Error RSC com .digest, ou qualquer throwable. */
  error: (Error & { digest?: string }) | unknown;
  /** Callback de retry. Normalmente `reset` do error.tsx do Next. */
  onRetry?: () => void;
  /** Rotulo de contexto para troubleshooting (ex.: "trends", "workspace"). */
  surface?: string;
  /** Copy auxiliar para cenários dedicados (ex.: "sua sessão expirou"). */
  auxiliaryText?: string;
  className?: string;
}

interface NormalizedError {
  headline: string;
  code?: string;
  status?: number;
  requestId?: string;
  digest?: string;
  message: string;
  kind: "api" | "transport" | "unknown";
}

function normalize(error: unknown): NormalizedError {
  if (ApiError.is(error)) {
    const unauthorized = error.isUnauthorized;
    return {
      headline: unauthorized ? "Sessão expirada" : "Falha ao falar com o backend",
      code: error.code,
      status: error.status,
      requestId: error.requestId,
      message: error.message,
      kind: "api",
    };
  }

  if (error instanceof Error) {
    const digest = (error as Error & { digest?: string }).digest;
    // Em prod, Next sanitiza .message para "An error occurred in the Server Components render".
    // Mostramos algo útil sem vazar stack.
    return {
      headline: "Tivemos um problema ao renderizar esta seção",
      digest,
      message:
        process.env.NODE_ENV === "production"
          ? "A operação foi interrompida. Copie os detalhes para reportar ou tente novamente."
          : error.message,
      kind: digest ? "unknown" : "unknown",
    };
  }

  return {
    headline: "Erro desconhecido",
    message: "Nenhum detalhe disponível.",
    kind: "unknown",
  };
}

export function ErrorFallback({
  error,
  onRetry,
  surface,
  auxiliaryText,
  className,
}: ErrorFallbackProps) {
  const info = normalize(error);
  const [copied, setCopied] = useState(false);

  async function copyDetails() {
    const payload = {
      headline: info.headline,
      code: info.code,
      status: info.status,
      requestId: info.requestId,
      digest: info.digest,
      surface,
      message: info.message,
      pathname:
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : undefined,
      timestamp: new Date().toISOString(),
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      // clipboard bloqueado (iframe, HTTP) — sem feedback extra, detalhes ficam em tela
    }
  }

  const correlation = info.requestId && info.requestId !== "n/a" ? info.requestId : info.digest;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease }}
      className={cn(
        "app-panel relative overflow-hidden rounded-[var(--radius-lg)] p-6 md:p-8",
        "border-[rgba(255,111,97,0.34)]",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[rgba(255,111,97,0.32)] bg-[rgba(255,111,97,0.08)]">
          <AlertTriangle className="h-5 w-5 text-[color:var(--coral)]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[color:var(--coral)]">
            {info.kind === "api" && info.code
              ? `${info.code}${typeof info.status === "number" ? ` · ${info.status}` : ""}`
              : "falha inesperada"}
          </p>
          <h2 className="mt-2 text-xl font-semibold md:text-2xl">{info.headline}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
            {info.message}
          </p>
          {auxiliaryText ? (
            <p className="mt-2 max-w-2xl text-xs leading-5 text-[color:var(--muted)]">
              {auxiliaryText}
            </p>
          ) : null}

          {correlation ? (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              {info.requestId && info.requestId !== "n/a" ? "req " : "ref "}
              <span className="text-[color:var(--muted-strong)]">{correlation}</span>
              {surface ? (
                <span className="ml-3 text-[color:var(--muted)]">surface {surface}</span>
              ) : null}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(199,255,93,0.42)] bg-[rgba(199,255,93,0.14)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.2)]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                tentar novamente
              </button>
            ) : null}
            <button
              type="button"
              onClick={copyDetails}
              className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--line-strong)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.38)] hover:text-[color:var(--aqua)]"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {copied ? "copiado" : "copiar detalhes"}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
