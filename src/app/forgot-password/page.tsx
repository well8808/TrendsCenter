import { redirect } from "next/navigation";

import { forgotPasswordAction } from "@/app/(auth)/actions";
import { authButtonClass, authInputClass, AuthShell } from "@/app/(auth)/auth-shell";
import { getTenantContext } from "@/lib/auth/session";

export default async function ForgotPasswordPage({
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
      title="Recuperar senha"
      subtitle="Informe seu e-mail. Se ele estiver ativo, enviaremos um link seguro para voltar ao radar."
      error={error}
      footerHref="/login"
      footerLabel="Voltar ao login"
      footerText="Lembrou a senha?"
    >
      <form action={forgotPasswordAction} className="grid gap-4">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          e-mail
          <input className={authInputClass} name="email" type="email" autoComplete="email" required />
        </label>
        <button className={authButtonClass} type="submit">
          enviar link seguro
        </button>
      </form>
    </AuthShell>
  );
}
