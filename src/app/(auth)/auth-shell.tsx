import Link from "next/link";
import type { ReactNode } from "react";

const errorCopy: Record<string, string> = {
  missing: "Preencha e-mail e senha para continuar.",
  invalid: "E-mail ou senha incorretos.",
  exists: "Já existe uma conta com este e-mail.",
  failed: "Não foi possível entrar agora. Tente novamente.",
  workspace: "Esta conta ainda não tem acesso ativo.",
  unverified: "Confirme seu e-mail antes de entrar.",
  rate_limited: "Muitas tentativas. Aguarde um momento e tente novamente.",
  invalid_token: "Este link não é válido ou já foi usado.",
};

const statusCopy: Record<string, string> = {
  sent: "Link enviado. Verifique seu e-mail.",
  resent: "Novo link enviado. Verifique seu e-mail.",
  cooldown: "Aguarde um momento antes de solicitar outro link.",
  unverified: "Conta pendente. Confirme seu e-mail para liberar o acesso.",
  success: "Operação concluída.",
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
    <main className="relative min-h-svh overflow-x-hidden px-4 py-6 text-[color:var(--foreground)] sm:px-6">
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl items-center justify-center">
        <section className="app-hero grid w-full max-w-[1040px] overflow-hidden rounded-[var(--radius-lg)] lg:grid-cols-[1fr_420px]">
          <div className="hidden min-h-[620px] border-r border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--muted)]">
                <span className="inline-block h-1 w-1 rounded-full bg-[color:var(--hot)]" aria-hidden="true" />
                acesso restrito
              </div>
              <h1 className="mt-12 max-w-lg text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.02em]">
                Instagram Reels<br />
                <span className="gradient-text-ig">Viral Library</span>
              </h1>
              <p className="mt-6 max-w-sm text-[13px] leading-6 text-[color:var(--muted)]">
                Reels em crescimento, fontes verificadas e sinais estratégicos para decidir o próximo movimento.
              </p>
            </div>
            <ul className="space-y-2 text-[12px] text-[color:var(--muted)]">
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[color:var(--success)]" aria-hidden="true" />
                Conta segura e privada
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[color:var(--aqua)]" aria-hidden="true" />
                Fontes oficiais e licenciadas
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[color:var(--muted)]" aria-hidden="true" />
                Dados reais, sem invenção
              </li>
            </ul>
          </div>
          <div className="p-6 sm:p-10">
            <div className="mb-10">
              <h2 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.015em]">{title}</h2>
              <p className="mt-3 max-w-sm text-[13px] leading-6 text-[color:var(--muted)]">{subtitle}</p>
            </div>

            {error && (
              <p className="mb-6 rounded-[var(--radius-md)] border border-[rgba(237,73,86,0.28)] bg-[rgba(237,73,86,0.08)] px-4 py-3 text-[13px] text-[color:var(--hot)]">
                {errorCopy[error] ?? errorCopy.failed}
              </p>
            )}
            {status && !error && (
              <p className="mb-6 rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.025)] px-4 py-3 text-[13px] text-[color:var(--muted-strong)]">
                {statusCopy[status] ?? statusCopy.success}
              </p>
            )}

            {children}

            {footerHref && footerLabel && footerText && (
              <p className="mt-8 text-[13px] text-[color:var(--muted)]">
                {footerText}{" "}
                <Link className="font-semibold text-[color:var(--foreground)] underline decoration-[color:var(--hot)] decoration-2 underline-offset-4 transition hover:text-[color:var(--hot)]" href={footerHref}>
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
  "app-control w-full rounded-[var(--radius-sm)] px-3.5 py-3 text-[14px] outline-none transition focus:border-[rgba(237,73,86,0.42)]";

export const authButtonClass =
  "relative min-h-[var(--control-height)] w-full overflow-hidden rounded-[var(--radius-sm)] bg-[color:var(--hot)] px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_8px_24px_rgba(237,73,86,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-[#f25864] hover:shadow-[0_10px_30px_rgba(237,73,86,0.36),inset_0_1px_0_rgba(255,255,255,0.22)]";
