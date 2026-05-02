"use client";

import Link from "next/link";
import { AlertTriangle, Loader2, SearchCheck, Sparkles, Target } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import {
  handleClientApiError,
  requestReelsSearchAssistantApi,
  type ReelsSearchAssistantPlanDto,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const controlClass =
  "app-control rounded-[var(--radius-sm)] px-3 py-3 text-sm outline-none placeholder:text-[color:var(--muted)]";

type AssistantState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: ReelsSearchAssistantPlanDto; requestId: string }
  | { kind: "error"; message: string; code: string; requestId: string };

function chips(items: string[], tone: "aqua" | "acid" | "muted" = "muted") {
  const className = {
    aqua: "border-[rgba(64,224,208,0.26)] bg-[rgba(64,224,208,0.08)] text-[color:var(--aqua)]",
    acid: "border-[rgba(237,73,86,0.28)] bg-[rgba(237,73,86,0.08)] text-[color:var(--acid)]",
    muted: "border-[rgba(239,233,220,0.12)] bg-[rgba(255,255,255,0.03)] text-[color:var(--muted-strong)]",
  }[tone];

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.slice(0, 8).map((item) => (
        <span
          key={item}
          className={cn("rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", className)}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function trendHref(plan: ReelsSearchAssistantPlanDto) {
  const params = new URLSearchParams({
    q: plan.recommendedQuery,
    market: plan.market,
    sort: plan.sort,
  });

  return `/trends?${params.toString()}`;
}

export function ReelsSearchAssistant() {
  const [, startTransition] = useTransition();
  const [state, setState] = useState<AssistantState>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const goal = String(formData.get("goal") ?? "").trim();
    const market = String(formData.get("market") ?? "BR");

    if (goal.length < 8) {
      setState({
        kind: "error",
        code: "BAD_REQUEST",
        message: "Explique um pouco melhor o que voce quer encontrar.",
        requestId: "n/a",
      });
      return;
    }

    setState({ kind: "loading" });
    startTransition(async () => {
      try {
        const { data, meta } = await requestReelsSearchAssistantApi({
          goal,
          market: market === "US" || market === "ALL" ? market : "BR",
        });
        setState({ kind: "success", data, requestId: meta.requestId });
      } catch (error) {
        const info = handleClientApiError(error, { context: "form:reels-search-assistant" });
        setState({
          kind: "error",
          code: info.code,
          message: info.message,
          requestId: info.requestId,
        });
      }
    });
  }

  return (
    <section className="app-rail-card rounded-[var(--radius-lg)] p-5 backdrop-blur-2xl">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        busca guiada
      </div>
      <h2 className="mt-3 text-lg font-semibold">Diga o que vale a pena achar</h2>
      <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
        O assistente transforma seu objetivo em filtros, palavras-chave e criterios de coleta. Se a IA externa estiver sem credito, ele usa o modo local.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          objetivo da busca
          <textarea
            className="min-h-28 resize-y rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[var(--control-bg)] px-3 py-3 text-sm leading-5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[rgba(64,224,208,0.58)]"
            name="goal"
            placeholder="Ex: quero achar Reels BR de creators pequenos crescendo rapido, com formato de storytelling e funil leve..."
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          mercado
          <select className={controlClass} name="market" defaultValue="BR">
            <option value="BR">BR</option>
            <option value="US">US</option>
            <option value="ALL">Todos</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={state.kind === "loading"}
          className="inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(64,224,208,0.38)] bg-[rgba(64,224,208,0.1)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--aqua)] transition hover:bg-[rgba(64,224,208,0.16)] disabled:opacity-70"
        >
          {state.kind === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              pensando...
            </>
          ) : (
            <>
              <SearchCheck className="h-4 w-4" aria-hidden="true" />
              gerar busca
            </>
          )}
        </button>
      </form>

      {state.kind === "error" ? (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[rgba(255,111,97,0.32)] bg-[rgba(255,111,97,0.06)] p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--coral)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {state.code}
          </p>
          <p className="mt-2 text-sm leading-5 text-[color:var(--muted-strong)]">{state.message}</p>
          {state.requestId !== "n/a" ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
              codigo {state.requestId.slice(0, 8)}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.kind === "success" ? <AssistantResult data={state.data} /> : null}
    </section>
  );
}

function AssistantResult({ data }: { data: ReelsSearchAssistantPlanDto }) {
  const modeLabel = data.configured ? "IA conectada" : "modo local";

  return (
    <div className="mt-4 rounded-[var(--radius-md)] border border-[rgba(64,224,208,0.28)] bg-[rgba(64,224,208,0.055)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--aqua)]">
          <Target className="h-4 w-4" aria-hidden="true" />
          plano gerado
        </p>
        <span className="rounded-full border border-[rgba(239,233,220,0.14)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
          {modeLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-5 text-[color:var(--muted-strong)]">{data.summary}</p>

      <dl className="mt-4 grid gap-1.5 text-xs leading-5">
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">busca</dt>
          <dd className="min-w-0 truncate text-right font-semibold text-[color:var(--foreground)]">
            {data.recommendedQuery}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">mercado</dt>
          <dd className="font-mono text-[color:var(--aqua)]">{data.market}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">ordem</dt>
          <dd className="font-mono text-[color:var(--muted-strong)]">{data.sort}</dd>
        </div>
      </dl>

      {data.includeKeywords.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">buscar por</p>
          {chips(data.includeKeywords, "aqua")}
        </div>
      ) : null}

      {data.scoringFocus.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">priorizar</p>
          {chips(data.scoringFocus, "muted")}
        </div>
      ) : null}

      {data.nextActions.length > 0 ? (
        <ol className="mt-4 grid gap-2 text-xs leading-5 text-[color:var(--muted-strong)]">
          {data.nextActions.slice(0, 4).map((item, index) => (
            <li key={item} className="flex gap-2">
              <span className="font-mono text-[color:var(--aqua)]">0{index + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <Link
        href={trendHref(data)}
        className="mt-4 inline-flex min-h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.1)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--acid)] transition hover:bg-[rgba(237,73,86,0.16)]"
      >
        aplicar no arquivo
      </Link>
    </div>
  );
}
