"use server";
import { isSupportedLocale } from "@/modules/localization/config";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createPriceListService } from "@/lib/server/price-list-services";
import type { PriceReadOutcome } from "@/modules/price-list/application/read-price-list";
export async function readQuotePricesAction(
  locale: string,
  input: unknown,
): Promise<PriceReadOutcome> {
  if (!isSupportedLocale(locale)) return { kind: "UNAVAILABLE" };
  const context = await resolveServerRuntimeContext();
  if (!context) return { kind: "UNAVAILABLE" };
  return createPriceListService().execute({ ...context, locale }, input);
}
