import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { saveContentDraftAction } from "@/app/studio/actions";
import { DecisionFlowStepper } from "@/components/cinematic/decision-flow-stepper";
import { FlowNarrativePanel } from "@/components/cinematic/flow-narrative-panel";
import { ContentDraftEditor } from "@/components/content-draft-editor";
import { ReelArtifactPoster } from "@/components/viral-library/reel-artifact-poster";
import { requireTenantContext } from "@/lib/auth/session";
import { buildCinematicFlow } from "@/lib/trends/cinematic-flow";
import { getContentDraft } from "@/lib/trends/content-draft-service";
import { normalizeOpportunityDecisionAction } from "@/lib/trends/opportunity-actions";

export const dynamic = "force-dynamic";

export default async function StudioDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireTenantContext();
  const { id } = await params;
  const draft = await getContentDraft(context, id);

  if (!draft) {
    notFound();
  }

  const posterVideo = {
    title: draft.video.title,
    thumbnailUrl: draft.video.thumbnailUrl,
    media: draft.video.media,
    market: draft.video.market,
    trendScore: draft.video.trendScore,
    growthViews: draft.video.growthViews,
    views: draft.video.views,
    creator: draft.video.creator,
    origin: draft.video.origin,
    sound: draft.video.sound,
    hashtags: draft.video.hashtags,
  };
  const decisionAction = draft.decision
    ? normalizeOpportunityDecisionAction(draft.decision.action) ?? "create_content_idea"
    : undefined;
  const cinematicStages = buildCinematicFlow({
    videoId: draft.video.id,
    title: draft.video.title,
    creator: draft.video.creator,
    origin: draft.video.origin,
    market: draft.video.market,
    trendScore: draft.video.trendScore,
    views: draft.video.views,
    growthViews: draft.video.growthViews,
    relatedSignalCount: draft.signal ? 1 : 0,
    signal: draft.signal,
    decision: draft.decision
      ? {
          action: decisionAction ?? "create_content_idea",
          label: draft.decision.label,
          shortLabel: "ideia",
          section: "saved",
        }
      : undefined,
    contentDraft: {
      id: draft.id,
      title: draft.title,
      status: draft.status,
      statusLabel: draft.statusLabel,
    },
  });

  return (
    <main className="relative min-h-dvh text-[color:var(--foreground)]">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none fixed inset-0 opacity-55" aria-hidden="true" />

      <section className="relative mx-auto grid w-full max-w-[1640px] items-start gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_330px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)] transition hover:gap-3"
              href="/studio"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              voltar para Estudio
            </Link>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--muted-strong)] transition hover:text-[color:var(--foreground)]"
              href={`/trends/${draft.video.id}`}
            >
              abrir Opportunity Brief
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <section className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]" aria-label="Continuidade do roteiro">
            <DecisionFlowStepper stages={cinematicStages} title="Da oportunidade ao roteiro" compact />
            <FlowNarrativePanel stages={cinematicStages} title="Continuidade no Studio" compact />
          </section>

          <ContentDraftEditor draft={draft} action={saveContentDraftAction} />
        </div>

        <aside className="min-w-0 opacity-95 lg:sticky lg:top-5">
          <div className="scrollbar-soft grid content-start gap-4 overflow-y-auto overscroll-contain pb-10 pr-1 lg:max-h-[calc(100dvh-40px)]">
            <section className="app-panel rounded-[var(--radius-lg)] p-4">
              <ReelArtifactPoster video={posterVideo} featured />
              <div className="mt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  Reel de origem
                </p>
                <h2 className="mt-2 line-clamp-3 text-lg font-semibold leading-snug text-[color:var(--foreground)]">
                  {draft.video.title}
                </h2>
                <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                  {draft.video.creator ? `@${draft.video.creator}` : draft.video.origin} / score {draft.video.trendScore}
                </p>
                {draft.video.url ? (
                  <a
                    href={draft.video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--aqua)] transition hover:text-[color:var(--foreground)]"
                  >
                    abrir Reel original
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
