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
import { TrendStatsDeck } from "@/components/trend-stats-deck";
import { TrendVideoGrid, type TrendVideoView } from "@/components/trend-video-grid";
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

const controlClass =
  "app-control rounded-[var(--radius-sm)] px-3 py-3 text-sm outline-none placeholder:text-[color:var(--muted)]";

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
  }));

  const stats = [
    { label: "vídeos", value: data.stats.total, tone: "acid" as const },
    { label: "BR", value: data.stats.br, tone: "aqua" as const },
    { label: "US", value: data.stats.us, tone: "gold" as const },
    { label: "score med.", value: data.stats.avgScore, tone: "violet" as const },
  ];

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />

      <section className="relative mx-auto grid w-full max-w-[1760px] items-start gap-6 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 space-y-7">
          <header className="app-hero scan-line relative overflow-hidden rounded-[var(--radius-lg)] p-5 md:p-7">
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <Link
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)] transition hover:gap-3"
                  href="/"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  command center
                </Link>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(199,255,93,0.32)] bg-[rgba(199,255,93,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                    <span className="live-dot" aria-hidden="true" />
                    trend search core
                  </span>
                  <span className="rounded-full border border-[rgba(64,224,208,0.3)] bg-[rgba(64,224,208,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
                    {context.workspaceName}
                  </span>
                  <span className="hidden items-center gap-1.5 rounded-full border border-[color:var(--line)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)] sm:inline-flex">
                    tenant / {context.workspaceName.toLowerCase()}
                  </span>
                </div>

                <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
                  <span className="terminal-caret">Buscar trends indexadas</span>
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:var(--muted-strong)] md:text-base">
                  Vídeos, creators, sons e hashtags persistidos com snapshot temporal e fonte rastreável.
                  Ingestão manual ou oficial — sem scraping, sem dado sem origem.
                </p>
              </div>

              <TrendStatsDeck stats={stats} />
            </div>

            {(params.status || params.error) && (
              <div
                className={cn(
                  "relative mt-5 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
                  params.error
                    ? "border-[rgba(255,111,97,0.34)] bg-[rgba(255,111,97,0.08)] text-[color:var(--coral)]"
                    : "border-[rgba(199,255,93,0.3)] bg-[rgba(199,255,93,0.08)] text-[color:var(--acid)]",
                )}
              >
                {params.error ?? params.status}
              </div>
            )}

            <form
              className="relative mt-7 grid gap-3 rounded-[var(--radius-lg)] border border-[rgba(239,233,220,0.13)] bg-[rgba(0,0,0,0.28)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] xl:grid-cols-[minmax(0,1fr)_150px_180px_120px]"
              action="/trends"
            >
              <label className={`${controlClass} flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border-transparent bg-[rgba(255,255,255,0.04)]`}>
                <Search className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--muted)]"
                  name="q"
                  defaultValue={data.params.query}
                  placeholder="keyword, @creator, #hashtag, som..."
                />
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)] sm:inline">
                  ⌘ K
                </span>
              </label>
              <select className={controlClass} name="market" defaultValue={data.params.market}>
                <option value="ALL">Todos mercados</option>
                <option value="BR">Brasil</option>
                <option value="US">EUA</option>
              </select>
              <select className={controlClass} name="sort" defaultValue={data.params.sort}>
                <option value="score">Trend score</option>
                <option value="growth">Crescimento</option>
                <option value="recency">Recência</option>
              </select>
              <button type="submit" className="min-h-[var(--control-height)] rounded-[var(--radius-sm)] border border-[rgba(199,255,93,0.42)] bg-[rgba(199,255,93,0.14)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.2)]">
                buscar
              </button>
            </form>
          </header>

          <TrendVideoGrid results={videos} />
        </div>

        <aside className="min-w-0 opacity-95 lg:sticky lg:top-5 lg:h-[calc(100dvh-40px)]">
          <div className="scrollbar-soft grid h-full content-start gap-4 overflow-y-auto overscroll-contain pb-10 pr-1">
            <IngestionRequestForm />

            <JobRunsFeed
              initialData={initialJobRuns}
              initialUpdatedAt={initialJobRunsFetchedAt}
              queue="ingestion"
              limit={12}
            />

            <section className="app-rail-card rounded-[var(--radius-lg)] p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                score v0.1
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  ["crescimento", "views atuais contra snapshot anterior", "acid"],
                  ["velocidade", "crescimento por janela temporal", "aqua"],
                  ["aceleração", "mudança de velocidade", "gold"],
                  ["recência", "idade do vídeo no momento observado", "violet"],
                  ["consistência", "snapshots + evidências", "aqua"],
                ].map(([label, body, tone]) => (
                  <div
                    key={label}
                    className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] p-3"
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.16em]"
                      style={{ color: `var(--${tone})` }}
                    >
                      {label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(199,255,93,0.2)] bg-[rgba(199,255,93,0.055)] p-5">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-[rgba(199,255,93,0.14)] blur-3xl"
              />
              <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                safe mode
              </div>
              <p className="relative mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                Sem scraping e sem insights sem fonte. Entradas bloqueadas continuam registradas como falha operacional.
              </p>
              <div className="relative mt-4 grid gap-2 text-xs text-[color:var(--muted)]">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />
                  <span className="font-mono">
                    último índice: {formatDate(data.stats.latestIndexedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="h-4 w-4 text-[color:var(--aqua)]" aria-hidden="true" />
                  <span className="font-mono uppercase tracking-[0.14em]">ordenação: {data.params.sort}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[color:var(--acid)]" aria-hidden="true" />
                  <span className="font-mono uppercase tracking-[0.14em]">mercado: {data.params.market}</span>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
