"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/authorization";
import { requireTenantContextForAction } from "@/lib/auth/session";
import {
  createOrOpenContentDraftFromOpportunity,
  updateContentDraft,
} from "@/lib/trends/content-draft-service";

export interface ContentDraftActionState {
  ok: boolean;
  message: string;
  draftId?: string;
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function statusFromIntent(intent: string, fallback: string) {
  if (intent === "ready") return "READY";
  if (intent === "scheduled") return "SCHEDULED";
  if (intent === "published") return "PUBLISHED";
  if (intent === "archived") return "ARCHIVED";

  return fallback || "DRAFT";
}

export async function createOrOpenContentDraftAction(formData: FormData): Promise<void> {
  const context = await requireTenantContextForAction();
  requirePermission(context, "operateSignals");
  const videoId = formValue(formData, "videoId");
  const result = await createOrOpenContentDraftFromOpportunity(context, videoId);

  if (!result.ok) {
    redirect(`/trends/${videoId}`);
  }

  revalidatePath("/studio");
  revalidatePath(`/studio/${result.draftId}`);
  revalidatePath("/trends");
  revalidatePath(`/trends/${videoId}`);
  redirect(`/studio/${result.draftId}`);
}

export async function saveContentDraftAction(
  _prevState: ContentDraftActionState,
  formData: FormData,
): Promise<ContentDraftActionState> {
  const context = await requireTenantContextForAction();
  requirePermission(context, "operateSignals");
  const draftId = formValue(formData, "draftId");
  const intent = formValue(formData, "intent");
  const status = statusFromIntent(intent, formValue(formData, "status"));

  const draft = await updateContentDraft(context, draftId, {
    title: formValue(formData, "title"),
    centralIdea: formValue(formData, "centralIdea"),
    hook: formValue(formData, "hook"),
    structureText: formValue(formData, "structureText"),
    scriptDraft: formValue(formData, "scriptDraft"),
    captionDraft: formValue(formData, "captionDraft"),
    cta: formValue(formData, "cta"),
    riskNotes: formValue(formData, "riskNotes"),
    notes: formValue(formData, "notes"),
    channel: formValue(formData, "channel"),
    scheduledFor: formValue(formData, "scheduledFor"),
    status,
  });

  if (!draft) {
    return {
      ok: false,
      message: "Roteiro nao encontrado para este workspace.",
      draftId,
    };
  }

  revalidatePath("/studio");
  revalidatePath(`/studio/${draft.id}`);
  revalidatePath("/trends");
  revalidatePath(`/trends/${draft.video.id}`);

  return {
    ok: true,
    message:
      intent === "ready"
        ? "Marcado como pronto."
        : intent === "published"
          ? "Marcado como publicado."
          : intent === "archived"
            ? "Arquivado."
            : "Roteiro salvo.",
    draftId: draft.id,
  };
}
