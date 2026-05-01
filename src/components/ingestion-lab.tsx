"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileInput,
  GitBranch,
  Link2,
  Loader2,
  Plus,
  RadioTower,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

import { GSAPScrollEntrance, GSAPSectionReveal } from "@/components/gsap-scroll-entrance";
import type { CommandCenterData } from "@/lib/persistence/command-center";
import type { SourceRecord, TrendSignal } from "@/lib/types";
import { cn } from "@/lib/utils";

type ActionResult = {
  ok: boolean;
  message: string;
  signalId?: string;
  evidenceId?: string;
  batchId?: string;
  requestId?: string;
  jobId?: string;
  dedupedSignal?: boolean;
  dedupedEvidence?: boolean;
};

type ManualIngestionPayload =
  | {
      type: "SIGNAL_CREATE";
      signalTitle: string;
      summary: string;
      signalType: string;
      market: string;
      audience: string;
      sourceTitle: string;
      sourceKind: string;
      sourceOrigin: string;
      evidenceTitle: string;
      evidenceUrl?: string;
      evidenceNote: string;
    }
  | {
      type: "EVIDENCE_APPEND";
      signalId: string;
      sourceId: string;
      signalTitle: string;
      market: string;
      sourceOrigin: string;
      sourceTitle: string;
      evidenceTitle: string;
      evidenceUrl?: string;
      evidenceNote: string;
    };

type LabTone = "acid" | "aqua" | "coral" | "gold";

const signalTypes = [
  ["FORMAT", "Formato"],
  ["AUDIO", "Audio"],
  ["HASHTAG", "Hashtag"],
  ["CREATOR", "Creator"],
  ["REVIVAL", "Revival"],
  ["US_TO_BR", "US > BR"],
] as const;

const sourceKinds = [
  ["MANUAL_RESEARCH", "Pesquisa manual"],
  ["INSTAGRAM_REELS_TRENDS", "Instagram Reels"],
  ["INSTAGRAM_PROFESSIONAL_DASHBOARD", "Painel profissional"],
  ["INSTAGRAM_GRAPH_API", "Conta Instagram conectada"],
  ["META_AD_LIBRARY", "Biblioteca de anuncios"],
  ["OWNED_UPLOAD", "Arquivo proprio/licenciado"],
] as const;

const toneText: Record<LabTone, string> = {
  acid: "text-[color:var(--acid)]",
  aqua: "text-[color:var(--aqua)]",
  coral: "text-[color:var(--coral)]",
  gold: "text-[color:var(--gold)]",
};

const toneBorder: Record<LabTone, string> = {
  acid: "border-[rgba(237,73,86,0.34)]",
  aqua: "border-[rgba(88,200,190,0.32)]",
  coral: "border-[rgba(255,111,97,0.34)]",
  gold: "border-[rgba(230,183,101,0.34)]",
};

const toneBg: Record<LabTone, string> = {
  acid: "bg-[rgba(237,73,86,0.08)]",
  aqua: "bg-[rgba(88,200,190,0.08)]",
  coral: "bg-[rgba(255,111,97,0.08)]",
  gold: "bg-[rgba(230,183,101,0.08)]",
};

const toneLine: Record<LabTone, string> = {
  acid: "from-[rgba(237,73,86,0)] via-[rgba(237,73,86,0.74)] to-[rgba(237,73,86,0)]",
  aqua: "from-[rgba(88,200,190,0)] via-[rgba(88,200,190,0.7)] to-[rgba(88,200,190,0)]",
  coral: "from-[rgba(255,111,97,0)] via-[rgba(255,111,97,0.7)] to-[rgba(255,111,97,0)]",
  gold: "from-[rgba(230,183,101,0)] via-[rgba(230,183,101,0.7)] to-[rgba(230,183,101,0)]",
};

const intakeSteps: Array<{
  label: string;
  detail: string;
  tone: LabTone;
  icon: LucideIcon;
}> = [
  { label: "Capturar", detail: "sinal, perfil ou URL permitida", tone: "acid", icon: FileInput },
  { label: "Provar", detail: "fonte + evidencia vinculada", tone: "aqua", icon: Link2 },
  { label: "Pontuar", detail: "score, risco e timing", tone: "gold", icon: Target },
  { label: "Decidir", detail: "acao pronta no radar", tone: "coral", icon: ShieldCheck },
];

const operationDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Sao_Paulo",
});

function formatOperationDateTime(dateIso: string | null | undefined) {
  return dateIso ? operationDateTimeFormatter.format(new Date(dateIso)) : "sem fim";
}

function statusTone(status: string) {
  if (status === "SUCCEEDED" || status === "APPROVED") {
    return "border-[rgba(237,73,86,0.32)] bg-[rgba(237,73,86,0.09)] text-[color:var(--acid)]";
  }

  if (status === "FAILED" || status === "BLOCKED") {
    return "border-[rgba(255,111,97,0.36)] bg-[rgba(255,111,97,0.09)] text-[color:var(--coral)]";
  }

  if (status === "RUNNING" || status === "QUEUED") {
    return "border-[rgba(88,200,190,0.32)] bg-[rgba(88,200,190,0.09)] text-[color:var(--aqua)]";
  }

  return "border-[color:var(--line)] bg-[rgba(255,255,255,0.045)] text-[color:var(--muted-strong)]";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
      {label}
      {children}
    </label>
  );
}

const fieldClass =
  "app-control w-full min-w-0 rounded-[var(--radius-sm)] px-3 py-3 text-sm normal-case tracking-normal outline-none placeholder:text-[color:var(--muted)]";

function ResultBadge({ result }: { result?: ActionResult }) {
  if (!result) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border px-3 py-2 text-sm",
        result.ok
          ? "border-[rgba(237,73,86,0.28)] bg-[rgba(237,73,86,0.075)] text-[color:var(--muted-strong)]"
          : "border-[rgba(255,111,97,0.34)] bg-[rgba(255,111,97,0.075)] text-[color:var(--muted-strong)]",
      )}
    >
      <div className="flex items-center gap-2">
        {result.ok ? (
          <CheckCircle2 className="h-4 w-4 text-[color:var(--acid)]" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-[color:var(--coral)]" aria-hidden="true" />
        )}
        <span>{result.message}</span>
      </div>
    </div>
  );
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

async function queueIngestionRequest(payload: ManualIngestionPayload): Promise<ActionResult> {
  const response = await fetch("/api/v1/ingestion/requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        data?: {
          request: {
            id: string;
            type: string;
            status: string;
            title: string;
          };
          job: {
            id: string;
            status: string;
          };
          idempotent: boolean;
        };
        error?: { message?: string };
      }
    | null;

  if (!response.ok || !body?.ok || !body.data) {
    return {
      ok: false,
      message: body?.error?.message ?? "Nao foi possivel salvar os dados.",
    };
  }

  return {
    ok: true,
    message: body.data.idempotent
      ? "Esses dados ja estavam no radar."
      : "Dados recebidos e enviados para analise.",
    requestId: body.data.request.id,
    jobId: body.data.job.id,
  };
}

function MetricChip({
  label,
  value,
  tone,
  index,
}: {
  label: string;
  value: string;
  tone: LabTone;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "relative min-h-[92px] overflow-hidden rounded-[var(--radius-md)] border bg-[rgba(0,0,0,0.22)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]",
        toneBorder[tone],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", toneLine[tone])}
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className={cn("metric-number text-2xl font-semibold leading-none", toneText[tone])}>
          {value}
        </p>
        <span className={cn("h-2 w-2 rounded-full", toneBg[tone])} aria-hidden="true" />
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <motion.span
          initial={{ width: "18%" }}
          animate={{ width: "72%" }}
          transition={{ duration: 0.72, delay: 0.12 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
          className={cn("block h-full rounded-full bg-gradient-to-r", toneLine[tone])}
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

function IntakePipeline() {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(239,233,220,0.12)] bg-[rgba(0,0,0,0.22)] p-3">
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
      <div className="data-stream pointer-events-none absolute inset-x-0 top-1/2 h-px opacity-70" aria-hidden="true" />
      <div className="relative grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {intakeSteps.map((step, index) => {
          const Icon = step.icon;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.46, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className={cn(
                "relative min-h-[118px] overflow-hidden rounded-[var(--radius-md)] border bg-[rgba(10,10,8,0.72)] p-3",
                toneBorder[step.tone],
              )}
            >
              <span
                className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", toneLine[step.tone])}
                aria-hidden="true"
              />
              <div className="flex items-center justify-between gap-3">
                <span className={cn("metric-number text-lg font-semibold", toneText[step.tone])}>
                  0{index + 1}
                </span>
                <span className={cn("grid h-8 w-8 place-items-center rounded-full border", toneBorder[step.tone], toneBg[step.tone])}>
                  <Icon className={cn("h-4 w-4", toneText[step.tone])} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-5 text-sm font-semibold text-[color:var(--foreground)]">{step.label}</p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{step.detail}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LabCardHeader({
  tone,
  icon: Icon,
  label,
  title,
}: {
  tone: LabTone;
  icon: LucideIcon;
  label: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className={cn("text-xs font-semibold uppercase tracking-[0.18em]", toneText[tone])}>
          {label}
        </p>
        <h3 className="mt-1 text-base font-semibold">{title}</h3>
      </div>
      <span className={cn("grid h-10 w-10 place-items-center rounded-full border", toneBorder[tone], toneBg[tone])}>
        <Icon className={cn("h-5 w-5", toneText[tone])} aria-hidden="true" />
      </span>
    </div>
  );
}

function PipelineEmptyState({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: LabTone;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed px-3 py-5 text-center", toneBorder[tone], toneBg[tone])}>
      <Icon className={cn("h-4 w-4", toneText[tone])} aria-hidden="true" />
      <p className="text-xs font-semibold text-[color:var(--muted-strong)]">{title}</p>
      <p className="text-[11px] leading-4 text-[color:var(--muted)]">{body}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em]", statusTone(status))}>
      {status === "SUCCEEDED" ? "concluido" : status.toLowerCase()}
    </span>
  );
}

function SubmitButton({
  tone,
  loading,
  disabled,
  children,
  icon: Icon,
}: {
  tone: LabTone;
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        "group inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
        toneBorder[tone],
        toneBg[tone],
        toneText[tone],
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4 transition group-hover:scale-105" />}
      {children}
    </button>
  );
}

export function IngestionLab({
  lab,
  signals,
  sources,
}: {
  lab: CommandCenterData["ingestionLab"];
  signals: TrendSignal[];
  sources: SourceRecord[];
}) {
  const router = useRouter();
  const signalFormRef = useRef<HTMLFormElement>(null);
  const evidenceFormRef = useRef<HTMLFormElement>(null);
  const [signalResult, setSignalResult] = useState<ActionResult>();
  const [evidenceResult, setEvidenceResult] = useState<ActionResult>();
  const [isCreating, setIsCreating] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);

  async function submitSignal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsCreating(true);
    setSignalResult(undefined);

    try {
      const result = await queueIngestionRequest({
        type: "SIGNAL_CREATE",
        signalTitle: formValue(formData, "signalTitle"),
        summary: formValue(formData, "summary") || "Sinal criado manualmente; aguarda evidencias adicionais.",
        signalType: formValue(formData, "signalType"),
        market: formValue(formData, "market"),
        audience: formValue(formData, "audience") || "Operacao interna",
        sourceTitle: formValue(formData, "sourceTitle"),
        sourceKind: formValue(formData, "sourceKind"),
        sourceOrigin: formValue(formData, "sourceOrigin"),
        evidenceTitle: formValue(formData, "evidenceTitle"),
        evidenceUrl: formValue(formData, "evidenceUrl") || undefined,
        evidenceNote: formValue(formData, "evidenceNote"),
      });
      setSignalResult(result);

      if (result.ok) {
        signalFormRef.current?.reset();
        router.refresh();
      }
    } catch (error) {
      setSignalResult({
        ok: false,
        message: error instanceof Error ? error.message : "Nao foi possivel salvar os dados.",
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const signalId = formValue(formData, "signalId");
    const sourceId = formValue(formData, "sourceId");
    const selectedSignal = signals.find((signal) => signal.id === signalId);
    const selectedSource = sources.find((source) => source.id === sourceId);

    setIsAttaching(true);
    setEvidenceResult(undefined);

    if (!selectedSignal || !selectedSource) {
      setEvidenceResult({
        ok: false,
        message: "Selecione um sinal e uma fonte antes de anexar evidencia.",
      });
      setIsAttaching(false);
      return;
    }

    try {
      const result = await queueIngestionRequest({
        type: "EVIDENCE_APPEND",
        signalId,
        sourceId,
        signalTitle: selectedSignal.title,
        market: selectedSignal.market,
        sourceOrigin: selectedSource.origin,
        sourceTitle: selectedSource.title,
        evidenceTitle: formValue(formData, "appendEvidenceTitle"),
        evidenceUrl: formValue(formData, "appendEvidenceUrl") || undefined,
        evidenceNote: formValue(formData, "appendEvidenceNote"),
      });
      setEvidenceResult(result);

      if (result.ok) {
        evidenceFormRef.current?.reset();
        router.refresh();
      }
    } catch (error) {
      setEvidenceResult({
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao anexar evidencia.",
      });
    } finally {
      setIsAttaching(false);
    }
  }

  const signalOptions = signals.slice(0, 12);
  const sourceOptions = sources.slice(0, 12);

  return (
    <section className="relative min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(239,233,220,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(10,10,8,0.84)] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.36)] md:p-5">
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="scan-line pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(225,48,108,0.14),transparent_66%)]"
      />

      <GSAPSectionReveal className="relative">
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--aqua)]">
              <Workflow className="h-4 w-4" aria-hidden="true" />
              Bancada de sinais
            </div>
            <h2 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
              Transforme achados em decisoes
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted-strong)]">
              Um fluxo visual para capturar, provar e levar bons sinais para o radar sem bagunca.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricChip index={0} label="fontes ativas" value={String(lab.stats.approvedConnectors)} tone="acid" />
            <MetricChip index={1} label="em aberto" value={String(lab.stats.openRequests)} tone="aqua" />
            <MetricChip index={2} label="salvos" value={String(lab.stats.succeededBatches)} tone="gold" />
            <MetricChip index={3} label="falhas" value={String(lab.stats.failedBatches)} tone="coral" />
          </div>
        </div>
      </GSAPSectionReveal>

      <div className="relative mt-5">
        <IntakePipeline />
      </div>

      <GSAPScrollEntrance
        className="relative mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[1.05fr_0.95fr]"
        stagger={0.06}
        y={18}
      >
        <motion.form
          ref={signalFormRef}
          onSubmit={submitSignal}
          className="gse-item relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(237,73,86,0.24)] bg-[linear-gradient(155deg,rgba(237,73,86,0.08),rgba(255,255,255,0.025)_46%,rgba(0,0,0,0.22))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(237,73,86,0.72)] to-transparent" aria-hidden="true" />
          <LabCardHeader tone="acid" icon={Sparkles} label="novo sinal" title="Criar oportunidade" />

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="titulo">
              <input className={fieldClass} name="signalTitle" placeholder="Formato em 3 cortes" required />
            </Field>
            <Field label="publico">
              <input className={fieldClass} name="audience" placeholder="Beleza, lifestyle, creators" />
            </Field>
            <Field label="mercado">
              <select className={fieldClass} name="market" defaultValue="BR">
                <option value="BR">Brasil</option>
                <option value="US">EUA early signal</option>
              </select>
            </Field>
            <Field label="tipo">
              <select className={fieldClass} name="signalType" defaultValue="FORMAT">
                {signalTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="fonte">
              <input className={fieldClass} name="sourceTitle" placeholder="Review manual BR" required />
            </Field>
            <Field label="canal">
              <select className={fieldClass} name="sourceKind" defaultValue="MANUAL_RESEARCH">
                {sourceKinds.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="uso">
              <select className={fieldClass} name="sourceOrigin" defaultValue="MANUAL">
                <option value="MANUAL">manual</option>
                <option value="OFFICIAL">oficial registrado</option>
                <option value="OWNED">proprio/licenciado</option>
              </select>
            </Field>
            <Field label="prova">
              <input className={fieldClass} name="evidenceTitle" placeholder="Padrao observado" required />
            </Field>
            <Field label="url">
              <input className={fieldClass} name="evidenceUrl" placeholder="https://..." type="url" />
            </Field>
            <Field label="nota">
              <input className={fieldClass} name="evidenceNote" placeholder="O que esse sinal confirma" required />
            </Field>
          </div>

          <Field label="resumo">
            <textarea
              className={cn(fieldClass, "min-h-20 resize-none")}
              name="summary"
              placeholder="Resumo do que chamou atencao e por que merece entrar no radar."
            />
          </Field>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ResultBadge result={signalResult} />
            <SubmitButton tone="acid" loading={isCreating} icon={Plus}>
              adicionar ao radar
            </SubmitButton>
          </div>
        </motion.form>

        <div className="gse-item grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <motion.form
            ref={evidenceFormRef}
            onSubmit={submitEvidence}
            className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(230,183,101,0.24)] bg-[linear-gradient(155deg,rgba(230,183,101,0.08),rgba(255,255,255,0.025)_48%,rgba(0,0,0,0.22))] p-4"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(230,183,101,0.7)] to-transparent" aria-hidden="true" />
            <LabCardHeader tone="gold" icon={Link2} label="ligar prova" title="Fortalecer um sinal" />

            <div className="mt-4 grid gap-3">
              <Field label="sinal">
                <select className={fieldClass} name="signalId" defaultValue={signalOptions[0]?.id ?? ""}>
                  {signalOptions.length === 0 ? (
                    <option value="">Nenhum sinal disponivel</option>
                  ) : (
                    signalOptions.map((signal) => (
                      <option key={signal.id} value={signal.id}>
                        {signal.title}
                      </option>
                    ))
                  )}
                </select>
              </Field>
              <Field label="fonte">
                <select className={fieldClass} name="sourceId" defaultValue={sourceOptions[0]?.id ?? ""}>
                  {sourceOptions.length === 0 ? (
                    <option value="">Nenhuma fonte disponivel</option>
                  ) : (
                    sourceOptions.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}
                      </option>
                    ))
                  )}
                </select>
              </Field>
              <Field label="prova">
                <input className={fieldClass} name="appendEvidenceTitle" placeholder="Nova leitura relevante" required />
              </Field>
              <Field label="url">
                <input className={fieldClass} name="appendEvidenceUrl" placeholder="https://..." type="url" />
              </Field>
              <Field label="nota">
                <input className={fieldClass} name="appendEvidenceNote" placeholder="O que essa prova melhora" required />
              </Field>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ResultBadge result={evidenceResult} />
              <SubmitButton
                tone="gold"
                loading={isAttaching}
                disabled={signalOptions.length === 0 || sourceOptions.length === 0}
                icon={Link2}
              >
                anexar prova
              </SubmitButton>
            </div>
          </motion.form>

          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(88,200,190,0.22)] bg-[rgba(0,0,0,0.2)] p-4">
            <LabCardHeader tone="aqua" icon={RadioTower} label="fontes prontas" title="Origem permitida" />
            <div className="mt-3 grid gap-2">
              {lab.connectors.length === 0 ? (
                <PipelineEmptyState
                  icon={RadioTower}
                  title="Nenhuma fonte pronta"
                  body="Adicione uma fonte oficial, propria ou licenciada para alimentar o radar."
                  tone="aqua"
                />
              ) : (
                lab.connectors.slice(0, 4).map((connector, index) => (
                  <motion.div
                    key={connector.id}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.34, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[rgba(88,200,190,0.16)] bg-[rgba(88,200,190,0.045)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{connector.title}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">Fonte aprovada - {connector.origin}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em]", statusTone(connector.status))}>
                      ativa
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </GSAPScrollEntrance>

      <GSAPScrollEntrance
        className="relative mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[1.2fr_0.8fr]"
        stagger={0.06}
        y={18}
      >
        <div className="gse-item rounded-[var(--radius-lg)] border border-[rgba(237,73,86,0.18)] bg-[rgba(0,0,0,0.22)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
            <GitBranch className="h-4 w-4" aria-hidden="true" />
            historico recente
          </div>
          <div className="mt-4 grid gap-3">
            {lab.batches.length === 0 ? (
              <PipelineEmptyState
                icon={GitBranch}
                title="Nenhum lote processado"
                body="Quando voce adicionar o primeiro sinal, ele aparece aqui."
                tone="acid"
              />
            ) : (
              lab.batches.slice(0, 4).map((batch, index) => (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.36, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-[var(--radius-md)] border border-[rgba(239,233,220,0.12)] bg-[rgba(255,255,255,0.026)] p-3"
                >
                  <span className="absolute bottom-0 left-0 top-0 w-px bg-gradient-to-b from-[rgba(237,73,86,0.75)] via-[rgba(230,183,101,0.45)] to-transparent" aria-hidden="true" />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{batch.title}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {batch.market} - {formatOperationDateTime(batch.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={batch.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted-strong)]">
                    <span>{batch.requestTitle ?? "entrada"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                    <span>{batch.sourceTitle ?? "fonte"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                    <span>{batch.snapshotCount} leitura</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                    <span>{batch.signalTitles[0] ?? "sinal"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden="true" />
                    <span>{batch.evidenceTitles.length} evid.</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {batch.steps.map((step) => (
                      <div key={`${batch.id}-${step.name}`} className={cn("rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.1em]", statusTone(step.status))}>
                        {step.status === "SUCCEEDED" ? "feito" : step.status.toLowerCase()}
                      </div>
                    ))}
                  </div>
                  {batch.error && (
                    <p className="mt-3 rounded-[var(--radius-sm)] border border-[rgba(255,111,97,0.28)] bg-[rgba(255,111,97,0.06)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--coral)]">
                      {batch.error}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="gse-item grid gap-4">
          <div className="rounded-[var(--radius-lg)] border border-[rgba(230,183,101,0.18)] bg-[rgba(0,0,0,0.22)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              ultimas atualizacoes
            </div>
            <div className="mt-3 grid gap-2">
              {lab.jobs.length === 0 ? (
                <PipelineEmptyState
                  icon={ClipboardList}
                  title="Nenhuma atualizacao"
                  body="As mudancas aparecem aqui depois da primeira entrada."
                  tone="gold"
                />
              ) : (
                lab.jobs.slice(0, 5).map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.32, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[var(--radius-sm)] border border-[rgba(230,183,101,0.16)] bg-[rgba(230,183,101,0.045)] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">Radar atualizado</p>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {formatOperationDateTime(job.finishedAt)}
                    </p>
                    {job.error && (
                      <p className="mt-2 rounded-[var(--radius-sm)] border border-[rgba(255,111,97,0.28)] bg-[rgba(255,111,97,0.06)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--coral)]">
                        {job.error}
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[rgba(237,73,86,0.22)] bg-[linear-gradient(135deg,rgba(237,73,86,0.09),rgba(0,0,0,0.18))] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acid)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              regra de uso
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
              So entra no radar dado manual, proprio, oficial ou licenciado. Falhou, aparece como falha.
            </p>
          </div>
        </div>
      </GSAPScrollEntrance>
    </section>
  );
}
