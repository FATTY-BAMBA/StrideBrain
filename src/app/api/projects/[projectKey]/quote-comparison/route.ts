import { getServerEnvironment } from "@/lib/env/server-env";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createQuoteDraftServices } from "@/lib/server/quote-draft-services";
import { QuoteComparisonService } from "@/modules/quote-comparison/application/quote-comparison";
import { isSupportedLocale } from "@/modules/localization/config";
import { isSameOriginReviewRequest } from "@/modules/internal-review-experience/http-contract";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
type Params = { params: Promise<{ projectKey: string }> };
async function respond(request: Request, params: Params, action: "READ" | "RUN") {
  const unavailable = () => Response.json({ kind: "UNAVAILABLE" }, { status: 404, headers });
  try {
    if (
      action === "RUN" &&
      !isSameOriginReviewRequest(request, getServerEnvironment().appOrigin.origin)
    )
      return unavailable();
    if (request.body) return unavailable();
    const query = new URL(request.url).searchParams;
    const locale = query.get("locale");
    if (query.size !== 1 || !locale || !isSupportedLocale(locale)) return unavailable();
    const context = await resolveServerRuntimeContext();
    if (!context) return unavailable();
    const { projectKey } = await params.params;
    const comparisons = createComparisonServices(),
      quote = createQuoteDraftServices();
    const outcome = await new QuoteComparisonService(
      quote.read,
      comparisons.getHomeComparison,
      comparisons.runComparison,
      comparisons.runEconomics,
      quote.prepare,
    ).execute({ ...context, locale }, projectKey, action);
    return Response.json(outcome, { status: outcome.kind === "UNAVAILABLE" ? 404 : 200, headers });
  } catch {
    return unavailable();
  }
}
export async function GET(request: Request, params: Params) {
  return respond(request, params, "READ");
}
export async function POST(request: Request, params: Params) {
  return respond(request, params, "RUN");
}
