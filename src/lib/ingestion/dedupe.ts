import { createHash } from "node:crypto";

import type { DataOrigin, Market, SignalType, SourceKind } from "@/lib/types";

export function normalizeForDedupe(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stableHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function buildSourceDedupeKey(input: {
  origin: DataOrigin;
  kind: SourceKind;
  market: Market;
  title: string;
}) {
  return [
    "source",
    input.origin.toLowerCase(),
    input.kind.toLowerCase(),
    input.market.toLowerCase(),
    normalizeForDedupe(input.title),
  ].join(":");
}

export function buildSignalDedupeKey(input: {
  market: Market;
  type: SignalType;
  title: string;
}) {
  return ["signal", input.market.toLowerCase(), input.type.toLowerCase(), normalizeForDedupe(input.title)].join(":");
}

export function buildEvidenceDedupeKey(input: {
  signalKey: string;
  title: string;
  url?: string;
}) {
  const evidenceLocator = input.url?.trim() ? input.url.trim().toLowerCase() : normalizeForDedupe(input.title);

  return ["evidence", input.signalKey, stableHash(evidenceLocator).slice(0, 18)].join(":");
}
