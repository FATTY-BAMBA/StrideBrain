"use server";
import { revalidatePath } from "next/cache";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createQuoteIssueServices } from "@/lib/server/quote-issue-services";
import { isSupportedLocale } from "@/modules/localization/config";
import type { IssueOutcome } from "@/modules/quote-issue/domain/contracts";
async function actor(locale: string) {
  if (!isSupportedLocale(locale)) return null;
  const context = await resolveServerRuntimeContext();
  return context ? { ...context, locale } : null;
}
export async function prepareQuoteIssueAction(locale: string, raw: unknown) {
  try {
    const context = await actor(locale);
    return context
      ? await createQuoteIssueServices().prepare.execute(context, raw)
      : { kind: "UNAVAILABLE" as const };
  } catch {
    return { kind: "UNAVAILABLE" as const };
  }
}
export async function quoteIssueMutationAction(
  locale: string,
  operation: "issue" | "revise" | "accept" | "resolve" | "saveFirm",
  raw: unknown,
): Promise<IssueOutcome> {
  try {
    const context = await actor(locale);
    if (!context || !["issue", "revise", "accept", "resolve", "saveFirm"].includes(operation))
      return { kind: "UNAVAILABLE" };
    const result = await createQuoteIssueServices()[operation].execute(context, raw);
    if (["ISSUED", "REVISED", "ACCEPTED", "RESOLVED", "SETTINGS_SAVED"].includes(result.kind)) {
      // Both languages read the same organization records.
      for (const language of ["en", "zh-TW"]) revalidatePath(`/${language}`, "layout");
    }
    return result;
  } catch {
    return { kind: "UNAVAILABLE" };
  }
}
