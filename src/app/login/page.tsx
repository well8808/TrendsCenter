import { redirect } from "next/navigation";
import Link from "next/link";

import { loginAction } from "@/app/(auth)/actions";
import { authButtonClass, authInputClass, AuthShell } from "@/app/(auth)/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { getTenantContext } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const context = await getTenantContext();

  if (context) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <AuthShell
      title="Entrar no command center"
      subtitle="Acesso obrigatório para ler ou escrever qualquer sinal, evidência, job ou fonte."
      error={error}
      footerHref="/signup"
      footerLabel="Criar workspace"
      footerText="Ainda não tem acesso?"
    >
      <form action={loginAction} className="grid gap-4">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          e-mail
          <input className={authInputClass} name="email" type="email" autoComplete="email" required />
        </label>
        <PasswordInput label="senha" autoComplete="current-password" />
        <label className="group flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] px-3 py-3 text-sm text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.36)]">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]">
              manter conectado
            </span>
            <span className="mt-1 block text-xs text-[color:var(--muted)]">Mantém a sessão por até 30 dias.</span>
          </span>
          <input className="peer sr-only" name="remember" type="checkbox" defaultChecked />
          <span className="relative h-6 w-11 rounded-full border border-[color:var(--line)] bg-[rgba(0,0,0,0.28)] transition after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-[color:var(--muted)] after:transition peer-checked:border-[rgba(199,255,93,0.55)] peer-checked:bg-[rgba(199,255,93,0.22)] peer-checked:after:translate-x-5 peer-checked:after:bg-[color:var(--acid)]" />
        </label>
        <button className={authButtonClass} type="submit">
          entrar
        </button>
        <Link className="text-sm font-semibold text-[color:var(--aqua)]" href="/forgot-password">
          Esqueci minha senha
        </Link>
      </form>
    </AuthShell>
  );
}
