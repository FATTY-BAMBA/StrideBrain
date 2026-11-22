import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from "vitest";
import type * as AssistantServices from "@/lib/server/assistant-services";
import type { AssistantModelPort, ToolCall } from "@/modules/assistant/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({
  model: null as AssistantModelPort | null,
  context: null as RuntimeContext | null,
}));
vi.mock("@/lib/server/runtime-context", () => ({
  resolveServerRuntimeContext: async () => boundary.context,
}));
vi.mock("@/lib/server/assistant-services", async (original) => {
  const actual = await original<typeof AssistantServices>();
  return {
    ...actual,
    createAssistantServices: () => {
      const real = actual.createAssistantServices();
      return {
        ...real,
        ask: new AskAssistant(
          boundary.model,
          { ...real.config, enabled: true },
          real.repository,
          real.tools,
        ),
      };
    },
  };
});
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation, emptyAwaitingScenario } from "./evaluation-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { askHomeAction } from "@/app/[locale]/home-chat-actions";
import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts";
import { GetQuoteDraft } from "@/modules/quote-draft/application/get-quote-draft";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { formatMoney } from "@/modules/finance/format-money";
import { FakeAssistantModel } from "./fake-model";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
let db: Awaited<ReturnType<typeof assistantDatabase>>;
beforeAll(async () => {
  if (process.env.DATABASE_URL) {
    db = await assistantDatabase();
    await prepareEvaluation(db);
  }
}, 30000);
afterAll(async () => {
  await db?.close();
});
afterEach(() => vi.unstubAllEnvs());
const counts = async () => ({
  comparisons: await getPrismaClient().comparisonRun.count(),
  economics: await getPrismaClient().economicsEnrichmentRun.count(),
});
async function ask(
  question: string,
  call: ToolCall,
  text: (facts: Record<string, unknown>) => string,
  duplicate = false,
) {
  const usage = { inputTokens: 0, outputTokens: 0 };
  const toolReply = { usage, result: { kind: "TOOLS" as const, calls: [call] } };
  const fake = new FakeAssistantModel([
    toolReply,
    ...(duplicate ? [toolReply] : []),
    (request) => {
      const data = JSON.parse(request.messages.filter((m) => m.role === "data").at(-1)!.text);
      return {
        usage,
        result: {
          kind: "ANSWER",
          answer: {
            text: text(data.sources[0]?.facts ?? {}),
            sourceIds: data.sources.map((s: { sourceId: string }) => s.sourceId),
            followUps: [],
          },
        },
      };
    },
  ]);
  boundary.model = fake;
  boundary.context = await db.actor();
  vi.stubEnv("STRIDEBRAIN_AI_ENABLED", "true");
  vi.stubEnv("STRIDEBRAIN_AI_PAID_TIER_CONFIRMED", "true");
  vi.stubEnv("STRIDEBRAIN_GEMINI_API_KEY", "synthetic-transport-only");
  const form = new FormData();
  form.set("locale", "zh-TW");
  form.set("projectKey", "J-2611-R7K3");
  form.set("message", question);
  const before = await counts();
  const result = await askHomeAction(initialHomeChatState, form);
  expect(await counts()).toEqual(before);
  return { turn: result.turns.at(-1)!, fake };
}
suite("hosted regressions through authorized records and the Home server action", () => {
  it.each([
    "進行中設計專案01的報價狀態如何？",
    "What is the quote status of Active Design Project 01?",
    "PRJ-ACTIVE-001 的報價總額是多少？客戶哪一天接受？",
  ])("uses the named job over a different Home default: %s", async (question) => {
    const { turn, fake } = await ask(
      question,
      { name: "get_quote_status", arguments: { projectKey: "PRJ-ACTIVE-001" } },
      (facts) => `${facts.reference}: ${facts.status}`,
    );
    expect(turn.ai).toBe(true);
    expect(turn.text).toContain("PRJ-ACTIVE-001");
    expect(turn.text).not.toContain("J-2611-R7K3");
    expect(turn.aiSources?.every((s) => s.href.startsWith("/zh-TW/"))).toBe(true);
    const sent = JSON.parse(fake.requests[0]!.messages[0]!.text);
    expect(sent.subjectProjects[0].reference).toBe("PRJ-ACTIVE-001");
    expect(sent.selectedProjectReference).toBeUndefined();
  });
  it("matches the Quote tab's internal-review status and all three amounts", async () => {
    const c = await db.actor();
    const services = createAssistantServices();
    const tab = await new GetQuoteDraft(new PrismaQuoteDraftRepository(getPrismaClient())).execute(
      c,
      "J-2611-R7K3",
    );
    if (tab.kind !== "AVAILABLE" || !tab.saved) throw Error("QUOTE_REQUIRED");
    expect(tab.saved.status).toBe("INTERNAL_REVIEW");
    for (const locale of ["en", "zh-TW"] as const) {
      const result = await services.tools.execute(
        { ...c, locale },
        { name: "get_quote_status", arguments: { projectKey: "J-2611-R7K3" } },
      );
      expect(result.sources[0]!.facts.status).toBe(
        locale === "en" ? "In internal review" : "內部審查中",
      );
      for (const key of ["amountBeforeTax", "taxAmount", "totalAmount"] as const)
        expect((result.sources[0]!.facts.amounts as Record<string, string>)[key]).toBe(
          formatMoney(tab.saved.totals[key], tab.saved.currency),
        );
    }
  });
  it("keeps no awaiting clients grounded and does not save a comparison, even after a duplicate call", async () => {
    await emptyAwaitingScenario(true, async () => {
      const { turn } = await ask(
        "哪些報價還在等客戶回覆？",
        { name: "list_awaiting_client", arguments: {} },
        (facts) => `目前有 ${facts.count} 筆報價等待客戶回覆。`,
        true,
      );
      expect(turn).toMatchObject({ ai: true, text: "目前有 0 筆報價等待客戶回覆。" });
      expect(turn.aiSources).toHaveLength(1);
    });
  });
  it("returns a comparison link for the named job without any comparison writes", async () => {
    const { turn, fake } = await ask(
      "PRJ-ACTIVE-001 有已儲存的比較嗎？",
      { name: "get_saved_comparison", arguments: { projectKey: "PRJ-ACTIVE-001" } },
      () => "unused",
    );
    expect(turn).toMatchObject({
      ai: true,
      action: { href: "/zh-TW/projects/PRJ-ACTIVE-001/compare" },
    });
    expect(turn.text).toContain("沒有目前可用的已儲存比較");
    expect(fake.requests).toHaveLength(1);
  });
  it("resolves only names the member may read", async () => {
    const tools = createAssistantServices().tools;
    for (const member of [
      "membership_horizon_mei",
      "membership_horizon_viewer",
      "membership_northern_owner",
    ]) {
      const c = await db.actor(member);
      const result = await tools.resolveSubjects(c, "進行中設計專案01的報價狀態如何？");
      expect(result).toMatchObject({ kind: "AVAILABLE", named: [] });
    }
  });
});
