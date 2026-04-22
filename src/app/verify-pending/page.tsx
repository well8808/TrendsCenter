import Link from "next/link";
import { redirect } from "next/navigation";

import { getPendingVerificationLink, resendVerificationAction } from "@/app/(auth)/actions";
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
  const verification = await getPendingVerificationLink(email);

  return (
    <AuthShell
      title="Liberar acesso"
      subtitle="O app ainda nao tem envio transacional de e-mail configurado. Use a verificacao segura deste navegador para entrar."
      status={status}
      error={error}
      footerHref="/login"
      footerLabel="Entrar"
      footerText="Ja verificou?"
    >
      {verification && (
        <Link
          className={`${authButtonClass} mb-4 inline-flex items-center justify-center`}
          href={verification.actionUrl}
        >
          verificar agora
        </Link>
      )}
      <form action={resendVerificationAction} className="grid gap-4">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          e-mail
          <input className={authInputClass} name="email" type="email" defaultValue={email} required />
        </label>
        <button className={authButtonClass} type="submit">
          gerar novo link
        </button>
      </form>
      <p className="mt-4 text-xs leading-5 text-[color:var(--muted)]">
        O link continua temporario, de uso unico e vinculado ao navegador onde voce acabou de entrar ou criar a conta.
      </p>
      {!verification && (
        <p className="mt-3 rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] px-4 py-3 text-xs leading-5 text-[color:var(--muted-strong)]">
          Se o botao nao aparecer, informe seu e-mail acima e gere um novo link. Isso nao envia e-mail externo; apenas cria a verificacao local segura.
        </p>
      )}
      <Link className="mt-5 inline-flex text-sm font-semibold text-[color:var(--aqua)]" href="/signup">
        Criar outro workspace
      </Link>
    </AuthShell>
  );
}
