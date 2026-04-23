import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AudioLines,
  BarChart3,
  ExternalLink,
  Gauge,
  Hash,
  LineChart,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { requireTenantContext } from "@/lib/auth/session";
import { getTrendDetail } from "@/lib/trends/search";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const compactFormatter = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatNumber(value: number) {
  return compactFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function scoreTone(score: number) {
  if (score >= 78) {
    return "text-[color:var(--acid)]";
  }

  if (score >= 52) {
    return "text-[color:var(--aqua)]";
  }

  return "text-[color:var(--muted-strong)]";
}

export default async function TrendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireTenantContext();
  const { id } = await params;
  const trend = await getTrendDetail(context, id);

  if (!trend) {
    notFound();
  }

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />

      <section className="relative mx-auto grid w-full max-w-[1560px] items-start gap-6 px-4 py-4 md:px-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <header className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)]" href="/trends">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              voltar para busca
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[rgba(199,255,93,0.32)] bg-[rgba(199,255,93,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                {trend.market}
              </span>
              <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
                {trend.origin}
              </span>
              <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
                {trend.source.kind}
              </span>
            </div>
            <h1 className="mt-4 max-w-5xl text-3xl font-semibold leading-tight md:text-5xl">{trend.title}</h1>
            {trend.caption && <p className="mt-4 max-w-4xl text-sm leading-6 text-[color:var(--muted-strong)]">{trend.caption}</p>}
            {trend.url && (
              <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)]" href={trend.url} target="_blank" rel="noreferrer">
                abrir fonte do video
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </header>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["trend score", trend.trendScore, "score"],
              ["views", formatNumber(trend.metrics.views), "views"],
              ["growth", formatNumber(trend.growthViews), "growth"],
              ["snapshots", trend.snapshotCount, "snap"],
            ].map(([label, value, key]) => (
              <div key={key} className="app-card rounded-[var(--radius-lg)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
                <p className={cn("mt-3 font-mono text-3xl font-semibold", key === "score" && scoreTone(trend.trendScore))}>{value}</p>
              </div>
            ))}
          </section>

          <section className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
              <LineChart className="h-4 w-4" aria-hidden="true" />
              timeline
            </div>
            <div className="mt-5 grid gap-3">
              {trend.timeline.map((point) => (
                <div key={point.id} className="app-card grid gap-3 rounded-[var(--radius-md)] p-4 md:grid-cols-[180px_minmax(0,1fr)_120px]">
                  <div className="text-sm text-[color:var(--muted)]">{formatDate(point.observedAt)}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">views</p>
                      <p className="mt-1 font-mono text-sm">{formatNumber(point.views)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">growth</p>
                      <p className="mt-1 font-mono text-sm">{formatNumber(point.growthViews)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">vel/acel</p>
                      <p className="mt-1 font-mono text-sm">{point.velocityScore}/{point.accelerationScore}</p>
                    </div>
                  </div>
                  <p className={cn("font-mono text-2xl font-semibold md:text-right", scoreTone(point.score))}>{point.score}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              evidencias
            </div>
            <div className="mt-5 grid gap-3">
              {trend.evidence.map((item) => (
                <div key={item.id} className="app-card rounded-[var(--radius-md)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold">{item.title}</h2>
                    <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
                      {item.confidence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">{item.note}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted-strong)]">
                    <span>{item.sourceTitle}</span>
                    <span>{item.origin}</span>
                    <span>{formatDate(item.capturedAt)}</span>
                    {item.url && (
                      <a className="font-semibold text-[color:var(--aqua)]" href={item.url} target="_blank" rel="noreferrer">
                        abrir
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-4 lg:h-[calc(100dvh-32px)]">
          <div className="scrollbar-soft grid h-full content-start gap-4 overflow-y-auto overscroll-contain pb-10 pr-1">
            <section className="rounded-[var(--radius-lg)] border border-[rgba(199,255,93,0.24)] bg-[rgba(199,255,93,0.07)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                justificativa
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">{trend.scoreExplanation}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ["velocidade", trend.velocityScore],
                  ["aceleracao", trend.accelerationScore],
                  ["recencia", trend.recencyScore],
                  ["consist.", trend.consistencyScore],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</p>
                    <p className="mt-1 font-mono text-xl">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="app-card rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
                <UserRoundCheck className="h-4 w-4" aria-hidden="true" />
                creator
              </div>
              <p className="mt-3 text-lg font-semibold">{trend.creator ? `@${trend.creator.handle}` : "sem creator vinculado"}</p>
              {trend.creator?.displayName && <p className="mt-1 text-sm text-[color:var(--muted)]">{trend.creator.displayName}</p>}
              {trend.creator?.followerCount && <p className="mt-3 font-mono text-2xl">{formatNumber(trend.creator.followerCount)}</p>}
            </section>

            <section className="app-card rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                <AudioLines className="h-4 w-4" aria-hidden="true" />
                sound
              </div>
              <p className="mt-3 text-lg font-semibold">{trend.sound?.title ?? "sem som vinculado"}</p>
              {trend.sound?.authorName && <p className="mt-1 text-sm text-[color:var(--muted)]">{trend.sound.authorName}</p>}
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Comercial: {trend.sound?.isCommerciallyUsable ? "sim" : "nao informado"}
              </p>
            </section>

            <section className="app-card rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
                <Hash className="h-4 w-4" aria-hidden="true" />
                hashtags
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {trend.hashtags.length ? trend.hashtags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[color:var(--muted-strong)]">{tag}</span>
                )) : <span className="text-sm text-[color:var(--muted)]">sem hashtags</span>}
              </div>
            </section>

            <section className="app-card rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                relacionados
              </div>
              <div className="mt-4 grid gap-2">
                {trend.related.length ? trend.related.map((item) => (
                  <Link key={item.id} href={`/trends/${item.id}`} className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-3 transition hover:border-[rgba(64,224,208,0.34)]">
                    <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">score {item.trendScore} - {formatNumber(item.metrics.views)} views</p>
                  </Link>
                )) : <p className="text-sm text-[color:var(--muted)]">sem relacionados suficientes</p>}
              </div>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
