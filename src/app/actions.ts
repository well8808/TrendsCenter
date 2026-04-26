"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/authorization";
import { requireTenantContextForAction } from "@/lib/auth/session";
import { attachManualEvidence, createManualSignalWithEvidence } from "@/lib/ingestion/service";
import { toggleSavedSignal } from "@/lib/persistence/command-center";
import type { DataOrigin, Market, SignalType, SourceKind } from "@/lib/types";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function toggleSavedSignalAction(signalId: string) {
  const context = await requireTenantContextForAction();
  requirePermission(context, "operateSignals");
  const result = await toggleSavedSignal(signalId, context);
  revalidatePath("/");

  return result;
}

export async function createManualSignalAction(formData: FormData) {
  try {
    const context = await requireTenantContextForAction();
    requirePermission(context, "operateSignals");
    const result = await createManualSignalWithEvidence(
      {
        title: formValue(formData, "signalTitle"),
        summary: formValue(formData, "summary"),
        type: formValue(formData, "signalType") as SignalType,
        market: formValue(formData, "market") as Market,
        audience: formValue(formData, "audience"),
        sourceTitle: formValue(formData, "sourceTitle"),
        sourceKind: formValue(formData, "sourceKind") as SourceKind,
        sourceOrigin: formValue(formData, "sourceOrigin") as DataOrigin,
        evidenceTitle: formValue(formData, "evidenceTitle"),
        evidenceUrl: formValue(formData, "evidenceUrl") || undefined,
        evidenceNote: formValue(formData, "evidenceNote"),
        submittedBy: context.userEmail,
      },
      context,
    );
    revalidatePath("/");

    return result;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Falha ao registrar ingestão manual.",
    };
  }
}

export async function attachManualEvidenceAction(formData: FormData) {
  try {
    const context = await requireTenantContextForAction();
    requirePermission(context, "operateSignals");
    const result = await attachManualEvidence(
      {
        signalId: formValue(formData, "signalId"),
        sourceId: formValue(formData, "sourceId"),
        evidenceTitle: formValue(formData, "appendEvidenceTitle"),
        evidenceUrl: formValue(formData, "appendEvidenceUrl") || undefined,
        evidenceNote: formValue(formData, "appendEvidenceNote"),
        submittedBy: context.userEmail,
      },
      context,
    );
    revalidatePath("/");

    return result;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Falha ao anexar evidência.",
    };
  }
}
