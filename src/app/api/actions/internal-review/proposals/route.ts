import { randomUUID } from "node:crypto";

import { getServerEnvironment } from "@/lib/env/server-env";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { traceInternalReviewAttempt } from "@/lib/server/internal-review-trace";
import {
  isSameOriginReviewRequest,
  parsePrepareRequest,
  readReviewJson,
} from "@/modules/internal-review-experience/http-contract";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request): Promise<Response> {
  let requestId: string = randomUUID();
  try {
    if (!isSameOriginReviewRequest(request, getServerEnvironment().appOrigin.origin)) {
      traceInternalReviewAttempt({ requestId, outcome: "PROPOSAL_NOT_AUTHORIZED" });
      return Response.json(
        { kind: "PROPOSAL_NOT_AUTHORIZED", requestId },
        { status: 403, headers },
      );
    }
    const context = await resolveServerRuntimeContext();
    if (!context) {
      traceInternalReviewAttempt({ requestId, outcome: "PROPOSAL_NOT_AUTHORIZED" });
      return Response.json(
        { kind: "PROPOSAL_NOT_AUTHORIZED", requestId },
        { status: 403, headers },
      );
    }
    requestId = context.requestId;
    const input = parsePrepareRequest(await readReviewJson(request));
    if (!input) {
      traceInternalReviewAttempt({ requestId, outcome: "PROPOSAL_UNAVAILABLE" });
      return Response.json(
        { kind: "PROPOSAL_UNAVAILABLE", requestId: context.requestId },
        { status: 400, headers },
      );
    }
    const outcome = await createInternalReviewServices().prepare(context, input);
    return Response.json(outcome, { headers });
  } catch {
    traceInternalReviewAttempt({ requestId, outcome: "PROPOSAL_FAILED" });
    return Response.json({ kind: "PROPOSAL_FAILED", requestId }, { status: 500, headers });
  }
}
