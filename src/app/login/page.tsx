import { redirect } from "next/navigation";

import { loginAction } from "@/app/(auth)/actions";
import { authButtonClass, authInputClass, AuthShell } from "@/app/(auth)/auth-shell";
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
      subtitle="Acesso obrigatorio para ler ou escrever qualquer sinal, evidencia, job ou fonte."
      error={error}
      footerHref="/signup"
      footerLabel="Criar workspace"
      footerText="Ainda nao tem acesso?"
    >
      <form action={loginAction} className="grid gap-4">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          e-mail
          <input className={authInputClass} name="email" type="email" autoComplete="email" required />
        </label>
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          senha
          <input className={authInputClass} name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className={authButtonClass} type="submit">
          entrar
        </button>
      </form>
    </AuthShell>
  );
}
