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
  { params }: { params: Promise<{ proposalKey: string }> },
): Promise<Response> {
  let requestId: string = randomUUID();
  try {
    const context = await resolveServerRuntimeContext();
    if (context) requestId = context.requestId;
    const { proposalKey } = await params;
    const locale = new URL(request.url).searchParams.get("locale");
    if (!context || !safeReviewKey(proposalKey) || !locale || !isSupportedLocale(locale)) {
      traceInternalReviewAttempt({ requestId, outcome: "PROPOSAL_NOT_AUTHORIZED" });
      return Response.json(
        { kind: "PROPOSAL_NOT_AUTHORIZED", requestId },
        { status: 403, headers },
      );
    }
    return Response.json(
      await createInternalReviewServices().reopenProposal(context, proposalKey, locale),
      { headers },
    );
  } catch {
    traceInternalReviewAttempt({ requestId, outcome: "PROPOSAL_FAILED" });
    return Response.json({ kind: "PROPOSAL_FAILED", requestId }, { status: 500, headers });
  }
}
