"use server";

import { revalidatePath } from "next/cache";

import { toggleSavedSignal } from "@/lib/persistence/command-center";

export async function toggleSavedSignalAction(signalId: string) {
  const result = await toggleSavedSignal(signalId);
  revalidatePath("/");

  return result;
}
