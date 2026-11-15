import { randomUUID } from "node:crypto";

import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { isSupportedLocale } from "@/modules/localization/config";
import { safeReviewKey } from "@/modules/internal-review-experience/route-state";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ proposalKey: string }> },
): Promise<Response> {
  const context = await resolveServerRuntimeContext();
  const { proposalKey } = await params;
  const locale = new URL(request.url).searchParams.get("locale");
  if (!context || !safeReviewKey(proposalKey) || !locale || !isSupportedLocale(locale)) {
    return Response.json(
      { kind: "PROPOSAL_NOT_AUTHORIZED", requestId: context?.requestId ?? randomUUID() },
      { status: 403, headers },
    );
  }
  try {
    return Response.json(
      await createInternalReviewServices().reopenProposal(context, proposalKey, locale),
      { headers },
    );
  } catch {
    return Response.json(
      { kind: "PROPOSAL_FAILED", requestId: context.requestId },
      { status: 500, headers },
    );
  }
}
