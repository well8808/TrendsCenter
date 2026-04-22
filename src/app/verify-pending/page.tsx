import Link from "next/link";
import { redirect } from "next/navigation";

import { resendVerificationAction } from "@/app/(auth)/actions";
import { authButtonClass, authInputClass, AuthShell } from "@/app/(auth)/auth-shell";
import { getTenantContext } from "@/lib/auth/session";

export default async function VerifyPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; status?: string; error?: string }>;
}) {
  const context = await getTenantContext();

  if (context) {
    redirect("/");
  }

  const { email = "", status, error } = await searchParams;

  return (
    <AuthShell
      title="Verifique seu e-mail"
      subtitle="A conta foi criada, mas o command center so abre depois da confirmacao do e-mail."
      status={status}
      error={error}
      footerHref="/login"
      footerLabel="Entrar"
      footerText="Ja verificou?"
    >
      <form action={resendVerificationAction} className="grid gap-4">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          e-mail
          <input className={authInputClass} name="email" type="email" defaultValue={email} required />
        </label>
        <button className={authButtonClass} type="submit">
          reenviar verificacao
        </button>
      </form>
      <p className="mt-4 text-xs leading-5 text-[color:var(--muted)]">
        O link e temporario, de uso unico e fica registrado no outbox transacional de seguranca.
      </p>
      <Link className="mt-5 inline-flex text-sm font-semibold text-[color:var(--aqua)]" href="/signup">
        Criar outro workspace
      </Link>
    </AuthShell>
  );
}
