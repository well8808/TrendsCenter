import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Cable,
  CheckCircle2,
  Database,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { requireTenantContext } from "@/lib/auth/session";
import { getSourcesConnectorsData, type ExternalConnectorView } from "@/lib/sources/connectors";
import type { TrendSourceRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const sourceTypeLabel: Record<TrendSourceRecord["sourceType"], string> = {
  reel: "Reels",
  audio: "Audio",
  creator: "Perfis",
  hashtag: "Hashtags",
  account_insights: "Conta profissional",
  meta_ad_library: "Anuncios Meta",
  manual: "Manual",
};

const sourceStatusLabel: Record<TrendSourceRecord["status"], string> = {
  active: "Fonte ativa",
  paused: "Fonte pausada",
  error: "Erro na fonte",
};

const sourceStatusClass: Record<TrendSourceRecord["status"], string> = {
  active: "border-[rgba(121,232,132,0.34)] bg-[rgba(121,232,132,0.09)] text-[color:var(--success)]",
  paused: "border-[rgba(243,201,105,0.34)] bg-[rgba(243,201,105,0.08)] text-[color:var(--gold)]",
  error: "border-[rgba(255,111,97,0.36)] bg-[rgba(255,111,97,0.08)] text-[color:var(--coral)]",
};

const connectorStateClass: Record<ExternalConnectorView["state"], string> = {
  connected: "border-[rgba(121,232,132,0.36)] bg-[rgba(121,232,132,0.09)] text-[color:var(--success)]",
  ready: "border-[rgba(237, 73, 86,0.34)] bg-[rgba(237, 73, 86,0.09)] text-[color:var(--acid)]",
  not_configured: "border-[rgba(64,224,208,0.32)] bg-[rgba(64,224,208,0.08)] text-[color:var(--aqua)]",
  configuration_error: "border-[rgba(255,111,97,0.38)] bg-[rgba(255,111,97,0.08)] text-[color:var(--coral)]",
};

function formatDate(value?: string) {
  return value ? dateFormatter.format(new Date(value)) : "Ainda não verificado";
}

function scopeLabel(scope: string) {
  if (scope === "instagram_business_basic") return "perfil profissional";
  if (scope === "instagram_business_manage_insights") return "metricas e insights";

  return "permissao aprovada";
}

function connectionStatusLabel(status: string) {
  if (status === "connected") return "dados liberados";
  if (status === "error") return "precisa de revisao";

  return "aguardando autorizacao";
}

function MetaItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</dt>
      <dd
        className={cn(
          "mt-1 min-w-0 break-words text-sm leading-5 text-[color:var(--muted-strong)]",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ConnectorStatusCard({ connector }: { connector: ExternalConnectorView }) {
  return (
    <section className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
            <Cable className="h-4 w-4" aria-hidden="true" />
            Conta de dados
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{connector.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted-strong)]">
            {connector.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]",
              connectorStateClass[connector.state],
            )}
          >
            {connector.state === "configuration_error" ? (
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            ) : connector.state === "ready" || connector.state === "connected" ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {connector.stateLabel}
          </span>
          <span className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
            {connector.readinessLabel}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="app-card rounded-[var(--radius-md)] p-4">
          <p className="eyebrow">rede</p>
          <p className="mt-2 font-mono text-sm uppercase tracking-[0.14em] text-[color:var(--foreground)]">
            {connector.platform}
          </p>
        </div>
        <div className="app-card rounded-[var(--radius-md)] p-4">
          <p className="eyebrow">origem</p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">{connector.surface}</p>
        </div>
        <div className="app-card rounded-[var(--radius-md)] p-4">
          <p className="eyebrow">permissoes</p>
          <p className="mt-2 break-words text-sm leading-5 text-[color:var(--muted-strong)]">
            {connector.scopes.map(scopeLabel).join(", ")}
          </p>
        </div>
        <div className="app-card rounded-[var(--radius-md)] p-4">
          <p className="eyebrow">conexao</p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            {connector.oauthImplemented ? "Disponivel" : "Indisponivel"}
          </p>
        </div>
      </div>

      {connector.state === "connected" ? (
        <dl className="mt-4 grid gap-3 rounded-[var(--radius-md)] border border-[rgba(121,232,132,0.24)] bg-[rgba(121,232,132,0.055)] p-4 md:grid-cols-3">
          <MetaItem label="rede" value="Instagram" />
          <MetaItem label="situacao" value={connectionStatusLabel(connector.connection.status)} />
          <MetaItem label="conectado em" value={formatDate(connector.connection.connectedAt)} />
          <MetaItem label="ultima atualizacao" value={formatDate(connector.connection.updatedAt)} />
        </dl>
      ) : connector.missingRequirements.length > 0 ? (
        <div
          className={cn(
            "mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm leading-6",
            connector.state === "configuration_error"
              ? "border-[rgba(255,111,97,0.28)] bg-[rgba(255,111,97,0.06)] text-[color:var(--coral)]"
              : "border-[rgba(64,224,208,0.24)] bg-[rgba(64,224,208,0.055)] text-[color:var(--aqua)]",
          )}
        >
          Para ativar:{" "}
          <span className="font-mono text-xs">{connector.missingRequirements.join(", ")}</span>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-md)] border border-[rgba(237, 73, 86,0.24)] bg-[rgba(237, 73, 86,0.055)] px-4 py-3 text-sm leading-6 text-[color:var(--acid)] md:flex-row md:items-center md:justify-between">
          <span>Tudo pronto para autorizacao. A chave da Meta continua protegida.</span>
          {connector.canStartConnection && connector.startUrl ? (
            <a
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[rgba(237, 73, 86,0.34)] bg-[rgba(237, 73, 86,0.1)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)] transition hover:bg-[rgba(237, 73, 86,0.16)]"
              href={connector.startUrl}
            >
              Conectar Instagram
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}

function SourceRow({ source }: { source: TrendSourceRecord }) {
  return (
    <article className="app-card-interactive rounded-[var(--radius-md)] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                sourceStatusClass[source.status],
              )}
            >
              {sourceStatusLabel[source.status]}
            </span>
            <span className="rounded-full border border-[rgba(64,224,208,0.28)] bg-[rgba(64,224,208,0.07)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--aqua)]">
              {source.platform} / {sourceTypeLabel[source.sourceType]}
            </span>
          </div>
          <h3 className="mt-3 break-words text-lg font-semibold leading-tight">{source.title}</h3>
        </div>
        <a
          className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-[rgba(64,224,208,0.32)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--aqua)] transition hover:border-[rgba(64,224,208,0.5)] hover:bg-[rgba(64,224,208,0.08)]"
          href={source.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir fonte
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-4 rounded-[var(--radius-sm)] border border-[rgba(239,233,220,0.1)] bg-[rgba(0,0,0,0.22)] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">Link da fonte</p>
        <p className="mt-1 break-all font-mono text-xs leading-5 text-[color:var(--muted-strong)]">
          {source.sourceUrl}
        </p>
      </div>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetaItem label="região" value={source.region} mono />
        <MetaItem label="categoria" value={source.category} mono />
        <MetaItem label="última verificação" value={formatDate(source.lastCheckedAt)} mono />
        <MetaItem label="criado em" value={formatDate(source.createdAt)} mono />
        <MetaItem label="atualizado em" value={formatDate(source.updatedAt)} mono />
      </dl>
    </article>
  );
}

export default async function SourcesPage() {
  const context = await requireTenantContext();
  const data = await getSourcesConnectorsData(context);
  const instagramConnector = data.connectors[0];

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-50" aria-hidden="true" />

      <section className="relative mx-auto grid w-full max-w-[1500px] items-start gap-6 px-4 py-5 md:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="app-hero rounded-[var(--radius-lg)] p-5 lg:sticky lg:top-5">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)]" href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            command center
          </Link>

          <div className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(237, 73, 86,0.28)] bg-[rgba(237, 73, 86,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Fontes e contas
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-tight">Fontes reais conectadas</h1>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
              Controle as contas e fontes que alimentam o radar. Nenhum dado aparece como real sem autorizacao ou origem validada.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            <div className="app-rail-card rounded-[var(--radius-md)] p-4">
              <p className="eyebrow">ambiente</p>
              <p className="mt-2 break-words font-semibold">{data.tenant.workspaceName}</p>
              <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">{data.tenant.workspaceSlug}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="app-rail-card rounded-[var(--radius-md)] p-3">
                <p className="metric-cell-label">fontes</p>
                <p className="metric-value-xl mt-2">{data.stats.totalSources}</p>
              </div>
              <div className="app-rail-card rounded-[var(--radius-md)] p-3">
                <p className="metric-cell-label">ativas</p>
                <p className="metric-value-xl mt-2 text-[color:var(--success)]">{data.stats.activeSources}</p>
              </div>
              <div className="app-rail-card rounded-[var(--radius-md)] p-3">
                <p className="metric-cell-label">sem leitura</p>
                <p className="metric-value-xl mt-2 text-[color:var(--gold)]">{data.stats.uncheckedSources}</p>
              </div>
            </div>
            <div className="app-rail-card rounded-[var(--radius-md)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                uso seguro
              </div>
              <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
                Sem coleta nao autorizada, sem acesso falso e sem trend ficticia. Se uma fonte falha, o produto mostra a falha.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <ConnectorStatusCard connector={instagramConnector} />

          <section className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  Radar de fontes
                </div>
                <h2 className="mt-3 text-2xl font-semibold">Fontes que alimentam o radar</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                  Lista de origens reais usadas para formar sinais, alertas e evidencias.
                </p>
              </div>
              <span className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {data.stats.activeSources} fontes ativas
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {data.trendSources.length > 0 ? (
                data.trendSources.map((source) => <SourceRow key={source.id} source={source} />)
              ) : (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(64,224,208,0.22)] bg-[rgba(64,224,208,0.045)] p-8 text-center">
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-[rgba(64,224,208,0.24)] bg-[rgba(64,224,208,0.06)]">
                    <Database className="h-5 w-5 text-[color:var(--aqua)]" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">Nenhuma fonte ativa ainda</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:var(--muted)]">
                    Conecte uma conta, adicione uma fonte oficial ou importe dados licenciados para iniciar o radar.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
