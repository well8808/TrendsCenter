"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  AudioLines,
  Bell,
  Command,
  Database,
  FileWarning,
  Filter,
  Flame,
  Gauge,
  Globe2,
  History,
  Inbox,
  LayoutDashboard,
  LockKeyhole,
  Radar,
  Search,
  ShieldCheck,
  Tags,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SourcePill } from "@/components/source-pill";
import { StatePanel, LoadingSkeleton } from "@/components/state-panels";
import { TrendCard } from "@/components/trend-card";
import { commandMetrics, demoSignals, sourceQueue } from "@/lib/demo-data";
import type { WorkspaceState } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Command Center", icon: LayoutDashboard, active: true },
  { label: "Radar BR", icon: Radar },
  { label: "US Early Signals", icon: Globe2 },
  { label: "Audios", icon: AudioLines },
  { label: "Formatos", icon: Activity },
  { label: "Hashtags", icon: Tags },
  { label: "Creators", icon: UserRoundCheck },
  { label: "Revival Lab", icon: History },
  { label: "Evidence Inbox", icon: Inbox },
  { label: "Upload Lab", icon: LockKeyhole },
  { label: "Compliance", icon: ShieldCheck },
];

const stateOptions: { value: WorkspaceState; label: string }[] = [
  { value: "demo", label: "Demo" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
];

const pipelineItems = [
  { title: "Ingestao", body: "manual/oficial", icon: Zap },
  { title: "Normalizacao", body: "dedupe e taxonomia", icon: Activity },
  { title: "Scoring", body: "score + risco", icon: Gauge },
  { title: "Compliance", body: "bloqueios seguros", icon: FileWarning },
];

export function CommandCenter() {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("demo");

  const primarySignals = useMemo(
    () => [...demoSignals].sort((a, b) => b.score.value - a.score.value),
    [],
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1540px] gap-0 px-3 py-3 lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-[color:var(--line)] bg-[rgba(10,10,8,0.74)] p-4 backdrop-blur-xl lg:block">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[color:var(--acid)] text-black">
                <Command className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">Market Intel</p>
                <p className="text-xs text-[color:var(--muted)]">TikTok Command Center</p>
              </div>
            </div>

            <nav className="mt-7 grid gap-1" aria-label="Navegacao principal">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm text-[color:var(--muted-strong)] transition",
                      item.active
                        ? "bg-[rgba(199,255,93,0.13)] text-[color:var(--foreground)]"
                        : "hover:bg-[rgba(255,255,255,0.055)] hover:text-[color:var(--foreground)]",
                    )}
                    type="button"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Safe mode
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Nenhum dado de producao conectado. O app bloqueia insight sem fonte e marca mock na UI.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-[rgba(7,7,6,0.52)] backdrop-blur-xl">
          <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[rgba(7,7,6,0.78)] px-4 py-3 backdrop-blur-2xl md:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="lg:hidden grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[color:var(--acid)] text-black">
                  <Command className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-normal md:text-2xl">
                      Command Center v1
                    </h1>
                    <span className="rounded-full border border-[rgba(199,255,93,0.36)] bg-[rgba(199,255,93,0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
                      demo/mock
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Base premium para inteligencia TikTok BR com radar EUA, sem dados reais conectados.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-[240px] items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] px-3 py-2 text-sm text-[color:var(--muted)]">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>Buscar sinais, fontes, creators...</span>
                </div>
                <button className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] text-[color:var(--muted-strong)] transition hover:text-[color:var(--aqua)]">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Filtros</span>
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] text-[color:var(--muted-strong)] transition hover:text-[color:var(--aqua)]">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Alertas</span>
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-5 px-4 py-5 md:px-6 xl:grid-cols-[1fr_360px]">
            <div className="grid min-w-0 gap-5">
              <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4" aria-label="Metricas demo">
                {commandMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.32 }}
                    className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {metric.label}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="font-mono text-2xl font-semibold">{metric.value}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-[11px] font-medium",
                          metric.tone === "acid" && "bg-[rgba(199,255,93,0.12)] text-[color:var(--acid)]",
                          metric.tone === "aqua" && "bg-[rgba(64,224,208,0.12)] text-[color:var(--aqua)]",
                          metric.tone === "coral" && "bg-[rgba(255,111,97,0.12)] text-[color:var(--coral)]",
                          metric.tone === "gold" && "bg-[rgba(243,201,105,0.12)] text-[color:var(--gold)]",
                        )}
                      >
                        {metric.delta}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </section>

              <section className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                      Estado do workspace
                    </p>
                    <h2 className="mt-2 text-lg font-semibold">Estados premium preparados</h2>
                  </div>
                  <div className="inline-flex w-full rounded-full border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] p-1 sm:w-auto">
                    {stateOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setWorkspaceState(option.value)}
                        className={cn(
                          "flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition sm:flex-none",
                          workspaceState === option.value
                            ? "bg-[color:var(--foreground)] text-black"
                            : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <AnimatePresence mode="wait">
                    {workspaceState === "loading" ? (
                      <motion.div
                        key="loading-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-4"
                      >
                        <StatePanel state="loading" />
                        <LoadingSkeleton />
                      </motion.div>
                    ) : (
                      <StatePanel key={workspaceState} state={workspaceState} />
                    )}
                  </AnimatePresence>
                </div>
              </section>

              <section>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
                      Signal desk
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">Sinais ranqueados por score preparado</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                      Todos os itens abaixo sao mock. A estrutura ja exige fonte, evidencia,
                      mercado, score e risco antes de virar insight real.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
                    <Gauge className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />
                    score v0.1
                  </div>
                </div>

                <div className="grid gap-3">
                  {workspaceState === "empty" ? (
                    <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--line-strong)] p-8 text-center text-sm text-[color:var(--muted)]">
                      Nenhum sinal exibido porque o estado vazio esta selecionado.
                    </div>
                  ) : workspaceState === "error" ? (
                    <div className="rounded-[var(--radius-lg)] border border-[rgba(255,111,97,0.42)] bg-[rgba(255,111,97,0.07)] p-8 text-sm text-[color:var(--muted-strong)]">
                      Importacao bloqueada no modo erro. O app nao transforma falha de fonte em dado.
                    </div>
                  ) : (
                    primarySignals.map((signal, index) => (
                      <TrendCard key={signal.id} signal={signal} index={index} />
                    ))
                  )}
                </div>
              </section>
            </div>

            <aside className="grid content-start gap-4">
              <section className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                      Proveniencia
                    </p>
                    <h2 className="mt-2 text-lg font-semibold">Fila de fontes</h2>
                  </div>
                  <Database className="h-5 w-5 text-[color:var(--muted)]" aria-hidden="true" />
                </div>
                <div className="mt-5 grid gap-3">
                  {sourceQueue.map((source) => (
                    <div
                      key={source.id}
                      className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.18)] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-5">{source.title}</p>
                        <SourcePill source={source} compact />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--muted)]">
                        <span>{source.market}</span>
                        <span>{new Date(source.collectedAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
                  Fase 1
                </p>
                <h2 className="mt-2 text-lg font-semibold">Pipeline preparado</h2>
                <div className="mt-5 grid gap-3">
                  {pipelineItems.map((item) => {
                    const Icon = item.icon;

                    return (
                    <div key={item.title} className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)]">
                        <Icon className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-[color:var(--muted)]">{item.body}</p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>

              <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(199,255,93,0.22)] bg-[rgba(199,255,93,0.075)] p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--acid)]">
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  Nao producao
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Este dashboard esta bonito de proposito, mas os sinais sao simulados. O proximo passo
                  e conectar importacoes rastreaveis, nao raspar dados.
                </p>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
