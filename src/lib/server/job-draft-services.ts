import "server-only";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { DraftJob } from "@/modules/assistant/application/draft-job";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import { GeminiAssistantModel } from "@/modules/assistant/infrastructure/gemini-model";
import { PrismaAssistantRepository } from "@/repositories/prisma/prisma-assistant-repository";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import { getPrismaClient } from "./prisma";
import { assistantConfigured } from "./assistant-availability";

export function createJobDraftService() {
  const db = getPrismaClient(),
    config = assistantConfig(process.env);
  const model =
    config.enabled && process.env.STRIDEBRAIN_GEMINI_API_KEY
      ? new GeminiAssistantModel(process.env.STRIDEBRAIN_GEMINI_API_KEY, config.model)
      : null;
  return new DraftJob(
    model,
    config,
    new PrismaAssistantRepository(db),
    new PrismaProjectWriteRepository(db),
  );
}
export async function jobDraftAvailable(context: RuntimeContext | null): Promise<boolean> {
  if (
    !context?.capabilities.has("project:create") ||
    !context.capabilities.has("project:read") ||
    !assistantConfigured()
  )
    return false;
  try {
    return (
      assistantConfig(process.env).enabled &&
      (await new PrismaAssistantRepository(getPrismaClient()).enabled(context))
    );
  } catch {
    return false;
  }
}
