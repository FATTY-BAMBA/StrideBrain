import "server-only";
import { getDemoSessionSecret } from "@/lib/env/demo-session-secret";
import { createAttemptBudget, handlePreviewSession } from "@/modules/preview-session/handoff";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { getPrismaClient } from "./prisma";

const allowAttempt = createAttemptBudget();

export function previewSessionRequest(request: Request, operation: "enter" | "leave") {
  return handlePreviewSession(request, operation, {
    env: process.env,
    repository: () =>
      new PrismaDemoSessionRepository(getPrismaClient() as unknown as PrismaDemoSessionDatabase),
    signingSecret: getDemoSessionSecret,
    allowAttempt,
  });
}
