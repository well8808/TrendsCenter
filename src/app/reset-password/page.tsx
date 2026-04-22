import { getPasswordResetTokenState, resetPasswordAction } from "@/app/(auth)/actions";
import { authButtonClass, authInputClass, AuthShell } from "@/app/(auth)/auth-shell";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = "", error } = await searchParams;
  const tokenState = await getPasswordResetTokenState(token);

  if (!tokenState.ok) {
    return (
      <AuthShell
        title="Link invalido ou expirado"
        subtitle="Solicite uma nova redefinicao para proteger sua conta."
        error={error ?? "invalid_token"}
        footerHref="/forgot-password"
        footerLabel="Solicitar novo link"
        footerText="Precisa recuperar?"
      >
        <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-4 text-sm leading-6 text-[color:var(--muted)]">
          Tokens de reset sao temporarios, de uso unico e invalidam sessoes antigas.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Redefinir senha"
      subtitle="Crie uma senha nova. O link sera invalidado imediatamente depois do uso."
      error={error}
      footerHref="/login"
      footerLabel="Entrar"
      footerText="Ja concluiu?"
    >
      <form action={resetPasswordAction} className="grid gap-4">
        <input name="token" type="hidden" value={token} />
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          nova senha
          <input className={authInputClass} name="password" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <button className={authButtonClass} type="submit">
          redefinir senha
        </button>
      </form>
    </AuthShell>
  );
}
