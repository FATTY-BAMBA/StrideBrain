import type { Locale } from "@/modules/localization/config";
import type { PriceQuery } from "./domain/price-input";
import type { PriceReadOutcome } from "./application/read-price-list";
/** A cancellable read, independent of the editor's Server Action queue. */
export async function readQuotePrices(
  locale: Locale,
  input: PriceQuery,
  signal: AbortSignal,
): Promise<PriceReadOutcome> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  // Also works in browsers without AbortSignal.any/timeout. Keep the timer
  // active through response decoding, and release both resources on every exit.
  signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 10000);
  try {
    if (signal.aborted) return { kind: "UNAVAILABLE" };
    const response = await fetch("/api/quotes/prices", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "x-stridebrain-price-read": "1", "Content-Type": "application/json" },
      body: JSON.stringify({ locale, ...input }),
      signal: controller.signal,
    });
    return response.ok ? ((await response.json()) as PriceReadOutcome) : { kind: "UNAVAILABLE" };
  } catch {
    return { kind: "UNAVAILABLE" };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
