"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/authorization";
import { requireTenantContextForAction } from "@/lib/auth/session";
import { setOpportunityDecision } from "@/lib/trends/decision-queue";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function setOpportunityDecisionAction(formData: FormData): Promise<void> {
  const context = await requireTenantContextForAction();
  requirePermission(context, "operateSignals");
  const videoId = formValue(formData, "videoId");
  const action = formValue(formData, "action");
  const notes = formValue(formData, "notes");

  await setOpportunityDecision(context, {
    videoId,
    action,
    notes: notes || undefined,
  });

  revalidatePath("/");
  revalidatePath("/trends");

  if (videoId) {
    revalidatePath(`/trends/${videoId}`);
  }

}
