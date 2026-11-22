"use server";
import { revalidatePath } from "next/cache";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createQuoteDraftServices } from "@/lib/server/quote-draft-services";
import { isSupportedLocale } from "@/modules/localization/config";
import type { PrepareDraftOutcome } from "@/modules/quote-draft/application/prepare-quote-draft";
import type { SaveDraftOutcome } from "@/modules/quote-draft/application/save-quote-draft";
import type { QuoteDraftView } from "@/modules/quote-draft/application/get-quote-draft";
import type { DraftEvidenceInput } from "@/modules/quote-draft/application/get-quote-draft-evidence";
import type { EvidencePanelOutcome } from "@/modules/evidence-panel/contracts";
async function actor(locale: string) {
  if (!isSupportedLocale(locale)) return null;
  const context = await resolveServerRuntimeContext();
  return context ? { ...context, locale } : null;
}
export async function prepareQuoteDraftAction(
  locale: string,
  projectKey: string,
): Promise<PrepareDraftOutcome> {
  try {
    const context = await actor(locale);
    return context && typeof projectKey === "string" && projectKey.length <= 128
      ? await createQuoteDraftServices().prepare.execute(context, projectKey)
      : { kind: "UNAVAILABLE" };
  } catch {
    return { kind: "UNAVAILABLE" };
  }
}
export async function saveQuoteDraftAction(
  locale: string,
  raw: unknown,
): Promise<{ result: SaveDraftOutcome; view?: QuoteDraftView }> {
  try {
    const context = await actor(locale);
    if (!context) return { result: { kind: "UNAVAILABLE" } };
    const services = createQuoteDraftServices(),
      result = await services.save.execute(context, raw);
    if (result.kind !== "SAVED") return { result };
    const key = (raw as { projectKey: string }).projectKey;
    revalidatePath(`/${locale}/projects`, "layout");
    revalidatePath(`/${locale}`);
    return { result, view: await services.read.execute(context, key) };
  } catch {
    return { result: { kind: "UNAVAILABLE" } };
  }
}
export async function previewQuoteTotalsAction(locale: string, raw: unknown) {
  try {
    const context = await actor(locale);
    return context ? await createQuoteDraftServices().totals.execute(context, raw) : null;
  } catch {
    return null;
  }
}
export async function quoteDraftEvidenceAction(
  locale: string,
  input: DraftEvidenceInput,
): Promise<EvidencePanelOutcome> {
  try {
    const context = await actor(locale);
    if (
      !context ||
      !input ||
      typeof input.projectKey !== "string" ||
      input.projectKey.length > 128 ||
      typeof input.categoryId !== "string" ||
      input.categoryId.length > 80 ||
      !(
        input.preparationToken === null ||
        (typeof input.preparationToken === "string" && input.preparationToken.length <= 100_000)
      ) ||
      JSON.stringify(input).length > 102_000
    )
      return { kind: "UNAVAILABLE", requestId: "" };
    return await createQuoteDraftServices().evidence.execute(context, input);
  } catch {
    return { kind: "FAILED", requestId: "" };
  }
}
