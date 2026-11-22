"use server";
import { revalidatePath } from "next/cache";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createAssistantControlServices } from "@/lib/server/assistant-services";
import { isSupportedLocale } from "@/modules/localization/config";
import type { AssistantControlOutcome } from "@/repositories/ports/assistant-repository";
export async function setAssistantControlAction(
  locale: string,
  raw: unknown,
): Promise<AssistantControlOutcome> {
  if (!isSupportedLocale(locale)) return { kind: "INVALID" };
  try {
    const context = await resolveServerRuntimeContext();
    if (!context) return { kind: "UNAVAILABLE" };
    const result = await createAssistantControlServices().control.execute(
      { ...context, locale },
      raw,
    );
    if (result.kind === "SAVED")
      for (const language of ["en", "zh-TW"]) revalidatePath(`/${language}`, "layout");
    return result;
  } catch {
    return { kind: "UNAVAILABLE" };
  }
}
