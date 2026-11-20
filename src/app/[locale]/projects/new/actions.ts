"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { isSupportedLocale } from "@/modules/localization/config";
import { JOB_FIELDS } from "@/modules/projects/domain/job-input";
import type { JobActionState } from "@/modules/projects/application/job-action-state";

export async function createProjectAction(
  _previous: JobActionState,
  form: FormData,
): Promise<JobActionState> {
  const locale = form.get("locale");
  if (typeof locale !== "string" || !isSupportedLocale(locale)) return { message: "unavailable" };
  try {
    const context = await resolveServerRuntimeContext();
    if (!context || !context.capabilities.has("project:create")) return { message: "unavailable" };
    const input = Object.fromEntries(
      JOB_FIELDS.map((key) => [key, key === "scopeCategoryIds" ? form.getAll(key) : form.get(key)]),
    );
    const result = await createProjectWriteServices().create.execute({ ...context, locale }, input);
    if (result.kind === "INVALID") return { message: "validation", errors: result.errors };
    if (result.kind === "DUPLICATE")
      return { message: "validation", errors: { businessKey: "duplicate" } };
    if (result.kind === "CLIENT_DUPLICATE")
      return { message: "validation", errors: { clientBusinessKey: "duplicate" } };
    if (result.kind === "CLIENT_UNAVAILABLE")
      return { message: "validation", errors: { clientBusinessKey: "clientUnavailable" } };
    if (result.kind === "UNAVAILABLE") return { message: "unavailable" };
    if (result.kind === "CONFLICT") return { message: "conflict" };
    if (result.kind === "FAILED") return { message: "failed" };
  } catch {
    return { message: "failed" };
  }
  revalidatePath(`/${locale}/projects`, "layout");
  redirect(`/${locale}/projects`);
}
