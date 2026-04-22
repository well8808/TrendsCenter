"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/authorization";
import { requireTenantContextForAction } from "@/lib/auth/session";
import { ingestTrendVideos, parseTrendImportForm } from "@/lib/trends/ingestion";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function ingestTrendVideosAction(formData: FormData) {
  const context = await requireTenantContextForAction();
  requirePermission(context, "operateSignals");
  const input = parseTrendImportForm({
    sourceTitle: formValue(formData, "sourceTitle"),
    sourceKind: formValue(formData, "sourceKind"),
    sourceOrigin: formValue(formData, "sourceOrigin"),
    market: formValue(formData, "market"),
    sourceUrl: formValue(formData, "sourceUrl"),
    payloadJson: formValue(formData, "payloadJson"),
    submittedBy: context.userEmail,
  });
  const result = await ingestTrendVideos(input, context);

  revalidatePath("/trends");

  if (!result.ok) {
    redirect(`/trends?error=${encodeURIComponent(result.message)}`);
  }

  redirect(`/trends?status=${encodeURIComponent(result.message)}&sort=recency`);
}
