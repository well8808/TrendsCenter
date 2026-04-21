import type { Market, SignalPriority, SignalType, TrendSignal } from "@/lib/types";

export type MarketFilter = "ALL" | Market;
export type TypeFilter = "ALL" | SignalType;
export type PriorityFilter = "ALL" | SignalPriority;
export type SortMode = "priority" | "score" | "risk" | "freshness";

const priorityRank: Record<SignalPriority, number> = {
  now: 4,
  next: 3,
  watch: 2,
  hold: 1,
};

const riskRank = {
  high: 3,
  medium: 2,
  low: 1,
};

export interface SignalFilters {
  query: string;
  market: MarketFilter;
  type: TypeFilter;
  priority: PriorityFilter;
  sort: SortMode;
}

function searchableText(signal: TrendSignal) {
  return [
    signal.title,
    signal.summary,
    signal.audience,
    signal.decision,
    signal.nextAction,
    signal.tags.join(" "),
    signal.source.title,
  ]
    .join(" ")
    .toLowerCase();
}

export function filterSignals(signals: TrendSignal[], filters: SignalFilters) {
  const query = filters.query.trim().toLowerCase();

  return signals.filter((signal) => {
    const matchesQuery = query.length === 0 || searchableText(signal).includes(query);
    const matchesMarket = filters.market === "ALL" || signal.market === filters.market;
    const matchesType = filters.type === "ALL" || signal.type === filters.type;
    const matchesPriority = filters.priority === "ALL" || signal.priority === filters.priority;

    return matchesQuery && matchesMarket && matchesType && matchesPriority;
  });
}

export function rankSignals(signals: TrendSignal[], sort: SortMode) {
  return [...signals].sort((a, b) => {
    if (sort === "score") {
      return b.score.value - a.score.value;
    }

    if (sort === "risk") {
      return riskRank[b.riskLevel] - riskRank[a.riskLevel] || b.score.value - a.score.value;
    }

    if (sort === "freshness") {
      return Date.parse(b.source.collectedAt) - Date.parse(a.source.collectedAt);
    }

    return (
      priorityRank[b.priority] - priorityRank[a.priority] ||
      b.score.value - a.score.value ||
      b.strength - a.strength
    );
  });
}

export function summarizeSignals(signals: TrendSignal[]) {
  const br = signals.filter((signal) => signal.market === "BR");
  const us = signals.filter((signal) => signal.market === "US");
  const saved = signals.filter((signal) => signal.saved);
  const highPriority = signals.filter((signal) => signal.priority === "now" || signal.priority === "next");
  const evidenceCount = signals.reduce((total, signal) => total + signal.evidence.length, 0);
  const avgScore =
    signals.length === 0
      ? 0
      : Math.round(signals.reduce((total, signal) => total + signal.score.value, 0) / signals.length);

  return {
    brCount: br.length,
    usCount: us.length,
    savedCount: saved.length,
    highPriorityCount: highPriority.length,
    evidenceCount,
    avgScore,
  };
}
