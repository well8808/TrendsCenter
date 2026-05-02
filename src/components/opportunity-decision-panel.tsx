import { CheckCircle2, CircleDashed } from "lucide-react";

import { setOpportunityDecisionAction } from "@/app/trends/decision-actions";
import {
  getOpportunityDecisionMeta,
  opportunityDecisionActions,
  recommendedDecisionFromBriefAction,
  type OpportunityDecisionView,
} from "@/lib/trends/opportunity-actions";
import { cn } from "@/lib/utils";

function toneClass(tone: "hot" | "gold" | "aqua" | "muted") {
  if (tone === "hot") return "border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.1)] text-[color:var(--hot)]";
  if (tone === "gold") return "border-[rgba(243,201,105,0.3)] bg-[rgba(243,201,105,0.09)] text-[color:var(--gold)]";
  if (tone === "aqua") return "border-[rgba(64,224,208,0.28)] bg-[rgba(64,224,208,0.08)] text-[color:var(--aqua)]";

  return "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.035)] text-[color:var(--muted-strong)]";
}

export function DecisionStatusBadge({ decision }: { decision?: OpportunityDecisionView }) {
  if (!decision) {
    return (
      <span className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.025)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
        sem decisao
      </span>
    );
  }

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
        toneClass(decision.tone),
      )}
    >
      {decision.shortLabel}
    </span>
  );
}

export function OpportunityDecisionPanel({
  videoId,
  recommendedBriefAction,
  currentDecision,
}: {
  videoId: string;
  recommendedBriefAction: string;
  currentDecision?: OpportunityDecisionView;
}) {
  const recommendedAction = recommendedDecisionFromBriefAction(recommendedBriefAction);
  const recommendedMeta = getOpportunityDecisionMeta(recommendedAction);

  return (
    <div className="mt-3 grid gap-3">
      <div className="rounded-[var(--radius-md)] border border-[rgba(237,73,86,0.18)] bg-[rgba(237,73,86,0.055)] p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--hot)]">
              decisao principal
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
              {currentDecision ? currentDecision.label : recommendedMeta.label}
            </p>
          </div>
          <DecisionStatusBadge decision={currentDecision} />
        </div>
        <p className="mt-2 text-[12px] leading-5 text-[color:var(--muted-strong)]">
          {currentDecision
            ? currentDecision.body
            : `Recomendacao do Brief: ${recommendedMeta.body}`}
        </p>
      </div>

      <div className="grid gap-2">
        {opportunityDecisionActions.map((action) => {
          const selected = currentDecision?.action === action.key;
          const recommended = recommendedAction === action.key;

          return (
            <form key={action.key} action={setOpportunityDecisionAction}>
              <input type="hidden" name="videoId" value={videoId} />
              <input type="hidden" name="action" value={action.key} />
              <button
                type="submit"
                aria-pressed={selected}
                className={cn(
                  "group w-full rounded-[var(--radius-md)] border p-3 text-left transition",
                  selected
                    ? "border-[rgba(64,224,208,0.36)] bg-[rgba(64,224,208,0.085)]"
                    : "border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)] hover:border-[rgba(237,73,86,0.28)] hover:bg-[rgba(237,73,86,0.045)]",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                  {selected ? (
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--aqua)]" aria-hidden="true" />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-[color:var(--muted)] transition group-hover:text-[color:var(--hot)]" aria-hidden="true" />
                  )}
                  {action.label}
                  {recommended && !selected ? (
                    <span className="ml-auto rounded-full border border-[rgba(237,73,86,0.28)] bg-[rgba(237,73,86,0.08)] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[color:var(--hot)]">
                      recomendado
                    </span>
                  ) : null}
                </span>
                <span className="mt-1.5 block text-[12px] leading-5 text-[color:var(--muted-strong)]">
                  {action.body}
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
