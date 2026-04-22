import { AuthShell } from "@/app/(auth)/auth-shell";

export default function ResetPasswordSuccessPage() {
  return (
    <AuthShell
      title="Senha redefinida"
      subtitle="A nova senha esta ativa e sessoes antigas foram encerradas."
      status="success"
      footerHref="/login"
      footerLabel="Entrar"
      footerText="Voltar ao command center?"
    >
      <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-4 text-sm leading-6 text-[color:var(--muted)]">
        Use a nova senha para iniciar uma sessao limpa no workspace.
      </div>
    </AuthShell>
  );
}
