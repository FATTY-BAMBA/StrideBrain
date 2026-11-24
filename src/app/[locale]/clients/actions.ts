"use server";
import { revalidatePath } from "next/cache";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createClientServices } from "@/lib/server/client-services";
import { isSupportedLocale } from "@/modules/localization/config";
export async function updateClientAction(locale: unknown, input: unknown) {
  if (typeof locale !== "string" || !isSupportedLocale(locale))
    return { kind: "UNAVAILABLE" } as const;
  const context = await resolveServerRuntimeContext();
  if (!context) return { kind: "UNAVAILABLE" } as const;
  const result = await createClientServices().update.execute({ ...context, locale }, input);
  if (result.kind === "SAVED") {
    revalidatePath(`/${locale}/clients`);
    revalidatePath(`/${locale}/clients/${result.businessKey}`);
  }
  return result;
}
