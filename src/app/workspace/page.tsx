import Link from "next/link";
import { ArrowLeft, Crown, MailPlus, ShieldCheck, UsersRound } from "lucide-react";

import { changeMemberRoleAction, inviteMemberAction } from "@/app/workspace/actions";
import { requireTenantContext } from "@/lib/auth/session";
import { getWorkspaceSettingsData } from "@/lib/workspace/settings";
import { cn } from "@/lib/utils";

const statusCopy: Record<string, string> = {
  invite_sent: "Convite criado e enfileirado para entrega.",
  role_updated: "Papel atualizado com autorizacao owner.",
};

const errorCopy: Record<string, string> = {
  rate_limited: "Muitas tentativas. Aguarde antes de tentar novamente.",
  invite_invalid: "Convite invalido para seu papel atual.",
  already_member: "Este e-mail ja faz parte do workspace.",
  role_invalid: "Papel invalido.",
  role_blocked: "Esta mudanca de papel esta bloqueada.",
};

const roleOptions = [
  { value: "ADMIN", label: "admin" },
  { value: "MEMBER", label: "member" },
] as const;

const controlClass =
  "min-h-[var(--control-height)] rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[var(--control-bg)] px-3 py-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[rgba(64,224,208,0.58)]";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const context = await requireTenantContext();
  const data = await getWorkspaceSettingsData(context);
  const { status, error } = await searchParams;

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-50" />
      <section className="relative mx-auto grid w-full max-w-7xl items-start gap-6 px-4 py-5 md:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="app-panel scrollbar-soft rounded-[var(--radius-lg)] p-5 lg:sticky lg:top-5 lg:max-h-[calc(100dvh-2.5rem)] lg:overflow-y-auto lg:overscroll-contain">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)]" href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            command center
          </Link>
          <div className="mt-8">
            <div className="inline-flex rounded-full border border-[rgba(199,255,93,0.28)] bg-[rgba(199,255,93,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
              workspace settings
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-tight">{data.workspace.name}</h1>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Membros, convites e autorizacao real por tenant. Nada aqui depende apenas da UI.
            </p>
          </div>
          <div className="mt-8 grid gap-3 text-sm">
            <div className="app-card rounded-[var(--radius-md)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">sua sessao</p>
              <p className="mt-2 font-semibold">{data.actor.email}</p>
              <p className="mt-1 text-[color:var(--muted)]">{data.actor.role.toLowerCase()}</p>
            </div>
            <div className="app-card rounded-[var(--radius-md)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">permissoes</p>
              <p className="mt-2 text-[color:var(--muted-strong)]">
                {data.actor.canManageRoles ? "owner controls" : data.actor.canInvite ? "admin ops" : "member ops"}
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          {(status || error) && (
            <div
              className={cn(
                "rounded-[var(--radius-md)] border px-4 py-3 text-sm",
                error
                  ? "border-[rgba(255,111,97,0.34)] bg-[rgba(255,111,97,0.08)] text-[color:var(--coral)]"
                  : "border-[rgba(64,224,208,0.3)] bg-[rgba(64,224,208,0.08)] text-[color:var(--aqua)]",
              )}
            >
              {error ? errorCopy[error] ?? "Acao bloqueada." : statusCopy[status ?? ""] ?? "Acao concluida."}
            </div>
          )}

          <section className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                  members
                </div>
                <h2 className="mt-3 text-2xl font-semibold">Acesso por papel</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                  Owner controla roles. Admin convida membros. Member opera sinais dentro do tenant.
                </p>
              </div>
              <div className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {data.members.length} ativos
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {data.members.map((member) => (
                <div
                  className="app-card grid gap-3 rounded-[var(--radius-md)] p-4 md:grid-cols-[minmax(0,1fr)_220px]"
                  key={member.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{member.name ?? member.email}</p>
                      {member.role === "OWNER" && <Crown className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />}
                      {member.isSelf && (
                        <span className="rounded-full bg-[rgba(64,224,208,0.1)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--aqua)]">
                          voce
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-[color:var(--muted)]">{member.email}</p>
                  </div>
                  {data.actor.canManageRoles && !member.isSelf && member.role !== "OWNER" ? (
                    <form action={changeMemberRoleAction} className="flex items-center gap-2">
                      <input name="memberId" type="hidden" value={member.id} />
                      <select
                        className={`${controlClass} min-w-0 flex-1 py-2`}
                        name="role"
                        defaultValue={member.role}
                      >
                        {roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <button className="min-h-[var(--control-height)] rounded-full border border-[rgba(199,255,93,0.4)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.1)]" type="submit">
                        salvar
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-start md:justify-end">
                      <span className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
                        {member.role.toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
                <MailPlus className="h-4 w-4" aria-hidden="true" />
                invite member
              </div>
              <h2 className="mt-3 text-xl font-semibold">Convite rastreavel</h2>
              {data.actor.canInvite ? (
                <form action={inviteMemberAction} className="mt-5 grid gap-4">
                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    e-mail
                    <input className={controlClass} name="email" type="email" required />
                  </label>
                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    papel
                    <select className={controlClass} name="role" defaultValue="MEMBER">
                      {data.actor.role === "OWNER" && <option value="ADMIN">admin</option>}
                      <option value="MEMBER">member</option>
                    </select>
                  </label>
                  <button className="min-h-[var(--control-height)] rounded-[var(--radius-sm)] border border-[rgba(199,255,93,0.4)] bg-[rgba(199,255,93,0.12)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.18)]" type="submit">
                    criar convite
                  </button>
                </form>
              ) : (
                <p className="app-card mt-5 rounded-[var(--radius-md)] p-4 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Seu papel atual permite operar sinais, mas nao convidar membros.
                </p>
              )}
            </div>

            <div className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                invites pendentes
              </div>
              <h2 className="mt-3 text-xl font-semibold">Lineage de acesso</h2>
              <div className="mt-5 grid gap-3">
                {data.invites.length ? (
                  data.invites.map((invite) => (
                    <div className="app-card rounded-[var(--radius-md)] p-4" key={invite.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold">{invite.email}</p>
                        <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                          {invite.role.toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--muted)]">
                        expira em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(invite.expiresAt))}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="app-card rounded-[var(--radius-md)] p-4 text-sm leading-6 text-[color:var(--muted-strong)]">
                    Nenhum convite pendente. O workspace esta fechado por padrao.
                  </p>
                )}
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
