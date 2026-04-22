import { redirect } from "next/navigation";

import { signupAction } from "@/app/(auth)/actions";
import { authButtonClass, authInputClass, AuthShell } from "@/app/(auth)/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { getTenantContext } from "@/lib/auth/session";

export default async function SignupPage({
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
      title="Criar acesso inicial"
      subtitle="Cada cadastro cria um workspace isolado, com connectors seguros e sem dados ficticios de mercado."
      error={error}
      footerHref="/login"
      footerLabel="Entrar"
      footerText="Ja tem uma conta?"
    >
      <form action={signupAction} className="grid gap-4">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          nome
          <input className={authInputClass} name="name" type="text" autoComplete="name" />
        </label>
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          e-mail
          <input className={authInputClass} name="email" type="email" autoComplete="email" required />
        </label>
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          workspace
          <input className={authInputClass} name="workspaceName" type="text" defaultValue="Radar BR" required />
        </label>
        <PasswordInput label="senha" autoComplete="new-password" minLength={10} />
        <button className={authButtonClass} type="submit">
          criar workspace
        </button>
      </form>
    </AuthShell>
  );
}
