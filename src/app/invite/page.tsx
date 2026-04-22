import { acceptInviteAction, getInviteTokenState } from "@/app/(auth)/actions";
import { authButtonClass, authInputClass, AuthShell } from "@/app/(auth)/auth-shell";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = "", error } = await searchParams;
  const invite = await getInviteTokenState(token);

  if (!invite.ok) {
    return (
      <AuthShell
        title="Convite invalido"
        subtitle="Este link pode ter expirado, sido aceito ou revogado."
        error={error ?? "invalid_token"}
        footerHref="/login"
        footerLabel="Entrar"
        footerText="Ja tem acesso?"
      >
        <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-4 text-sm leading-6 text-[color:var(--muted)]">
          Solicite um novo convite ao owner ou admin do workspace.
        </div>
      </AuthShell>
    );
  }
  const workspaceName = invite.workspaceName ?? "workspace";
  const role = invite.role ?? "MEMBER";
  const email = invite.email ?? "convidado";

  return (
    <AuthShell
      title={`Entrar em ${workspaceName}`}
      subtitle={`Convite para ${email} com papel ${role.toLowerCase()}.`}
      error={error}
      footerHref="/login"
      footerLabel="Entrar"
      footerText="Ja tem sessao?"
    >
      <form action={acceptInviteAction} className="grid gap-4">
        <input name="token" type="hidden" value={token} />
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          nome
          <input className={authInputClass} name="name" type="text" autoComplete="name" />
        </label>
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          senha
          <input className={authInputClass} name="password" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <button className={authButtonClass} type="submit">
          aceitar convite
        </button>
      </form>
    </AuthShell>
  );
}
