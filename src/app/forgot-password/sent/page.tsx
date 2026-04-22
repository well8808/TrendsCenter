import { AuthShell } from "@/app/(auth)/auth-shell";

export default function ForgotPasswordSentPage() {
  return (
    <AuthShell
      title="Solicitacao recebida"
      subtitle="Se a conta existir e estiver verificada, um link de redefinicao foi enfileirado com validade curta."
      status="success"
      footerHref="/login"
      footerLabel="Entrar"
      footerText="Ja redefiniu?"
    >
      <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-4 text-sm leading-6 text-[color:var(--muted)]">
        Por seguranca, esta tela nao confirma se o e-mail existe no sistema.
      </div>
    </AuthShell>
  );
}
