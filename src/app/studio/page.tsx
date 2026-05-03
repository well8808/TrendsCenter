import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Sparkles } from "lucide-react";

import { CinematicMetric, CinematicPageShell, CinematicSection } from "@/components/cinematic/cinematic-primitives";
import { StudioDraftMotionCard } from "@/components/cinematic/studio-draft-motion-card";
import { requireTenantContext } from "@/lib/auth/session";
import {
  contentDraftStatusMeta,
  contentDraftStatusOrder,
  groupContentDraftsByStatus,
  type ContentDraftStatusKey,
} from "@/lib/trends/content-draft";
import { listContentDrafts } from "@/lib/trends/content-draft-service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function toneClass(tone: "hot" | "gold" | "aqua" | "muted") {
  if (tone === "hot") return "border-[rgba(237,73,86,0.26)] bg-[rgba(237,73,86,0.08)] text-[color:var(--hot)]";
  if (tone === "gold") return "border-[rgba(243,201,105,0.24)] bg-[rgba(243,201,105,0.07)] text-[color:var(--gold)]";
  if (tone === "aqua") return "border-[rgba(64,224,208,0.22)] bg-[rgba(64,224,208,0.06)] text-[color:var(--aqua)]";

  return "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] text-[color:var(--muted-strong)]";
}

function DraftCard({ draft }: { draft: Awaited<ReturnType<typeof listContentDrafts>>[number] }) {
  return (
    <StudioDraftMotionCard
      href={`/studio/${draft.id}`}
      title={draft.title}
      subtitle={draft.video.creator ? `@${draft.video.creator}` : draft.video.origin}
      statusLabel={draft.statusLabel}
      tone={contentDraftStatusMeta[draft.status].tone}
      hook={draft.hook}
      captionPreview={draft.captionPreview}
    />
  );
}

function Lane({
  status,
  drafts,
}: {
  status: ContentDraftStatusKey;
  drafts: Awaited<ReturnType<typeof listContentDrafts>>;
}) {
  const meta = contentDraftStatusMeta[status];

  return (
    <section className="rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.18)] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.16em]", toneClass(meta.tone))}>
            {meta.laneTitle}
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-[color:var(--muted)]">{meta.body}</p>
        </div>
        <span className="metric-number shrink-0 text-sm font-semibold text-[color:var(--foreground)]">
          {drafts.length}
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {drafts.length > 0 ? (
          drafts.map((draft) => <DraftCard key={draft.id} draft={draft} />)
        ) : (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.012)] p-3 text-[12px] leading-5 text-[color:var(--muted)]">
            {meta.empty}
          </p>
        )}
      </div>
    </section>
  );
}

export default async function StudioPage() {
  const context = await requireTenantContext();
  const drafts = await listContentDrafts(context);
  const groups = groupContentDraftsByStatus(drafts);
  const activeCount = drafts.filter((draft) => draft.status !== "ARCHIVED").length;
  const readyCount = groups.READY.length + groups.SCHEDULED.length;
  const publishedCount = groups.PUBLISHED.length;

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />

      <CinematicPageShell className="relative mx-auto grid w-full max-w-[1640px] gap-6 px-4 py-5 md:px-6">
        <header className="app-hero relative overflow-hidden rounded-[var(--radius-lg)] p-5 md:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(237,73,86,0.13),transparent_28rem),radial-gradient(circle_at_88%_80%,rgba(247,119,55,0.08),transparent_24rem)]"
          />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)] transition hover:gap-3"
                href="/trends"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                voltar para Biblioteca Viral
              </Link>
              <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hot)]">
                Estudio de Conteudo
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.02em] md:text-[3.5rem]">
                Transforme pautas em{" "}
                <span className="gradient-text-ig">roteiros editaveis</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--muted)] md:text-[15px]">
                A fila deixa de ser apenas decisao: aqui cada Reel promovido vira rascunho, pronto para copiar, editar, revisar e marcar como publicado.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:w-[420px]">
              <CinematicMetric label="ativos" value={activeCount} tone="foreground" delay={0.02} />
              <CinematicMetric label="prontos" value={readyCount} tone="hot" delay={0.04} />
              <CinematicMetric label="publicados" value={publishedCount} tone="aqua" delay={0.06} />
            </div>
          </div>
        </header>

        {drafts.length === 0 ? (
          <CinematicSection className="app-panel rounded-[var(--radius-lg)] p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-[color:var(--hot)]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">Nenhuma pauta editavel ainda.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[color:var(--muted-strong)]">
              Abra um Reel em Pautas criadas, use Transformar em pauta e crie o primeiro roteiro editavel a partir de dados reais.
            </p>
            <Link
              href="/trends"
              className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.14)] px-4 py-2 text-sm font-semibold text-[color:var(--hot)] transition hover:bg-[rgba(237,73,86,0.2)]"
            >
              Encontrar Reels para pauta
            </Link>
          </CinematicSection>
        ) : (
          <CinematicSection className="grid gap-3 xl:grid-cols-4" aria-label="Fila do estudio de conteudo">
            {contentDraftStatusOrder.filter((status) => status !== "ARCHIVED").map((status) => (
              <Lane key={status} status={status} drafts={groups[status]} />
            ))}
          </CinematicSection>
        )}

        {groups.ARCHIVED.length > 0 ? (
          <section className="rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.012)] p-4">
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              Arquivados
              <span className="metric-number text-[color:var(--foreground)]">{groups.ARCHIVED.length}</span>
            </div>
          </section>
        ) : null}
      </CinematicPageShell>
    </main>
  );
}
