"use client";

import Link from "next/link";
import { useEffect } from "react";

import "./globals.css";

/**
 * Fallback de último recurso: substitui o RootLayout quando o próprio layout
 * raiz lançou. Precisa renderizar <html> + <body> porque é o root.
 *
 * Evita CSS/motion pesado por segurança — se chegou aqui, qualquer coisa pode
 * estar quebrada. Usa apenas inline styles + globals.css (CSS variables).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && typeof console !== "undefined") {
      console.error("[global-error]", error);
    }
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main
          style={{
            minHeight: "100dvh",
            padding: "48px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            color: "var(--foreground)",
            background: "var(--background)",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 640,
              borderRadius: 18,
              border: "1px solid rgba(255,111,97,0.34)",
              background: "var(--surface)",
              padding: "28px 28px 24px",
              boxShadow: "var(--shadow-soft)",
            }}
            role="alert"
            aria-live="assertive"
          >
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--coral)",
                margin: 0,
              }}
            >
              erro crítico
            </p>
            <h1
              style={{
                marginTop: 10,
                fontSize: "1.5rem",
                fontWeight: 600,
                lineHeight: 1.15,
              }}
            >
              Não foi possível carregar a aplicação
            </h1>
            <p
              style={{
                marginTop: 14,
                fontSize: "0.9rem",
                lineHeight: 1.55,
                color: "var(--muted-strong)",
              }}
            >
              Algo falhou antes mesmo do layout inicial. Tente recarregar; se o
              problema persistir, copie a referência abaixo e reporte ao time.
            </p>
            {error.digest ? (
              <p
                style={{
                  marginTop: 16,
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                ref <span style={{ color: "var(--muted-strong)" }}>{error.digest}</span>
              </p>
            ) : null}
            <div style={{ marginTop: 22, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 8,
                  border: "1px solid rgba(237, 73, 86,0.42)",
                  background: "rgba(237, 73, 86,0.14)",
                  color: "var(--acid)",
                  padding: "10px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                tentar novamente
              </button>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 8,
                  border: "1px solid var(--line-strong)",
                  color: "var(--muted-strong)",
                  padding: "10px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                voltar ao início
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
