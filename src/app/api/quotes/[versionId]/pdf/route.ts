import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createQuoteIssueServices } from "@/lib/server/quote-issue-services";
import { renderQuotePdf } from "@/modules/quote-issue/infrastructure/render-quote-pdf";
export const runtime = "nodejs";
const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
async function document(
  request: Request,
  params: Promise<{ versionId: string }>,
  preview: boolean,
) {
  try {
    const context = await resolveServerRuntimeContext();
    if (!context) return new Response(null, { status: 404, headers: privateHeaders });
    const { versionId } = await params;
    if (preview && Number(request.headers.get("content-length") ?? 0) > 64000)
      return new Response(null, { status: 413, headers: privateHeaders });
    let options: unknown;
    if (preview) {
      const reader = request.body?.getReader();
      if (!reader) return new Response(null, { status: 400, headers: privateHeaders });
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 64000) {
          await reader.cancel();
          return new Response(null, { status: 413, headers: privateHeaders });
        }
        chunks.push(chunk.value);
      }
      options = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    }
    const result = await createQuoteIssueServices().document.execute(context, versionId, options);
    if (result.kind !== "DOCUMENT")
      return new Response(null, { status: 404, headers: privateHeaders });
    const buffer = await renderQuotePdf(result.snapshot, result.draft);
    return new Response(new Uint8Array(buffer), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.snapshot.documentNumber}.pdf"`,
      },
    });
  } catch {
    return new Response(null, { status: 503, headers: privateHeaders });
  }
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  return document(request, params, false);
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  return document(request, params, true);
}
