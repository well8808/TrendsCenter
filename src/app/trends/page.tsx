import Link from "next/link";
import {
  ArrowDownUp,
  ArrowLeft,
  Gauge,
  History,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { IngestionRequestForm } from "@/components/ingestion-request-form";
import { JobRunsFeed } from "@/components/job-runs-feed";
import { ProviderReelsImportForm } from "@/components/provider-reels-import-form";
import { ReelsSearchAssistant } from "@/components/reels-search-assistant";
import { TrendStatsDeck } from "@/components/trend-stats-deck";
import { TrendVideoGrid, type TrendVideoView } from "@/components/trend-video-grid";
import { TrendEnergyField } from "@/components/viral-library/trend-energy-field";
import { ViralUniverseStage } from "@/components/viral-universe/viral-universe-stage";
import type { ViralReelNode, ViralUniverseStats } from "@/components/viral-universe/viral-scene-quality";
import { requireTenantContext } from "@/lib/auth/session";
import type { JobRunsListDto } from "@/lib/api";
import { listWorkspaceJobRuns } from "@/lib/services/jobs-service";
import { getTrendSearchData } from "@/lib/trends/search";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function formatDate(value?: string) {
  return value ? dateFormatter.format(new Date(value)) : "sem data";
}

function jobRunsUpdatedAt(data: JobRunsListDto) {
  return data.items.reduce((latest, job) => Math.max(latest, Date.parse(job.updatedAt)), 0) || undefined;
}

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; market?: string; sort?: string; status?: string; error?: string }>;
}) {
  const context = await requireTenantContext();
  const params = await searchParams;
  const data = await getTrendSearchData(context, {
    query: params.q ?? "",
    market: params.market === "BR" || params.market === "US" ? params.market : "ALL",
    sort: params.sort === "growth" || params.sort === "recency" ? params.sort : "score",
  });

  // Hidrata o JobRunsFeed com SSR para evitar flicker e dar leitura imediata.
  // TenantContext e ApiTenantContext são compatíveis estruturalmente.
  const initialJobRuns: JobRunsListDto = await listWorkspaceJobRuns(
    context,
    new URLSearchParams({ limit: "12" }),
  ).catch(() => ({ items: [] }));
  const initialJobRunsFetchedAt = jobRunsUpdatedAt(initialJobRuns);

  const videos: TrendVideoView[] = data.results.map((video) => ({
    id: video.id,
    title: video.title,
    caption: video.caption,
    thumbnailUrl: video.thumbnailUrl,
    media: video.media,
    market: video.market,
    origin: video.source.origin,
    trendScore: video.trendScore,
    growthViews: video.growthViews,
    velocityScore: video.velocityScore,
    accelerationScore: video.accelerationScore,
    snapshotCount: video.snapshotCount,
    evidenceCount: video.evidenceCount,
    views: video.metrics.views,
    creator: video.creator?.handle,
    sound: video.sound?.title,
    hashtags: video.hashtags,
    decision: video.decision,
    contentDraft: video.contentDraft,
  }));
  const viralReels: ViralReelNode[] = videos.map((video) => ({
    id: video.id,
    title: video.title,
    market: video.market,
    score: video.trendScore,
    views: video.views,
    growth: video.growthViews,
    velocity: video.velocityScore,
    evidenceCount: Math.max(video.evidenceCount, video.snapshotCount),
    creator: video.creator,
    sourceLabel: video.origin,
    thumbnailUrl: video.thumbnailUrl,
    media: video.media,
    tags: video.hashtags,
  }));
  const universeStats: ViralUniverseStats = {
    reels: data.stats.total,
    signals: 0,
    sources: new Set(videos.map((video) => video.origin)).size,
    evidence: viralReels.reduce((total, reel) => total + reel.evidenceCount, 0),
    avgScore: data.stats.avgScore,
  };

  const stats = [
    { label: "Reels", value: data.stats.total, tone: "acid" as const },
    { label: "BR", value: data.stats.br, tone: "aqua" as const },
    { label: "US", value: data.stats.us, tone: "gold" as const },
    { label: "score med.", value: data.stats.avgScore, tone: "violet" as const },
  ];

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <TrendEnergyField mode="library" reels={data.stats.total} evidence={universeStats.evidence} />
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />

      <section className="relative mx-auto grid w-full max-w-[1760px] items-start gap-6 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 space-y-7">
          <header className="app-hero scan-line relative overflow-hidden rounded-[var(--radius-lg)] p-5 md:p-7">
            {/* Atmospheric gradient */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 70% 50% at 100% 0%, rgba(131,58,180,0.10) 0%, transparent 55%),
                  radial-gradient(ellipse 50% 40% at 0% 100%, rgba(225,48,108,0.08) 0%, transparent 50%),
                  radial-gradient(ellipse 80% 60% at 50% 50%, rgba(247,119,55,0.03) 0%, transparent 65%)
                `,
              }}
            />
            <div
              className="pointer-events-none absolute right-0 top-0 z-0 hidden h-[260px] w-[470px] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(12,12,10,0.04)_52%,rgba(12,12,10,0.22)_100%)] lg:block"
              aria-hidden="true"
            />
            <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <Link
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)] transition hover:gap-3"
                  href="/"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  sala de sinais
                </Link>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  <span className="inline-flex items-center gap-2 text-[color:var(--hot)]">
                    <span className="live-dot" aria-hidden="true" />
                    arquivo vivo
                  </span>
                  <span aria-hidden="true" className="text-[color:var(--line-strong)]">/</span>
                  <span className="font-mono text-[color:var(--muted-strong)]">
                    {context.workspaceName.toLowerCase()}
                  </span>
                </div>

                <nav className="mt-5 flex flex-wrap items-center gap-2" aria-label="Areas principais">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.1)] px-3 py-1.5 text-[11px] font-medium text-[color:var(--foreground)]">
                    Biblioteca Viral
                    <span className="metric-number text-[color:var(--hot)]">{data.stats.total}</span>
                  </span>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(64,224,208,0.18)] bg-[rgba(64,224,208,0.045)] px-3 py-1.5 text-[11px] font-medium text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.34)] hover:text-[color:var(--foreground)]"
                  >
                    Sala de Sinais
                  </Link>
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(247,119,55,0.2)] bg-[rgba(247,119,55,0.055)] px-3 py-1.5 text-[11px] font-medium text-[color:var(--muted-strong)] transition hover:border-[rgba(247,119,55,0.36)] hover:text-[color:var(--foreground)]"
                  >
                    Estudio de Conteudo
                  </Link>
                  <a
                    href="#coleta"
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(255,255,255,0.025)] px-3 py-1.5 text-[11px] font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
                  >
                    Fontes e Coleta
                  </a>
                </nav>

                <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.02em] md:text-[3.5rem]">
                  Arquivo vivo de{" "}
                  <span className="gradient-text-ig">cultura viral</span>
                </h1>
                <p className="mt-4 max-w-2xl text-[14px] leading-6 text-[color:var(--muted)] md:text-[15px]">
                  Reels reais entram como artefatos: creator, som, metricas e provas preservadas. Os melhores achados alimentam a Sala de Sinais para virar decisao.
                </p>
                <ViralUniverseStage
                  mode="library"
                  reels={viralReels}
                  signals={[]}
                  stats={universeStats}
                  label="Arquivo vivo"
                  className="mt-5 h-[174px] w-full lg:absolute lg:right-4 lg:top-5 lg:z-[1] lg:mt-0 lg:h-[250px] lg:w-[430px] lg:opacity-95 2xl:h-[280px] 2xl:w-[500px]"
                />
              </div>

              <TrendStatsDeck stats={stats} />
            </div>

            {(params.status || params.error) && (
              <div
                className={cn(
                  "relative mt-5 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
                  params.error
                    ? "border-[rgba(255,111,97,0.34)] bg-[rgba(255,111,97,0.08)] text-[color:var(--coral)]"
                    : "border-[rgba(237, 73, 86,0.3)] bg-[rgba(237, 73, 86,0.08)] text-[color:var(--acid)]",
                )}
              >
                {params.error ?? params.status}
              </div>
            )}

            <form
              className="relative mt-7 overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(239,233,220,0.14)] bg-[rgba(0,0,0,0.32)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              action="/trends"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(239,233,220,0.2)] to-transparent" />
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_148px_176px_112px]">
                <label className="flex min-w-0 items-center gap-2.5 border-b border-[rgba(239,233,220,0.1)] px-4 py-3 xl:border-b-0 xl:border-r xl:border-[rgba(239,233,220,0.1)]">
                  <Search className="h-4 w-4 shrink-0 text-[color:var(--muted)]" aria-hidden="true" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--muted)]"
                    name="q"
                    defaultValue={data.params.query}
                    placeholder="Buscar artefato, @creator, #hashtag, audio..."
                  />
                  <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)] sm:inline">
                    ⌘ K
                  </span>
                </label>
                <select
                  className="app-control rounded-none border-0 border-b border-r border-[rgba(239,233,220,0.1)] bg-transparent px-4 py-3 text-sm xl:border-b-0"
                  name="market"
                  defaultValue={data.params.market}
                >
                  <option value="ALL">Todos mercados</option>
                  <option value="BR">Brasil</option>
                  <option value="US">EUA</option>
                </select>
                <select
                  className="app-control rounded-none border-0 border-b border-r border-[rgba(239,233,220,0.1)] bg-transparent px-4 py-3 text-sm xl:border-b-0"
                  name="sort"
                  defaultValue={data.params.sort}
                >
                  <option value="score">Potencial</option>
                  <option value="growth">Crescimento</option>
                  <option value="recency">Recência</option>
                </select>
                <button
                  type="submit"
                  className="flex min-h-[var(--control-height)] items-center justify-center gap-2 bg-[rgba(237, 73, 86,0.12)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)] transition hover:bg-[rgba(237, 73, 86,0.18)]"
                >
                  buscar
                </button>
              </div>
            </form>
          </header>

          <TrendVideoGrid results={videos} />
        </div>

        <aside id="coleta" className="min-w-0 scroll-mt-6 opacity-95 lg:sticky lg:top-5 lg:h-[calc(100dvh-40px)]">
          <div className="scrollbar-soft grid h-full content-start gap-4 overflow-y-auto overscroll-contain pb-10 pr-1">
            <ReelsSearchAssistant />

            <ProviderReelsImportForm />

            <IngestionRequestForm />

            <JobRunsFeed
              initialData={initialJobRuns}
              initialUpdatedAt={initialJobRunsFetchedAt}
              queue="ingestion"
              limit={12}
            />

            <section className="app-rail-card rounded-[var(--radius-lg)] p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
                <Gauge className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                como o arquivo ganha energia
              </div>
              <ol className="mt-5 grid gap-4">
                {[
                  { label: "crescimento", body: "visualizacoes atuais contra leitura anterior" },
                  { label: "velocidade", body: "ritmo de crescimento observado" },
                  { label: "aceleracao", body: "mudanca de ritmo entre leituras" },
                  { label: "recência", body: "idade do Reel no momento observado" },
                  { label: "consistencia", body: "leituras e evidencias conectadas" },
                ].map(({ label, body }, idx) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-[10px] tabular-nums text-[color:var(--muted)]">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[color:var(--foreground)]">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-5 text-[color:var(--muted)]">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="relative rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.012)] p-5">
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--hot)]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                uso seguro
              </div>
              <p className="mt-3 text-[13px] leading-6 text-[color:var(--muted-strong)]">
                Sem coleta nao autorizada e sem insight sem fonte. Conteudo adulto so entra como analise segura 18+; entradas bloqueadas aparecem como falha.
              </p>
              <dl className="mt-5 grid gap-2.5 text-[11px] text-[color:var(--muted)]">
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                  <dt className="sr-only">ultima leitura</dt>
                  <dd className="font-mono">ultima leitura: {formatDate(data.stats.latestIndexedAt)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                  <dt className="sr-only">ordem</dt>
                  <dd className="font-mono">ordem: {data.params.sort}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                  <dt className="sr-only">mercado</dt>
                  <dd className="font-mono">mercado: {data.params.market}</dd>
                </div>
              </dl>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
