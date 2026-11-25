import { getServerEnvironment } from "@/lib/env/server-env";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createPriceListService } from "@/lib/server/price-list-services";
import { isSupportedLocale } from "@/modules/localization/config";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(request: Request) {
  const unavailable = () => Response.json({ kind: "UNAVAILABLE" }, { status: 404, headers });
  const invalid = () => Response.json({ kind: "INVALID" }, { status: 400, headers });
  try {
    const url = new URL(request.url),
      origin = getServerEnvironment().appOrigin.origin;
    // Same-origin fetches may omit Origin on GET. The custom header requires a CORS
    // preflight elsewhere; this private endpoint grants no CORS permission.
    if (
      url.origin !== origin ||
      request.headers.get("x-stridebrain-price-read") !== "1" ||
      (request.headers.has("origin") && request.headers.get("origin") !== origin) ||
      (request.headers.has("sec-fetch-site") &&
        request.headers.get("sec-fetch-site") !== "same-origin")
    )
      return unavailable();
    const context = await resolveServerRuntimeContext();
    if (!context?.capabilities.has("project:read") || !context.capabilities.has("quote:read"))
      return unavailable();
    if (request.url.length > 8192 || request.body) return invalid();
    const query = url.searchParams;
    const keys = ["locale", "mode", "search", "unit", "page", "projectKey"];
    if (query.size !== keys.length || keys.some((key) => query.getAll(key).length !== 1))
      return invalid();
    const locale = query.get("locale");
    if (!locale || !isSupportedLocale(locale)) return invalid();
    const page = query.get("page")!;
    const result = await createPriceListService().execute(
      { ...context, locale },
      {
        mode: query.get("mode"),
        search: query.get("search"),
        unit: query.get("unit"),
        page: /^\d{1,5}$/.test(page) ? Number(page) : 0,
        projectKey: query.get("projectKey") || null,
      },
    );
    return Response.json(result, {
      status: result.kind === "UNAVAILABLE" ? 404 : result.kind === "INVALID" ? 400 : 200,
      headers,
    });
  } catch {
    return unavailable();
  }
}
