import { consumeEmailVerificationToken } from "@/app/(auth)/actions";
import { AuthShell } from "@/app/(auth)/auth-shell";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const result = await consumeEmailVerificationToken(token);
  const ok = result.ok;

  return (
    <AuthShell
      title={ok ? "E-mail verificado" : "Link inválido ou expirado"}
      subtitle={
        ok
          ? "Seu acesso foi liberado. Entre para abrir o workspace operacional."
          : "Solicite um novo link de verificação para manter a conta protegida."
      }
      status={ok ? "success" : undefined}
      error={ok ? undefined : "invalid_token"}
      footerHref={ok ? "/login" : "/verify-pending"}
      footerLabel={ok ? "Entrar no app" : "Solicitar novo link"}
      footerText={ok ? "Pronto para continuar?" : "Precisa confirmar o e-mail?"}
    >
      <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-4 text-sm leading-6 text-[color:var(--muted)]">
        {ok
          ? "Verificação consumida com sucesso. O token não pode ser reutilizado."
          : "O link pode ter expirado, sido usado antes ou não pertencer a uma conta pendente."}
      </div>
    </AuthShell>
  );
}
