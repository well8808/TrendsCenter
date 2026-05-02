"use client";

import { Check, Copy, FileText, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ContentDraftActionState } from "@/app/studio/actions";
import {
  contentDraftStatusMeta,
  contentDraftStatusOrder,
  formatContentDraftForCopy,
} from "@/lib/trends/content-draft";
import type { ContentDraftView } from "@/lib/trends/content-draft-service";
import { cn } from "@/lib/utils";

interface ContentDraftEditorProps {
  draft: ContentDraftView;
  action: (state: ContentDraftActionState, formData: FormData) => Promise<ContentDraftActionState>;
}

interface CopyButtonProps {
  label: string;
  copyKey: string;
  text: string;
  activeKey: string | null;
  onCopy: (key: string, text: string) => void;
  primary?: boolean;
}

const initialState: ContentDraftActionState = {
  ok: false,
  message: "",
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back for localhost/http browser QA.
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

function CopyButton({ label, copyKey, text, activeKey, onCopy, primary }: CopyButtonProps) {
  const copied = activeKey === copyKey;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hot)]",
        primary
          ? "border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.14)] text-[color:var(--hot)] hover:bg-[rgba(237,73,86,0.2)]"
          : "border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.025)] text-[color:var(--muted-strong)] hover:border-[rgba(237,73,86,0.26)] hover:text-[color:var(--foreground)]",
      )}
      disabled={!text.trim()}
      onClick={() => onCopy(copyKey, text)}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? "Copiado" : label}
    </button>
  );
}

function SubmitButton({
  intent,
  label,
  icon: Icon,
  tone = "default",
}: {
  intent: string;
  label: string;
  icon: typeof Save;
  tone?: "default" | "hot" | "muted";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hot)] disabled:cursor-wait disabled:opacity-65",
        tone === "hot"
          ? "border-[rgba(237,73,86,0.34)] bg-[rgba(237,73,86,0.14)] text-[color:var(--hot)] hover:bg-[rgba(237,73,86,0.2)]"
          : tone === "muted"
            ? "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[color:var(--muted-strong)] hover:text-[color:var(--foreground)]"
            : "border-[rgba(64,224,208,0.24)] bg-[rgba(64,224,208,0.08)] text-[color:var(--aqua)] hover:bg-[rgba(64,224,208,0.13)]",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {pending ? "Salvando..." : label}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  multiline,
  rows = 4,
  helper,
}: {
  label: string;
  name: string;
  defaultValue: string;
  multiline?: boolean;
  rows?: number;
  helper?: string;
}) {
  const common =
    "mt-2 w-full rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.22)] px-3 py-2.5 text-sm leading-6 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[rgba(237,73,86,0.36)] focus:bg-[rgba(0,0,0,0.3)]";

  return (
    <label className="block">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
        {label}
      </span>
      {multiline ? (
        <textarea className={common} name={name} defaultValue={defaultValue} rows={rows} />
      ) : (
        <input className={common} name={name} defaultValue={defaultValue} />
      )}
      {helper ? <span className="mt-1.5 block text-[11px] leading-4 text-[color:var(--muted)]">{helper}</span> : null}
    </label>
  );
}

export function ContentDraftEditor({ draft, action }: ContentDraftEditorProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyAll = useMemo(() => formatContentDraftForCopy(draft), [draft]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy(key: string, text: string) {
    const ok = await copyText(text);
    setCopiedKey(ok ? key : "failed");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => setCopiedKey(null), 1800);
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="draftId" value={draft.id} />

      <section className="app-panel rounded-[var(--radius-lg)] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="section-head text-[color:var(--hot)]">
              <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
              roteiro editavel
              <span className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.18)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
                {draft.statusLabel}
              </span>
            </div>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
              {draft.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              Edite a pauta sem perder a origem: este roteiro nasceu de um Reel real, uma decisao de oportunidade e evidencias salvas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton label="Copiar tudo" copyKey="all" text={copyAll} activeKey={copiedKey} onCopy={handleCopy} primary />
            <CopyButton label="Copiar roteiro" copyKey="script" text={draft.scriptDraft} activeKey={copiedKey} onCopy={handleCopy} />
            <CopyButton label="Copiar legenda" copyKey="caption" text={draft.captionDraft} activeKey={copiedKey} onCopy={handleCopy} />
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {copiedKey === "failed" ? "Nao foi possivel copiar." : copiedKey ? "Copiado." : ""}
        </p>
        {state.message ? (
          <p
            className={cn(
              "mt-4 rounded-[var(--radius-md)] border px-3 py-2 text-sm",
              state.ok
                ? "border-[rgba(64,224,208,0.2)] bg-[rgba(64,224,208,0.06)] text-[color:var(--aqua)]"
                : "border-[rgba(237,73,86,0.26)] bg-[rgba(237,73,86,0.08)] text-[color:var(--hot)]",
            )}
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4">
          <div className="app-panel rounded-[var(--radius-lg)] p-5">
            <Field label="Titulo" name="title" defaultValue={draft.title} />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Ideia central" name="centralIdea" defaultValue={draft.centralIdea} multiline rows={4} />
              <Field label="Gancho" name="hook" defaultValue={draft.hook} multiline rows={4} />
            </div>
            <div className="mt-4">
              <Field label="Estrutura" name="structureText" defaultValue={draft.structureText} multiline rows={7} />
            </div>
            <div className="mt-4">
              <Field label="Roteiro" name="scriptDraft" defaultValue={draft.scriptDraft} multiline rows={12} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Legenda" name="captionDraft" defaultValue={draft.captionDraft} multiline rows={5} />
              <Field label="CTA" name="cta" defaultValue={draft.cta} multiline rows={5} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Cuidados / risco" name="riskNotes" defaultValue={draft.riskNotes} multiline rows={4} />
              <Field label="Notas internas" name="notes" defaultValue={draft.notes ?? ""} multiline rows={4} helper="Opcional. Use para ajuste de briefing, asset proprio ou responsavel." />
            </div>
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <section className="app-panel rounded-[var(--radius-lg)] p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              status do roteiro
            </p>
            <select
              className="app-control mt-3 w-full"
              name="status"
              defaultValue={draft.status}
              aria-label="Status do roteiro"
            >
              {contentDraftStatusOrder.map((status) => (
                <option key={status} value={status}>
                  {contentDraftStatusMeta[status].label}
                </option>
              ))}
            </select>
            <div className="mt-3 grid gap-3">
              <Field label="Canal" name="channel" defaultValue={draft.channel ?? ""} helper="Ex.: Instagram Reels, Shorts, TikTok ou pauta interna." />
              <Field label="Agendar para" name="scheduledFor" defaultValue={draft.scheduledFor?.slice(0, 16) ?? ""} helper="Opcional. Fica salvo como planejamento, sem publicar nada." />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <SubmitButton intent="save" label="Salvar" icon={Save} />
              <SubmitButton intent="ready" label="Marcar pronto" icon={Check} tone="hot" />
              <SubmitButton intent="published" label="Marcar publicado" icon={Send} tone="hot" />
              <SubmitButton intent="archived" label="Arquivar" icon={Trash2} tone="muted" />
            </div>
          </section>

          <section className="app-panel rounded-[var(--radius-lg)] p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--aqua)]">
              origem real
            </p>
            <Link href={`/trends/${draft.video.id}`} className="mt-3 block rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.18)] p-3 transition hover:border-[rgba(64,224,208,0.28)]">
              <p className="line-clamp-2 text-sm font-semibold text-[color:var(--foreground)]">{draft.video.title}</p>
              <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                {draft.video.creator ? `@${draft.video.creator}` : draft.video.origin} / score {draft.video.trendScore}
              </p>
            </Link>
            <ul className="mt-4 grid gap-2">
              {draft.evidence.slice(0, 5).map((item) => (
                <li key={item} className="text-[12px] leading-5 text-[color:var(--muted-strong)]">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </form>
  );
}
