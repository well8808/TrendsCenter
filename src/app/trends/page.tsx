import Link from "next/link";
import {
  ArrowDownUp,
  ArrowLeft,
  DatabaseZap,
  FileInput,
  Gauge,
  History,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { ingestTrendVideosAction } from "@/app/trends/actions";
import { requireTenantContext } from "@/lib/auth/session";
import { getTrendSearchData } from "@/lib/trends/search";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value?: string) {
  return value ? dateFormatter.format(new Date(value)) : "sem data";
}

function pillTone(score: number) {
  if (score >= 78) {
    return "border-[rgba(199,255,93,0.34)] bg-[rgba(199,255,93,0.1)] text-[color:var(--acid)]";
  }

  if (score >= 52) {
    return "border-[rgba(64,224,208,0.34)] bg-[rgba(64,224,208,0.1)] text-[color:var(--aqua)]";
  }

  return "border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] text-[color:var(--muted-strong)]";
}

const controlClass =
  "app-control rounded-[var(--radius-sm)] px-3 py-3 text-sm outline-none placeholder:text-[color:var(--muted)]";

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

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />

      <section className="relative mx-auto grid w-full max-w-[1760px] items-start gap-6 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 space-y-7">
          <header className="app-hero overflow-hidden rounded-[var(--radius-lg)] p-5 md:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)]" href="/">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  command center
                </Link>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgba(199,255,93,0.3)] bg-[rgba(199,255,93,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                    trend search core
                  </span>
                  <span className="rounded-full border border-[rgba(64,224,208,0.28)] bg-[rgba(64,224,208,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--aqua)]">
                    {context.workspaceName}
                  </span>
                </div>
                <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] md:text-6xl">
                  Buscar trends indexadas
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:var(--muted-strong)] md:text-base">
                  Videos, creators, sons e hashtags persistidos com snapshot temporal e fonte rastreavel.
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[500px]">
                {[
                  ["videos", data.stats.total],
                  ["BR", data.stats.br],
                  ["US", data.stats.us],
                  ["score med.", data.stats.avgScore],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[var(--radius-md)] border border-[rgba(239,233,220,0.13)] bg-[rgba(0,0,0,0.18)] p-3">
                    <p className="eyebrow">{label}</p>
                    <p className="metric-number mt-2 text-3xl font-semibold leading-none">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {(params.status || params.error) && (
              <div
                className={cn(
                  "mt-5 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
                  params.error
                    ? "border-[rgba(255,111,97,0.34)] bg-[rgba(255,111,97,0.08)] text-[color:var(--coral)]"
                    : "border-[rgba(199,255,93,0.3)] bg-[rgba(199,255,93,0.08)] text-[color:var(--acid)]",
                )}
              >
                {params.error ?? params.status}
              </div>
            )}
            <form className="mt-7 grid gap-3 rounded-[var(--radius-lg)] border border-[rgba(239,233,220,0.13)] bg-[rgba(0,0,0,0.22)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] xl:grid-cols-[minmax(0,1fr)_150px_180px_120px]" action="/trends">
              <label className={`${controlClass} flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border-transparent bg-[rgba(255,255,255,0.04)]`}>
                <Search className="h-4 w-4 text-[color:var(--muted)]" aria-hidden="true" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--muted)]"
                  name="q"
                  defaultValue={data.params.query}
                  placeholder="keyword, @creator, #hashtag, som..."
                />
              </label>
              <select
                className={controlClass}
                name="market"
                defaultValue={data.params.market}
              >
                <option value="ALL">Todos mercados</option>
                <option value="BR">Brasil</option>
                <option value="US">EUA</option>
              </select>
              <select
                className={controlClass}
                name="sort"
                defaultValue={data.params.sort}
              >
                <option value="score">Trend score</option>
                <option value="growth">Crescimento</option>
                <option value="recency">Recencia</option>
              </select>
              <button className="min-h-[var(--control-height)] rounded-[var(--radius-sm)] border border-[rgba(199,255,93,0.4)] bg-[rgba(199,255,93,0.12)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.18)]">
                buscar
              </button>
            </form>
          </header>

          <section className="grid gap-3">
            {data.results.length === 0 ? (
              <div className="app-panel rounded-[var(--radius-lg)] border-dashed p-10 text-center">
                <Sparkles className="mx-auto h-7 w-7 text-[color:var(--muted)]" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-semibold">Nenhuma trend indexada nesse recorte</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                  A busca permanece vazia ate existir ingestao manual/oficial com fonte e evidencia rastreavel.
                </p>
              </div>
            ) : (
              data.results.map((video) => (
                <Link
                  key={video.id}
                  href={`/trends/${video.id}`}
                  className="app-card-interactive group overflow-hidden rounded-[var(--radius-lg)] p-0"
                >
                  <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]", pillTone(video.trendScore))}>
                          score {video.trendScore}
                        </span>
                        <span className="app-pill rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]">
                          {video.market}
                        </span>
                        <span className="app-pill rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]">
                          {video.source.origin}
                        </span>
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold leading-tight transition group-hover:text-[color:var(--aqua)]">
                        {video.title}
                      </h2>
                      {video.caption && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--muted-strong)]">{video.caption}</p>}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                        {video.creator && <span>@{video.creator.handle}</span>}
                        {video.sound && <span>{video.sound.title}</span>}
                        {video.hashtags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-px border-t border-[color:var(--line)] bg-[rgba(239,233,220,0.08)] sm:grid-cols-6 xl:grid-cols-3 xl:border-l xl:border-t-0">
                      {[
                        ["views", formatNumber(video.metrics.views)],
                        ["growth", formatNumber(video.growthViews)],
                        ["vel.", video.velocityScore],
                        ["acel.", video.accelerationScore],
                        ["snap", video.snapshotCount],
                        ["evid.", video.evidenceCount],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-[rgba(8,8,7,0.86)] p-3">
                          <p className="eyebrow text-[10px]">{label}</p>
                          <p className="metric-number mt-1 text-base font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </section>
        </div>

        <aside className="min-w-0 opacity-95 lg:sticky lg:top-5 lg:h-[calc(100dvh-40px)]">
          <div className="scrollbar-soft grid h-full content-start gap-4 overflow-y-auto overscroll-contain pb-10 pr-1">
            <section className="app-rail-card rounded-[var(--radius-lg)] p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
                <DatabaseZap className="h-4 w-4" aria-hidden="true" />
                ingestao
              </div>
              <h2 className="mt-3 text-lg font-semibold">Indexar lote rastreavel</h2>
              <form action={ingestTrendVideosAction} className="mt-4 grid gap-3">
                <input className={controlClass} name="sourceTitle" placeholder="Fonte / lote" required />
                <input className={controlClass} name="sourceUrl" placeholder="URL da fonte" type="url" />
                <div className="grid grid-cols-2 gap-2">
                  <select className={controlClass} name="market" defaultValue="BR">
                    <option value="BR">BR</option>
                    <option value="US">US</option>
                  </select>
                  <select className={controlClass} name="sourceOrigin" defaultValue="MANUAL">
                    <option value="MANUAL">manual</option>
                    <option value="OFFICIAL">oficial</option>
                    <option value="OWNED">proprio</option>
                  </select>
                </div>
                <select className={controlClass} name="sourceKind" defaultValue="MANUAL_RESEARCH">
                  <option value="MANUAL_RESEARCH">Manual research</option>
                  <option value="CREATIVE_CENTER_TRENDS">Creative Center</option>
                  <option value="TOP_ADS">Top Ads</option>
                  <option value="KEYWORD_INSIGHTS">Keyword Insights</option>
                  <option value="COMMERCIAL_MUSIC_LIBRARY">Commercial Music Library</option>
                  <option value="OWNED_UPLOAD">Owned upload</option>
                </select>
                <textarea
                  className="min-h-56 resize-y rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[var(--control-bg)] px-3 py-3 font-mono text-xs leading-5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[rgba(64,224,208,0.58)]"
                  name="payloadJson"
                  placeholder='{"videos":[{"title":"","metrics":{"views":0},"creator":{"handle":""},"sound":{"title":""},"hashtags":[],"evidence":{"title":"","note":""}}]}'
                  required
                />
                <button className="inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(199,255,93,0.4)] bg-[rgba(199,255,93,0.12)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)] transition hover:bg-[rgba(199,255,93,0.18)]">
                  <FileInput className="h-4 w-4" aria-hidden="true" />
                  indexar
                </button>
              </form>
            </section>

            <section className="app-rail-card rounded-[var(--radius-lg)] p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                score v0.1
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  ["crescimento", "views atuais contra snapshot anterior"],
                  ["velocidade", "crescimento por janela temporal"],
                  ["aceleracao", "mudanca de velocidade"],
                  ["recencia", "idade do video no momento observado"],
                  ["consistencia", "snapshots + evidencias"],
                ].map(([label, body]) => (
                  <div key={label} className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[var(--radius-lg)] border border-[rgba(199,255,93,0.2)] bg-[rgba(199,255,93,0.055)] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                safe mode
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                Sem scraping e sem insights sem fonte. Entradas bloqueadas continuam registradas como falha operacional.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                <History className="h-4 w-4" aria-hidden="true" />
                ultimo indice: {formatDate(data.stats.latestIndexedAt)}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
                ordenacao: {data.params.sort}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                mercado: {data.params.market}
              </div>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
