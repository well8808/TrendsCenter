"use client";

import { Check, ClipboardCheck, Copy, Lightbulb, ListChecks, MessageSquareText, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ContentDraftSummary } from "@/lib/trends/content-draft";
import type { ContentIdeaBrief } from "@/lib/trends/content-idea-brief";
import { formatContentIdeaBriefForCopy } from "@/lib/trends/content-idea-brief";
import { cn } from "@/lib/utils";

interface ContentIdeaBriefPanelProps {
  idea: ContentIdeaBrief;
  videoId?: string;
  contentDraft?: ContentDraftSummary;
  createDraftAction?: (formData: FormData) => void | Promise<void>;
}

interface CopyButtonProps {
  copyKey: string;
  label: string;
  text: string;
  activeKey: string | null;
  onCopy: (copyKey: string, text: string) => void;
  variant?: "primary" | "ghost";
}

function structureText(idea: ContentIdeaBrief) {
  return idea.suggestedStructure.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback for local/http QA and older browsers.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function CopyButton({ copyKey, label, text, activeKey, onCopy, variant = "ghost" }: CopyButtonProps) {
  const copied = activeKey === copyKey;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hot)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.14)] text-[color:var(--hot)] hover:bg-[rgba(237,73,86,0.2)]"
          : "border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.025)] text-[color:var(--muted-strong)] hover:border-[rgba(237,73,86,0.26)] hover:text-[color:var(--foreground)]",
      )}
      aria-label={label}
      data-copy-action={copyKey}
      disabled={!text.trim()}
      onClick={() => onCopy(copyKey, text)}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? "Copiado" : label}
    </button>
  );
}

export function ContentIdeaBriefPanel({
  idea,
  videoId,
  contentDraft,
  createDraftAction,
}: ContentIdeaBriefPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullBrief = useMemo(() => formatContentIdeaBriefForCopy(idea), [idea]);
  const structure = useMemo(() => structureText(idea), [idea]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy(copyKey: string, text: string) {
    const ok = await copyText(text);

    if (!ok) {
      setCopiedKey("failed");
      return;
    }

    setCopiedKey(copyKey);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => setCopiedKey(null), 1800);
  }

  return (
    <section
      className={cn(
        "app-panel overflow-hidden rounded-[var(--radius-lg)] p-5 md:p-6",
        idea.isReady
          ? "border-[rgba(237,73,86,0.22)] bg-[linear-gradient(135deg,rgba(237,73,86,0.065),rgba(255,255,255,0.018)_48%,rgba(247,119,55,0.04))]"
          : "border-[rgba(255,255,255,0.08)]",
      )}
      aria-labelledby="content-idea-brief"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="section-head text-[color:var(--hot)]">
            <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            pauta pronta
            <span className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.18)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
              confianca {idea.confidenceLabel}
            </span>
          </div>
          <h2 id="content-idea-brief" className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] text-[color:var(--foreground)]">
            {idea.isReady ? idea.title : "Transforme este Reel em pauta para organizar a ideia"}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[color:var(--muted)]">
          {idea.isReady
            ? "Material pronto para copiar, adaptar e levar para roteiro. Use como direcao criativa, nao como copia da peca original."
            : "A pauta completa aparece aqui quando este Reel for promovido para Transformar em pauta."}
        </p>
      </div>

      {idea.isReady ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Acoes da pauta">
            {contentDraft ? (
              <Link
                href={`/studio/${contentDraft.id}`}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[rgba(64,224,208,0.28)] bg-[rgba(64,224,208,0.08)] px-3 py-2 text-[11px] font-semibold text-[color:var(--aqua)] transition hover:bg-[rgba(64,224,208,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--aqua)]"
              >
                Continuar no Estudio
                <span className="rounded-full border border-[rgba(255,255,255,0.1)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--muted-strong)]">
                  {contentDraft.statusLabel}
                </span>
              </Link>
            ) : createDraftAction && videoId ? (
              <form action={createDraftAction}>
                <input type="hidden" name="videoId" value={videoId} />
                <button
                  type="submit"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.16)] px-3 py-2 text-[11px] font-semibold text-[color:var(--hot)] transition hover:bg-[rgba(237,73,86,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hot)]"
                >
                  Criar roteiro editavel
                </button>
              </form>
            ) : null}
            <CopyButton copyKey="full" label="Copiar pauta completa" text={fullBrief} activeKey={copiedKey} onCopy={handleCopy} variant="primary" />
            <CopyButton copyKey="hook" label="Copiar gancho" text={idea.hook} activeKey={copiedKey} onCopy={handleCopy} />
            <CopyButton copyKey="structure" label="Copiar estrutura" text={structure} activeKey={copiedKey} onCopy={handleCopy} />
            <CopyButton copyKey="caption" label="Copiar legenda" text={idea.captionStarter} activeKey={copiedKey} onCopy={handleCopy} />
            <CopyButton copyKey="cta" label="Copiar CTA" text={idea.cta} activeKey={copiedKey} onCopy={handleCopy} />
          </div>

          <p className="sr-only" aria-live="polite">
            {copiedKey === "failed" ? "Nao foi possivel copiar." : copiedKey ? "Copiado." : ""}
          </p>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-3">
              <div className="rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">ideia central</p>
                  <Sparkles className="h-4 w-4 shrink-0 text-[color:var(--hot)]" aria-hidden="true" />
                </div>
                <p className="mt-2 text-base font-semibold leading-6 text-[color:var(--foreground)]">
                  {idea.angle}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  {idea.formatToCopy}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[var(--radius-lg)] border border-[rgba(243,201,105,0.16)] bg-[rgba(243,201,105,0.035)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--gold)]">gancho sugerido</p>
                  <CopyButton copyKey="hook-inline" label="Copiar gancho" text={idea.hook} activeKey={copiedKey} onCopy={handleCopy} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">{idea.hook}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[rgba(64,224,208,0.16)] bg-[rgba(64,224,208,0.035)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aqua)]">legenda inicial</p>
                    <CopyButton copyKey="caption-inline" label="Copiar legenda" text={idea.captionStarter} activeKey={copiedKey} onCopy={handleCopy} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">{idea.captionStarter}</p>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.018)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-[color:var(--hot)]" aria-hidden="true" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">estrutura do conteudo</p>
                  </div>
                  <CopyButton copyKey="structure-inline" label="Copiar estrutura" text={structure} activeKey={copiedKey} onCopy={handleCopy} />
                </div>
                <ol className="mt-3 grid gap-2">
                  {idea.suggestedStructure.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                      <span className="metric-number mt-0.5 text-sm font-semibold text-[color:var(--hot)]">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <aside className="grid content-start gap-3">
              <div className="rounded-[var(--radius-lg)] border border-[rgba(237,73,86,0.22)] bg-[rgba(237,73,86,0.055)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--hot)]">cta</p>
                  <CopyButton copyKey="cta-inline" label="Copiar CTA" text={idea.cta} activeKey={copiedKey} onCopy={handleCopy} />
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--foreground)]">{idea.cta}</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.18)] p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">cuidados / risco</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">{idea.riskNotes}</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.18)] p-4">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-[color:var(--aqua)]" aria-hidden="true" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">evidencias usadas</p>
                </div>
                <ul className="mt-3 grid gap-2">
                  {idea.evidence.slice(0, 5).map((item) => (
                    <li key={item} className="text-[12px] leading-5 text-[color:var(--muted-strong)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-[var(--radius-lg)] border border-dashed border-[rgba(237,73,86,0.18)] bg-[rgba(237,73,86,0.035)] p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--hot)]" aria-hidden="true" />
            <p className="text-sm leading-6 text-[color:var(--muted-strong)]">
              Salvar guarda a referencia. Observar acompanha a tendencia. Transformar em pauta cria este brief copiavel com gancho,
              estrutura, CTA, risco e evidencias reais. Usado registra que a ideia ja virou conteudo. Descartar tira da fila ativa.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
