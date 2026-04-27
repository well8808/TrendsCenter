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

function scoreTone(score: number): { text: string; border: string; bg: string; glow: string } {
  if (score >= 78) return {
    text: "text-[color:var(--acid)]",
    border: "border-[rgba(199,255,93,0.3)]",
    bg: "bg-[rgba(199,255,93,0.07)]",
    glow: "rgba(199,255,93,0.35)",
  };
  if (score >= 52) return {
    text: "text-[color:var(--gold)]",
    border: "border-[rgba(243,201,105,0.3)]",
    bg: "bg-[rgba(243,201,105,0.07)]",
    glow: "rgba(243,201,105,0.32)",
  };
  return {
    text: "text-[color:var(--aqua)]",
    border: "border-[rgba(64,224,208,0.28)]",
    bg: "bg-[rgba(64,224,208,0.06)]",
    glow: "rgba(64,224,208,0.28)",
  };
}

function confidenceTone(confidence: string) {
  const c = confidence.toLowerCase();
  if (c === "high") return "badge-high";
  if (c === "medium") return "badge-medium";
  return "badge-low";
}

export default async function TrendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireTenantContext();
  const { id } = await params;
  const trend = await getTrendDetail(context, id);

  if (!trend) {
    notFound();
  }

  const tone = scoreTone(trend.trendScore);

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />

      <section className="relative mx-auto grid w-full max-w-[1620px] items-start gap-6 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="min-w-0 space-y-5">

          {/* ── Hero header ── */}
          <header className="app-hero relative overflow-hidden rounded-[var(--radius-lg)] p-5 md:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
              style={{ background: tone.glow, opacity: 0.3 }}
            />
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)] transition hover:gap-3"
              href="/trends"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              voltar para busca
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
                  trend.market === "BR" ? "tag-acid" : "tag-aqua",
                )}
              >
                {trend.market}
              </span>
              <span className="tag-neutral rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em]">
                {trend.origin}
              </span>
              <span className="tag-neutral rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em]">
                {trend.source.kind}
              </span>
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_200px]">
              <div className="min-w-0">
                <h1 className="max-w-5xl text-4xl font-semibold leading-[1.02] tracking-tight md:text-5xl">
                  {trend.title}
                </h1>
                {trend.caption && (
                  <p className="mt-4 max-w-4xl text-sm leading-6 text-[color:var(--muted-strong)] md:text-base">
                    {trend.caption}
                  </p>
                )}
                {trend.url && (
                  <a
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)] transition hover:text-[color:var(--foreground)]"
                    href={trend.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    abrir fonte do vídeo
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>

              {/* Score card */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-[var(--radius-lg)] border p-5",
                  tone.border,
                  tone.bg,
                )}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
                  style={{ background: tone.glow, opacity: 0.4 }}
                />
                <p className={cn("eyebrow relative", tone.text)}>trend score</p>
                <p className={cn("score-hero relative mt-3", tone.text)}>
                  {trend.trendScore}
                </p>
                <p className="relative mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  /100
                </p>
                <p className="relative mt-4 text-xs leading-5 text-[color:var(--muted-strong)]">
                  {trend.scoreExplanation}
                </p>
              </div>
            </div>
          </header>

          {/* ── Quick metrics ── */}
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Métricas rápidas">
            {[
              { label: "views", value: formatNumber(trend.metrics.views), key: "views", tone: "text-[color:var(--foreground)]" },
              { label: "growth views", value: formatNumber(trend.growthViews), key: "growth", tone: "text-[color:var(--acid)]" },
              { label: "snapshots", value: trend.snapshotCount, key: "snap", tone: "text-[color:var(--aqua)]" },
            ].map(({ label, value, key, tone: t }) => (
              <div key={key} className="app-card-interactive relative overflow-hidden rounded-[var(--radius-lg)] p-5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(239,233,220,0.2)] to-transparent" />
                <p className="eyebrow">{label}</p>
                <p className={cn("metric-number mt-3 text-3xl font-semibold leading-none", t)}>{value}</p>
              </div>
            ))}
          </section>

          {/* ── Timeline ── */}
          <section className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
            <div className="section-head text-[color:var(--aqua)]">
              <LineChart className="h-4 w-4 shrink-0" aria-hidden="true" />
              timeline de snapshots
            </div>

            {trend.timeline.length === 0 ? (
              <p className="mt-5 text-sm text-[color:var(--muted-strong)]">Nenhum snapshot registrado.</p>
            ) : (
              <div className="timeline-track relative mt-5 grid gap-0 pl-7">
                {trend.timeline.map((point, i) => {
                  const ptone = scoreTone(point.score);
                  return (
                    <div
                      key={point.id}
                      className={cn(
                        "relative grid gap-4 rounded-[var(--radius-md)] p-4 transition-colors md:grid-cols-[190px_minmax(0,1fr)_80px]",
                        "hover:bg-[rgba(255,255,255,0.025)]",
                        i < trend.timeline.length - 1 && "border-b border-[rgba(239,233,220,0.07)]",
                      )}
                    >
                      {/* Timeline dot */}
                      <div
                        aria-hidden="true"
                        className="absolute -left-7 top-5 h-3.5 w-3.5 rounded-full border-2 border-[rgba(64,224,208,0.5)] bg-[rgba(7,7,6,0.96)]"
                        style={{ boxShadow: "0 0 10px rgba(64,224,208,0.35)" }}
                      />

                      <div className="flex items-center gap-2.5 text-sm text-[color:var(--muted)]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--aqua)]" aria-hidden="true" />
                        <span className="font-mono text-[11px] tracking-wide">
                          {formatDate(point.observedAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="metric-cell-label">views</p>
                          <p className="metric-cell-value mt-1">{formatNumber(point.views)}</p>
                        </div>
                        <div>
                          <p className="metric-cell-label">growth</p>
                          <p className="metric-cell-value mt-1 text-[color:var(--acid)]">{formatNumber(point.growthViews)}</p>
                        </div>
                        <div>
                          <p className="metric-cell-label">vel / acel</p>
                          <p className="metric-cell-value mt-1 text-[color:var(--aqua)]">
                            {point.velocityScore}/{point.accelerationScore}
                          </p>
                        </div>
                      </div>

                      <p className={cn("metric-number text-2xl font-semibold md:text-right md:self-center", ptone.text)}>
                        {point.score}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Evidências ── */}
          <section className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
            <div className="section-head text-[color:var(--gold)]">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              evidências
              <span className="ml-auto rounded-full border border-[rgba(243,201,105,0.3)] bg-[rgba(243,201,105,0.08)] px-2 py-0.5 font-mono text-[10px] text-[color:var(--gold)]">
                {trend.evidence.length}
              </span>
            </div>

            <div className="mt-5 grid gap-2.5">
              {trend.evidence.length === 0 ? (
                <p className="text-sm text-[color:var(--muted-strong)]">Nenhuma evidência registrada.</p>
              ) : (
                trend.evidence.map((item) => (
                  <div key={item.id} className="evidence-item rounded-[var(--radius-md)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-sm font-semibold leading-snug">{item.title}</h2>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                          confidenceTone(item.confidence),
                        )}
                      >
                        {item.confidence}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">{item.note}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--muted)]">
                      <span className="font-medium text-[color:var(--muted-strong)]">{item.sourceTitle}</span>
                      <span
                        className="rounded-full border border-[color:var(--line)] px-2 py-0.5 uppercase tracking-[0.12em]"
                      >
                        {item.origin}
                      </span>
                      <span className="font-mono">{formatDate(item.capturedAt)}</span>
                      {item.url && (
                        <a
                          className="font-semibold text-[color:var(--aqua)] transition hover:underline"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          abrir fonte ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* ── Aside rail ── */}
        <aside className="min-w-0 opacity-95 lg:sticky lg:top-5 lg:h-[calc(100dvh-40px)]">
          <div className="scrollbar-soft grid h-full content-start gap-4 overflow-y-auto overscroll-contain pb-10 pr-1">

            {/* Score breakdown */}
            <section className={cn("relative overflow-hidden rounded-[var(--radius-lg)] border p-5 shadow-[var(--shadow-lift)] backdrop-blur-2xl", tone.border, tone.bg)}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -bottom-12 h-40 w-40 rounded-full blur-3xl"
                style={{ background: tone.glow, opacity: 0.28 }}
              />
              <div className={cn("section-head relative", tone.text)}>
                <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
                breakdown do score
              </div>
              <p className="relative mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                {trend.scoreExplanation}
              </p>
              <div className="relative mt-4 grid grid-cols-2 gap-2">
                {[
                  ["velocidade", trend.velocityScore, tone.text],
                  ["aceleração", trend.accelerationScore, "text-[color:var(--gold)]"],
                  ["recência", trend.recencyScore, "text-[color:var(--aqua)]"],
                  ["consist.", trend.consistencyScore, "text-[color:var(--foreground)]"],
                ].map(([label, value, textClass]) => (
                  <div
                    key={String(label)}
                    className="rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] p-3"
                  >
                    <p className="metric-cell-label">{label}</p>
                    <p className={cn("metric-number mt-1 text-xl font-semibold", String(textClass))}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Creator */}
            <section className="app-rail-card rounded-[var(--radius-lg)] p-5">
              <div className="section-head text-[color:var(--aqua)]">
                <UserRoundCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                creator
              </div>
              {trend.creator ? (
                <>
                  <p className="mt-3 text-lg font-semibold">@{trend.creator.handle}</p>
                  {trend.creator.displayName && (
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{trend.creator.displayName}</p>
                  )}
                  {trend.creator.followerCount && (
                    <p className="metric-number mt-3 text-2xl font-semibold text-[color:var(--aqua)]">
                      {formatNumber(trend.creator.followerCount)}
                      <span className="ml-1.5 font-mono text-xs font-normal uppercase tracking-[0.14em] text-[color:var(--muted)]">
                        seguidores
                      </span>
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-[color:var(--muted-strong)]">Sem creator vinculado.</p>
              )}
            </section>

            {/* Sound */}
            <section className="app-rail-card rounded-[var(--radius-lg)] p-5">
              <div className="section-head text-[color:var(--gold)]">
                <AudioLines className="h-4 w-4 shrink-0" aria-hidden="true" />
                sound
              </div>
              {trend.sound ? (
                <>
                  <p className="mt-3 text-base font-semibold leading-snug">{trend.sound.title}</p>
                  {trend.sound.authorName && (
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{trend.sound.authorName}</p>
                  )}
                  <div className="mt-3 inline-flex rounded-full border border-[color:var(--line)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
                    {trend.sound.isCommerciallyUsable ? "uso comercial: sim" : "uso comercial: não informado"}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-[color:var(--muted-strong)]">Sem som vinculado.</p>
              )}
            </section>

            {/* Hashtags */}
            <section className="app-rail-card rounded-[var(--radius-lg)] p-5">
              <div className="section-head text-[color:var(--aqua)]">
                <Hash className="h-4 w-4 shrink-0" aria-hidden="true" />
                hashtags
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {trend.hashtags.length > 0 ? (
                  trend.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[color:var(--line)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-xs text-[color:var(--muted-strong)]"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--muted-strong)]">Sem hashtags vinculadas.</span>
                )}
              </div>
            </section>

            {/* Related */}
            <section className="app-rail-card rounded-[var(--radius-lg)] p-5">
              <div className="section-head text-[color:var(--acid)]">
                <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                relacionados
              </div>
              <div className="mt-4 grid gap-2">
                {trend.related.length > 0 ? (
                  trend.related.map((item) => {
                    const rtone = scoreTone(item.trendScore);
                    return (
                      <Link
                        key={item.id}
                        href={`/trends/${item.id}`}
                        className="group rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.16)] p-3 transition hover:border-[rgba(64,224,208,0.34)] hover:bg-[rgba(64,224,208,0.04)]"
                      >
                        <p className="line-clamp-2 text-sm font-semibold group-hover:text-[color:var(--aqua)]">
                          {item.title}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                          <span className={cn("font-semibold", rtone.text)}>
                            {item.trendScore}
                          </span>
                          <span>·</span>
                          <span>{formatNumber(item.metrics.views)} views</span>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-[color:var(--muted-strong)]">Sem relacionados suficientes.</p>
                )}
              </div>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
