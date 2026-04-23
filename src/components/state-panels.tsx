"use client";

import { motion } from "motion/react";
import { AlertTriangle, Database, Loader2, Sparkles } from "lucide-react";

import type { WorkspaceState } from "@/lib/types";
import { cn } from "@/lib/utils";

const stateCopy = {
  ready: {
    icon: Sparkles,
    title: "Postgres operacional",
    body: "A interface esta lendo sinais, evidencias, lineage, jobs e fila de decisao do banco gerenciado.",
    action: "Fluxo real ativo",
  },
  loading: {
    icon: Loader2,
    title: "Sincronizando fontes",
    body: "Estado de carregamento premium para imports oficiais, snapshots manuais e calculo de score.",
    action: "Fila preparada",
  },
  empty: {
    icon: Database,
    title: "Nenhum sinal importado",
    body: "Quando uma fonte oficial ou snapshot manual for adicionado, os sinais aparecem aqui com origem, data, confianca e evidencias.",
    action: "Aguardando evidencia",
  },
  error: {
    icon: AlertTriangle,
    title: "Falha na leitura da fonte",
    body: "A UI separa erro de fonte, erro de normalizacao e erro de score para nao transformar ausencia de dado em insight falso.",
    action: "Revisar importacao",
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
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="app-card h-24 animate-pulse rounded-[var(--radius-md)]"
        />
      ))}
    </div>
  );
}
