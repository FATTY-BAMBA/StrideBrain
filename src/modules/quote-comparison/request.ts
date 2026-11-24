import type { Locale } from "@/modules/localization/config";
import type { QuoteComparison } from "./application/quote-comparison";
/** Separate HTTP requests keep a slow comparison outside the editor's Server Action queue. */
export async function requestQuoteComparison(
  locale: Locale,
  projectKey: string,
  action: "READ" | "RUN",
): Promise<QuoteComparison> {
  try {
    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectKey)}/quote-comparison?locale=${locale}`,
      {
        method: action === "RUN" ? "POST" : "GET",
        cache: "no-store",
        credentials: "same-origin",
        signal: AbortSignal.timeout(60000),
      },
    );
    return response.ok ? ((await response.json()) as QuoteComparison) : { kind: "UNAVAILABLE" };
  } catch {
    return { kind: "UNAVAILABLE" };
  }
}
