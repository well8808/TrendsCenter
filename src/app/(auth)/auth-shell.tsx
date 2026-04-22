import Link from "next/link";
import type { ReactNode } from "react";

const errorCopy: Record<string, string> = {
  missing: "Preencha e-mail e senha para continuar.",
  invalid: "Credenciais invalidas ou senha curta. Use pelo menos 10 caracteres no cadastro.",
  exists: "Ja existe uma conta com este e-mail.",
  failed: "Nao foi possivel concluir a autenticacao agora.",
  workspace: "Esta conta nao possui workspace ativo.",
  unverified: "Verifique seu e-mail antes de entrar no app operacional.",
  rate_limited: "Muitas tentativas. Aguarde um pouco e tente novamente.",
  invalid_token: "Este link nao e valido ou ja foi usado.",
};

const statusCopy: Record<string, string> = {
  sent: "Link de verificacao enfileirado com seguranca.",
  resent: "Novo link gerado. Use o mais recente.",
  cooldown: "Reenvio controlado. Aguarde antes de solicitar outro link.",
  unverified: "Conta criada, mas ainda pendente de verificacao.",
  success: "Operacao concluida com seguranca.",
};

export function AuthShell({
  title,
  subtitle,
  error,
  status,
  children,
  footerHref,
  footerLabel,
  footerText,
}: {
  title: string;
  subtitle: string;
  error?: string;
  status?: string;
  children: ReactNode;
  footerHref?: string;
  footerLabel?: string;
  footerText?: string;
}) {
  return (
    <main className="relative min-h-svh overflow-hidden px-4 py-6 text-[color:var(--foreground)] sm:px-6">
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl items-center justify-center">
        <section className="grid w-full max-w-[1040px] overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(16,16,13,0.72)] shadow-[var(--shadow-soft)] backdrop-blur-2xl lg:grid-cols-[1fr_420px]">
          <div className="hidden min-h-[620px] border-r border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-[rgba(199,255,93,0.28)] bg-[rgba(199,255,93,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                tenant safe
              </div>
              <h1 className="mt-8 max-w-lg text-5xl font-semibold leading-[1.02]">
                TikTok Market Command Center
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-[color:var(--muted-strong)]">
                Autenticacao, sessao e workspace isolado antes de qualquer dado operacional.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs text-[color:var(--muted)]">
              <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] p-3">
                <p className="text-[color:var(--aqua)]">01</p>
                <p className="mt-2">sessao HTTP-only</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] p-3">
                <p className="text-[color:var(--gold)]">02</p>
                <p className="mt-2">tenant scope</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] p-3">
                <p className="text-[color:var(--acid)]">03</p>
                <p className="mt-2">safe mode</p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--aqua)]">
                acesso seguro
              </p>
              <h2 className="mt-3 text-3xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{subtitle}</p>
            </div>

            {error && (
              <p className="mb-5 rounded-[var(--radius-md)] border border-[rgba(255,111,97,0.34)] bg-[rgba(255,111,97,0.08)] px-4 py-3 text-sm text-[color:var(--coral)]">
                {errorCopy[error] ?? errorCopy.failed}
              </p>
            )}
            {status && !error && (
              <p className="mb-5 rounded-[var(--radius-md)] border border-[rgba(64,224,208,0.3)] bg-[rgba(64,224,208,0.08)] px-4 py-3 text-sm text-[color:var(--aqua)]">
                {statusCopy[status] ?? statusCopy.success}
              </p>
            )}

            {children}

            {footerHref && footerLabel && footerText && (
              <p className="mt-6 text-sm text-[color:var(--muted)]">
                {footerText}{" "}
                <Link className="font-semibold text-[color:var(--acid)]" href={footerHref}>
                  {footerLabel}
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export const authInputClass =
  "w-full rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] px-3 py-3 text-sm outline-none transition focus:border-[rgba(64,224,208,0.58)]";

export const authButtonClass =
  "w-full rounded-[var(--radius-sm)] border border-[rgba(199,255,93,0.34)] bg-[rgba(199,255,93,0.12)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.18)]";
