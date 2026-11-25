import { getServerEnvironment } from "@/lib/env/server-env";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createPriceListService } from "@/lib/server/price-list-services";
import { isSupportedLocale } from "@/modules/localization/config";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const maxBodyBytes = 8192;
async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !==
      "application/json" ||
    Number(request.headers.get("content-length") ?? 0) > maxBodyBytes
  )
    return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(chunk.value);
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    const keys = ["locale", "mode", "search", "unit", "page", "projectKey"];
    const ownKeys = Object.keys(body);
    if (ownKeys.length !== keys.length || ownKeys.some((key) => !keys.includes(key))) return null;
    // Tokenize complete JSON strings so quoted description text is not mistaken
    // for a key. Preserve the former endpoint's rejection of repeated fields.
    const fields = [...text.matchAll(/"(?:\\.|[^"\\])*"/gs)].filter((match) =>
      text
        .slice(match.index + match[0].length)
        .trimStart()
        .startsWith(":"),
    );
    if (fields.length !== keys.length) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
export async function POST(request: Request) {
  const unavailable = () => Response.json({ kind: "UNAVAILABLE" }, { status: 404, headers });
  const invalid = () => Response.json({ kind: "INVALID" }, { status: 400, headers });
  try {
    const url = new URL(request.url),
      origin = getServerEnvironment().appOrigin.origin;
    // Typed document content belongs only in the bounded body, never the URL.
    // The private read requires both same-origin Origin and our custom header.
    if (
      url.origin !== origin ||
      request.headers.get("x-stridebrain-price-read") !== "1" ||
      request.headers.get("origin") !== origin ||
      (request.headers.has("sec-fetch-site") &&
        request.headers.get("sec-fetch-site") !== "same-origin")
    )
      return unavailable();
    const context = await resolveServerRuntimeContext();
    if (!context?.capabilities.has("project:read") || !context.capabilities.has("quote:read"))
      return unavailable();
    if (url.search) return invalid();
    const body = await readBody(request);
    if (!body || typeof body.locale !== "string" || !isSupportedLocale(body.locale))
      return invalid();
    const { locale, ...input } = body;
    const result = await createPriceListService().execute({ ...context, locale }, input);
    return Response.json(result, {
      status: result.kind === "UNAVAILABLE" ? 404 : result.kind === "INVALID" ? 400 : 200,
      headers,
    });
  } catch {
    return unavailable();
  }
}
