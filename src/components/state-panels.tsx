"use client";

import { motion } from "motion/react";
import { AlertTriangle, Database, Loader2, Sparkles } from "lucide-react";

import type { WorkspaceState } from "@/lib/types";
import { cn } from "@/lib/utils";

const stateCopy = {
  ready: {
    icon: Sparkles,
    title: "Arquivo ao vivo",
    body: "Sinais, evidencias e proximas acoes atualizados a partir das fontes conectadas.",
    action: "Dados reais",
  },
  loading: {
    icon: Loader2,
    title: "Atualizando",
    body: "Lendo as ultimas entradas e recalculando o potencial sem inventar dado no caminho.",
    action: "Atualizacao em andamento",
  },
  empty: {
    icon: Database,
    title: "Sem sinal nesta janela",
    body: "Conecte uma conta, adicione uma fonte oficial ou importe dados licenciados para comecar.",
    action: "Adicionar dados",
  },
  error: {
    icon: AlertTriangle,
    title: "Entrada bloqueada",
    body: "A fonte respondeu com erro. Corrija a origem antes de transformar isso em insight.",
    action: "Revisar atualizacao",
  },
};

export function StatePanel({ state }: { state: WorkspaceState }) {
  const copy = stateCopy[state];
  const Icon = copy.icon;

  return (
    <motion.section
      key={state}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "app-card relative overflow-hidden rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-soft)]",
        state === "error" && "border-[rgba(255,111,97,0.42)]",
      )}
    >
      <div className="premium-grid absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="relative flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[color:var(--line-strong)] bg-[rgba(0,0,0,0.24)]">
          <Icon
            className={cn(
              "h-5 w-5",
              state === "loading" && "animate-spin text-[color:var(--aqua)]",
              state === "error" && "text-[color:var(--coral)]",
              state === "empty" && "text-[color:var(--gold)]",
              state === "ready" && "text-[color:var(--acid)]",
            )}
            aria-hidden="true"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-[color:var(--foreground)]">{copy.title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">{copy.body}</p>
          <div className="mt-4 inline-flex rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">
            {copy.action}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-live="polite">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="app-card relative overflow-hidden rounded-[var(--radius-lg)]"
          style={{ opacity: 1 - item * 0.2 }}
        >
          <div className="skeleton-shimmer absolute inset-0" aria-hidden="true" />
          <div className="relative grid xl:grid-cols-[minmax(0,1fr)_160px_220px]">
            <div className="min-w-0 p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
                <div className="h-5 w-12 rounded-full" style={{ background: "rgba(237, 73, 86,0.07)" }} />
                <div className="h-5 w-10 rounded-full" style={{ background: "rgba(239,233,220,0.06)" }} />
                <div className="h-5 w-16 rounded-full" style={{ background: "rgba(239,233,220,0.04)" }} />
              </div>
              <div className="mt-4 h-6 rounded-full" style={{ background: "rgba(239,233,220,0.09)", width: "58%" }} aria-hidden="true" />
              <div className="mt-2 h-4 rounded-full" style={{ background: "rgba(239,233,220,0.06)", width: "80%" }} aria-hidden="true" />
              <div className="mt-1.5 h-4 rounded-full" style={{ background: "rgba(239,233,220,0.05)", width: "45%" }} aria-hidden="true" />
              <div className="mt-4 flex gap-3" aria-hidden="true">
                <div className="h-3 w-16 rounded-full" style={{ background: "rgba(239,233,220,0.05)" }} />
                <div className="h-3 w-20 rounded-full" style={{ background: "rgba(239,233,220,0.04)" }} />
              </div>
              <div className="mt-4 h-3 w-24 rounded-full" style={{ background: "rgba(64,224,208,0.06)" }} aria-hidden="true" />
            </div>
            <div className="hidden items-center justify-center border-l border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] py-6 xl:flex" aria-hidden="true">
              <div className="h-[88px] w-[88px] rounded-full" style={{ background: "rgba(239,233,220,0.05)" }} />
            </div>
            <div className="hidden flex-col border-l border-[color:var(--line)] bg-[rgba(0,0,0,0.12)] px-4 xl:flex" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-2.5"
                  style={{ borderBottom: i < 5 ? "1px solid rgba(239,233,220,0.05)" : undefined }}
                >
                  <div className="h-2.5 rounded-full" style={{ background: "rgba(239,233,220,0.06)", width: `${44 + i * 6}px` }} />
                  <div className="h-3 rounded-full" style={{ background: "rgba(239,233,220,0.08)", width: `${28 + i * 4}px` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
