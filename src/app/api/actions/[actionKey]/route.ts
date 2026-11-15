import { randomUUID } from "node:crypto";

import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { isSupportedLocale } from "@/modules/localization/config";
import { safeReviewKey } from "@/modules/internal-review-experience/route-state";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ actionKey: string }> },
): Promise<Response> {
  const context = await resolveServerRuntimeContext();
  const { actionKey } = await params;
  const locale = new URL(request.url).searchParams.get("locale");
  if (!context || !safeReviewKey(actionKey) || !locale || !isSupportedLocale(locale)) {
    return Response.json(
      { kind: "ACTION_NOT_AUTHORIZED", requestId: context?.requestId ?? randomUUID() },
      { status: 403, headers },
    );
  }
  try {
    return Response.json(
      await createInternalReviewServices().getReceipt(context, actionKey, locale),
      { headers },
    );
  } catch {
    return Response.json(
      { kind: "ACTION_NOT_AUTHORIZED", requestId: context.requestId },
      { status: 500, headers },
    );
  }
}
