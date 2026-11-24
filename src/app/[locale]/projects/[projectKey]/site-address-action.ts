"use server";
import { revalidatePath } from "next/cache";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { isSupportedLocale } from "@/modules/localization/config";
import type { SiteAddressOutcome } from "@/repositories/ports/project-site-address-repository";
export async function saveSiteAddressAction(
  locale: string,
  input: unknown,
): Promise<SiteAddressOutcome> {
  try {
    if (!isSupportedLocale(locale)) return { kind: "UNAVAILABLE" };
    const context = await resolveServerRuntimeContext();
    if (!context) return { kind: "UNAVAILABLE" };
    const result = await createProjectWriteServices().siteAddress.update(context, input);
    if (result.kind === "UPDATED") revalidatePath(`/${locale}/projects`, "layout");
    return result;
  } catch {
    return { kind: "UNAVAILABLE" };
  }
}
