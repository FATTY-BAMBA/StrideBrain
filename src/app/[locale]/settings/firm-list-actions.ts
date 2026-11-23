"use server";
import { revalidatePath } from "next/cache";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createFirmListServices } from "@/lib/server/firm-list-services";
import { isSupportedLocale } from "@/modules/localization/config";
export async function changeFirmListAction(locale: unknown, input: unknown) {
  if (typeof locale !== "string" || !isSupportedLocale(locale))
    return { result: { kind: "UNAVAILABLE" as const }, settings: null };
  const context = await resolveServerRuntimeContext();
  if (!context) return { result: { kind: "UNAVAILABLE" as const }, settings: null };
  const service = createFirmListServices(),
    runtime = { ...context, locale },
    result = await service.change.execute(runtime, input);
  if (result.kind !== "SAVED") return { result, settings: null };
  revalidatePath(`/${locale}`, "layout");
  const settings = await service.get.execute(runtime);
  return { result, settings: settings.kind === "AVAILABLE" ? settings : null };
}
