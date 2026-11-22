import "server-only";
import { getPrismaClient } from "./prisma";
import {
  createProjectListService,
  createProjectWorkspaceService,
} from "./project-workspace-services";
import { createComparisonServices } from "./comparison-services";
import { createHomeDeskService } from "./home-desk-services";
import { GetQuoteIssue } from "@/modules/quote-issue/application/issue-services";
import { PrismaQuoteIssueRepository } from "@/repositories/prisma/prisma-quote-issue-repository";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { GetQuotedHistory } from "@/modules/quote-draft/application/get-quoted-history";
import { PrismaAssistantRepository } from "@/repositories/prisma/prisma-assistant-repository";
import { AssistantReadTools } from "@/modules/assistant/application/read-tools";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import { SetAssistantControl } from "@/modules/assistant/application/controls";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import { GeminiAssistantModel } from "@/modules/assistant/infrastructure/gemini-model";
export function createAssistantServices() {
  const db = getPrismaClient(),
    repository = new PrismaAssistantRepository(db),
    config = assistantConfig(process.env);
  const tools = new AssistantReadTools(
    {
      projects: createProjectListService(),
      workspace: createProjectWorkspaceService(),
      quote: new GetQuoteIssue(new PrismaQuoteIssueRepository(db)),
      comparison: createComparisonServices().getHomeComparison,
      history: new GetQuotedHistory(new PrismaQuoteDraftRepository(db)),
      home: createHomeDeskService(),
    },
    repository,
  );
  const model =
    process.env.STRIDEBRAIN_GEMINI_API_KEY && config.enabled
      ? new GeminiAssistantModel(process.env.STRIDEBRAIN_GEMINI_API_KEY, config.model)
      : null;
  return {
    config,
    repository,
    tools,
    ask: new AskAssistant(model, config, repository, tools),
    control: new SetAssistantControl(repository),
  };
}

export function createAssistantControlServices() {
  const repository = new PrismaAssistantRepository(getPrismaClient());
  return { repository, control: new SetAssistantControl(repository) };
}
