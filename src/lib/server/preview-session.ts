import { signInMode } from "@/modules/sign-in/domain/policy";
import { clearRealIdentity } from "./switch-sign-in-kind";
import "server-only";
import { getDemoSessionSecret } from "@/lib/env/demo-session-secret";
import { createAttemptBudget, handlePreviewSession } from "@/modules/preview-session/handoff";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { getPrismaClient } from "./prisma";

const allowAttempt = createAttemptBudget();

export async function previewSessionRequest(request: Request, operation: "enter" | "leave") {
  const mode = signInMode(process.env);
  if (mode === "real") return new Response(null, { status: 404 });
  const response = await handlePreviewSession(request, operation, {
    env: process.env,
    repository: () =>
      new PrismaDemoSessionRepository(getPrismaClient() as unknown as PrismaDemoSessionDatabase),
    signingSecret: getDemoSessionSecret,
    allowAttempt,
  });
  if (
    mode === "both" &&
    operation === "enter" &&
    response.headers.get("set-cookie")?.includes("__Host-stridebrain_demo_session=") &&
    !response.headers.get("set-cookie")?.includes("Max-Age=0")
  )
    await clearRealIdentity(request, response);
  return response;
}
