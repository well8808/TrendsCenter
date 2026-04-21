import { Database, FlaskConical, ShieldCheck } from "lucide-react";

import type { SourceRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const originLabel = {
  OFFICIAL: "oficial",
  OWNED: "proprio",
  MANUAL: "manual",
  DEMO: "demo/mock",
};

export function SourcePill({
  source,
  compact = false,
}: {
  source: SourceRecord;
  compact?: boolean;
}) {
  const Icon = source.origin === "DEMO" ? FlaskConical : source.origin === "OFFICIAL" ? ShieldCheck : Database;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs text-[color:var(--muted-strong)]",
        compact && "px-2.5 py-0.5 text-[11px]",
      )}
      title={`${source.title} · ${source.evidenceCount} evidencias · ${source.confidence}`}
    >
      <Icon className="h-3.5 w-3.5 text-[color:var(--acid)]" aria-hidden="true" />
      <span className="font-medium uppercase tracking-[0.18em]">{originLabel[source.origin]}</span>
      {!compact && <span className="text-[color:var(--muted)]">{source.evidenceCount} evid.</span>}
    </div>
  );
}
