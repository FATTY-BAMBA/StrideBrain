import { randomUUID } from "node:crypto";

import { getServerEnvironment } from "@/lib/env/server-env";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import {
  isSameOriginReviewRequest,
  parsePrepareRequest,
  readReviewJson,
} from "@/modules/internal-review-experience/http-contract";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID();
  if (!isSameOriginReviewRequest(request, getServerEnvironment().appOrigin.origin)) {
    return Response.json({ kind: "PROPOSAL_NOT_AUTHORIZED", requestId }, { status: 403, headers });
  }
  const context = await resolveServerRuntimeContext();
  if (!context)
    return Response.json({ kind: "PROPOSAL_NOT_AUTHORIZED", requestId }, { status: 403, headers });
  const input = parsePrepareRequest(await readReviewJson(request));
  if (!input)
    return Response.json(
      { kind: "PROPOSAL_UNAVAILABLE", requestId: context.requestId },
      { status: 400, headers },
    );
  try {
    const outcome = await createInternalReviewServices().prepare(context, input);
    return Response.json(outcome, { headers });
  } catch {
    return Response.json(
      { kind: "PROPOSAL_FAILED", requestId: context.requestId },
      { status: 500, headers },
    );
  }
}
