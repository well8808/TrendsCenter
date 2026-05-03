"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import type { OpportunityDecisionMeta } from "@/lib/trends/opportunity-actions";
import { cn } from "@/lib/utils";

function selectedToneClass(tone: OpportunityDecisionMeta["tone"]) {
  if (tone === "hot") return "border-[rgba(237,73,86,0.4)] bg-[rgba(237,73,86,0.11)]";
  if (tone === "gold") return "border-[rgba(243,201,105,0.34)] bg-[rgba(243,201,105,0.1)]";
  if (tone === "aqua") return "border-[rgba(64,224,208,0.34)] bg-[rgba(64,224,208,0.085)]";

  return "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.045)]";
}

export function OpportunityDecisionSubmitButton({
  action,
  selected,
  recommended,
}: {
  action: OpportunityDecisionMeta;
  selected: boolean;
  recommended: boolean;
}) {
  const { pending } = useFormStatus();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="submit"
      aria-pressed={selected}
      disabled={pending}
      whileHover={!prefersReducedMotion && !pending ? { y: -1 } : undefined}
      whileTap={!prefersReducedMotion && !pending ? { scale: 0.992 } : undefined}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group w-full rounded-[var(--radius-md)] border p-3 text-left transition disabled:cursor-wait disabled:opacity-75",
        selected
          ? selectedToneClass(action.tone)
          : "border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)] hover:border-[rgba(237,73,86,0.28)] hover:bg-[rgba(237,73,86,0.045)]",
      )}
    >
      <span className="flex items-start gap-2 text-sm font-semibold text-[color:var(--foreground)]">
        {pending ? (
          <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-[color:var(--muted)]" aria-hidden="true" />
        ) : selected ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-[color:var(--aqua)]" aria-hidden="true" />
        ) : (
          <CircleDashed className="mt-0.5 h-4 w-4 text-[color:var(--muted)] transition group-hover:text-[color:var(--hot)]" aria-hidden="true" />
        )}
        <span className="min-w-0">
          <span className="block">{pending ? "Aplicando..." : action.label}</span>
          {selected ? (
            <span className="mt-1 inline-flex rounded-full border border-[rgba(64,224,208,0.25)] bg-[rgba(64,224,208,0.07)] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[color:var(--aqua)]">
              aplicado
            </span>
          ) : null}
        </span>
        {recommended && !selected ? (
          <span className="ml-auto shrink-0 rounded-full border border-[rgba(237,73,86,0.28)] bg-[rgba(237,73,86,0.08)] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[color:var(--hot)]">
            recomendado
          </span>
        ) : null}
      </span>
      <span className="mt-1.5 block text-[12px] leading-5 text-[color:var(--muted-strong)]">
        {action.body}
      </span>
    </motion.button>
  );
}
