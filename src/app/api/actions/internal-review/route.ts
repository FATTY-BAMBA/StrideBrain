import { randomUUID } from "node:crypto";

import { getServerEnvironment } from "@/lib/env/server-env";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { traceInternalReviewAttempt } from "@/lib/server/internal-review-trace";
import {
  isSameOriginReviewRequest,
  parseConfirmRequest,
  readReviewJson,
} from "@/modules/internal-review-experience/http-contract";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request): Promise<Response> {
  let requestId: string = randomUUID();
  try {
    if (!isSameOriginReviewRequest(request, getServerEnvironment().appOrigin.origin)) {
      traceInternalReviewAttempt({ requestId, outcome: "ACTION_NOT_AUTHORIZED" });
      return Response.json({ kind: "ACTION_NOT_AUTHORIZED", requestId }, { status: 403, headers });
    }
    const context = await resolveServerRuntimeContext();
    if (!context) {
      traceInternalReviewAttempt({ requestId, outcome: "ACTION_NOT_AUTHORIZED" });
      return Response.json({ kind: "ACTION_NOT_AUTHORIZED", requestId }, { status: 403, headers });
    }
    requestId = context.requestId;
    const input = parseConfirmRequest(await readReviewJson(request));
    if (!input) {
      traceInternalReviewAttempt({ requestId, outcome: "VALIDATION_FAILED" });
      return Response.json(
        {
          kind: "VALIDATION_FAILED",
          requestId: context.requestId,
          fieldErrors: { confirmation: "INVALID_REQUEST" },
        },
        { status: 400, headers },
      );
    }
    return Response.json(await createInternalReviewServices().confirm(context, input), { headers });
  } catch {
    traceInternalReviewAttempt({ requestId, outcome: "ACTION_CREATE_FAILED" });
    return Response.json({ kind: "ACTION_CREATE_FAILED", requestId }, { status: 500, headers });
  }
}
