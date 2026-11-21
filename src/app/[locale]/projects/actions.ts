"use server";

import { revalidatePath } from "next/cache";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { isSupportedLocale } from "@/modules/localization/config";
import type { JobActionState } from "@/modules/projects/application/job-action-state";

export async function updateProjectStageAction(
  _previous: JobActionState,
  form: FormData,
): Promise<JobActionState> {
  const locale = form.get("locale");
  if (typeof locale !== "string" || !isSupportedLocale(locale)) return { message: "unavailable" };
  try {
    const context = await resolveServerRuntimeContext();
    if (!context || !context.capabilities.has("project:update")) return { message: "unavailable" };
    const result = await createProjectWriteServices().updateStage.execute(
      { ...context, locale },
      {
        businessKey: form.get("businessKey"),
        stage: form.get("stage"),
        expectedStage: form.get("expectedStage"),
        idempotencyKey: form.get("idempotencyKey"),
      },
    );
    if (result.kind === "UNAVAILABLE") return { message: "unavailable" };
    if (result.kind === "INVALID") return { message: "validation" };
    if (result.kind === "CONFLICT") return { message: "conflict" };
    if (result.kind === "FAILED") return { message: "failed" };
  } catch {
    return { message: "failed" };
  }
  revalidatePath(`/${locale}/projects`, "layout");
  return { message: "updated" };
}
