import { randomUUID } from "node:crypto";

import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { traceInternalReviewAttempt } from "@/lib/server/internal-review-trace";
import { isSupportedLocale } from "@/modules/localization/config";
import { safeReviewKey } from "@/modules/internal-review-experience/route-state";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ actionKey: string }> },
): Promise<Response> {
  let requestId: string = randomUUID();
  try {
    const context = await resolveServerRuntimeContext();
    if (context) requestId = context.requestId;
    const { actionKey } = await params;
    const locale = new URL(request.url).searchParams.get("locale");
    if (!context || !safeReviewKey(actionKey) || !locale || !isSupportedLocale(locale)) {
      traceInternalReviewAttempt({ requestId, outcome: "ACTION_NOT_AUTHORIZED" });
      return Response.json({ kind: "ACTION_NOT_AUTHORIZED", requestId }, { status: 403, headers });
    }
    return Response.json(
      await createInternalReviewServices().getReceipt(context, actionKey, locale),
      { headers },
    );
  } catch {
    traceInternalReviewAttempt({ requestId, outcome: "ACTION_NOT_AUTHORIZED" });
    return Response.json({ kind: "ACTION_NOT_AUTHORIZED", requestId }, { status: 500, headers });
  }
}
