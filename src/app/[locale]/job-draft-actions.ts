"use server";
import { randomUUID } from "node:crypto";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createJobDraftService } from "@/lib/server/job-draft-services";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { generateJobReference } from "@/lib/server/job-reference";
import { isSupportedLocale } from "@/modules/localization/config";
import type { JobDraftActionState } from "@/modules/assistant/application/job-draft-action-state";

async function draft(
  locale: string,
  text: unknown,
  maxLength: number,
): Promise<JobDraftActionState> {
  const unavailable = { outcome: { kind: "UNAVAILABLE", reason: "UNAVAILABLE" } } as const;
  if (!isSupportedLocale(locale)) return unavailable;
  try {
    const runtime = await resolveServerRuntimeContext();
    if (!runtime?.capabilities.has("project:create") || !runtime.capabilities.has("project:read"))
      return unavailable;
    if (typeof text !== "string" || !text.trim() || text.length > maxLength)
      return { outcome: { kind: "UNAVAILABLE", reason: "INVALID_OUTPUT" } };
    const context = { ...runtime, locale };
    const clients = await createProjectWriteServices().listClients.execute(context);
    if (clients.kind !== "AVAILABLE") return unavailable;
    const form = {
      businessKey: generateJobReference(),
      idempotencyKey: randomUUID(),
      clients: clients.clients,
    };
    try {
      return { form, outcome: await createJobDraftService().execute(context, text) };
    } catch {
      return { form, ...unavailable };
    }
  } catch {
    return unavailable;
  }
}
export async function draftJobFromHome(locale: string, text: unknown) {
  return draft(locale, text, 280);
}
export async function draftJobFromNewPage(locale: string, text: unknown) {
  return draft(locale, text, 1000);
}
