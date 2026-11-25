import type { Locale } from "@/modules/localization/config";
import type { PriceQuery } from "./domain/price-input";
import type { PriceReadOutcome } from "./application/read-price-list";
/** A cancellable read, independent of the editor's Server Action queue. */
export async function readQuotePrices(
  locale: Locale,
  input: PriceQuery,
  signal: AbortSignal,
): Promise<PriceReadOutcome> {
  const query = new URLSearchParams({
    locale,
    mode: input.mode,
    search: input.search,
    unit: input.unit,
    page: String(input.page),
    projectKey: input.projectKey ?? "",
  });
  try {
    const response = await fetch(`/api/quotes/prices?${query}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "x-stridebrain-price-read": "1" },
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    });
    return response.ok ? ((await response.json()) as PriceReadOutcome) : { kind: "UNAVAILABLE" };
  } catch {
    return { kind: "UNAVAILABLE" };
  }
}
