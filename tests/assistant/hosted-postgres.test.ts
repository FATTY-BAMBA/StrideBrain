import { assistantFactLabels } from "@/modules/localization/assistant";
import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from "vitest";
import type * as AssistantServices from "@/lib/server/assistant-services";
import type { AssistantModelPort, ToolCall } from "@/modules/assistant/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw Error("NOT_FOUND");
  },
  usePathname: () => "/en/projects/PRJ-XINYI-026",
}));
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
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JobLayout from "@/app/[locale]/projects/[projectKey]/layout";
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
            ...(text({}).includes("999999999")
              ? { parts: [{ say: "RECORDS_SHOW" }, { show: "missing" }] }
              : {
                  parts: data.sources.length
                    ? [
                        { say: "RECORDS_SHOW" },
                        ...data.sources[0].facts
                          .slice(0, 12)
                          .map((f: { ref: string }) => ({ show: f.ref })),
                      ]
                    : [],
                }),
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
    "PRJ-XINYI-026 的報價有哪些比較結果？",
    "Xinyi Flagship Renovation 的報價有哪些比較結果？",
  ])(
    "keeps the named job in the keyword reply after discarding an answer: %s",
    async (question) => {
      const { turn, fake } = await ask(
        question,
        { name: "get_saved_comparison", arguments: { projectKey: "PRJ-XINYI-026" } },
        () => "This quote costs NT$999999999.",
      );
      expect(fake.requests).toHaveLength(2);
      expect(turn.ai).toBeUndefined();
      expect(turn.aiFallback).toBe(true);
      expect(turn.action?.href).toContain("/zh-TW/projects/PRJ-XINYI-026/compare");
      expect(JSON.stringify(turn)).not.toContain("J-2611-R7K3");
      expect(turn.text).not.toContain("999999999");
    },
  );
  it.each([
    "進行中設計專案01的報價狀態如何？",
    "What is the quote status of Active Design Project 01?",
    "PRJ-ACTIVE-001 的報價總額是多少？客戶哪一天接受？",
  ])("uses the named job over a different Home default: %s", async (question) => {
    const { turn, fake } = await ask(
      question,
      { name: "get_quote_status", arguments: { projectKey: "PRJ-ACTIVE-001" } },
      (facts) =>
        `${question.includes("Active Design") ? "Active Design Project 01" : "進行中設計專案01"} (${facts[question.includes("Active Design") ? "Job reference" : "專案編號"]}): ${facts[question.includes("Active Design") ? "Quote status" : "報價狀態"]}`,
    );
    expect(turn.ai).toBe(true);
    expect(turn.text).toContain("PRJ-ACTIVE-001");
    expect(turn.text).not.toContain("J-2611-R7K3");
    expect(turn.aiSources?.every((s) => s.href.startsWith("/zh-TW/"))).toBe(true);
    const sent = JSON.parse(fake.requests[0]!.messages[0]!.text);
    expect(sent.subjectProjects[0].reference).toBe("PRJ-ACTIVE-001");
    expect(sent.selectedProjectReference).toBeUndefined();
  });
  it("sends the open job when the question names no job", async () => {
    const { turn, fake } = await ask(
      "這個專案目前的報價狀態如何？",
      { name: "get_quote_status", arguments: { projectKey: "J-2611-R7K3" } },
      (facts) => `河岸展示工作室：${facts["報價狀態"]}`,
    );
    expect(turn.ai).toBe(true);
    const sent = JSON.parse(fake.requests[0]!.messages[0]!.text);
    expect(sent.selectedProjectReference).toBe("J-2611-R7K3");
    expect(sent.subjectProjects).toBeUndefined();
  });
  it("omits the optional panel for inaccessible jobs and still rejects a forged form project", async () => {
    for (const [member, projectKey] of [
      ["membership_horizon_mei", "PRJ-ACTIVE-001"],
      ["membership_northern_owner", "PRJ-XINYI-026"],
    ]) {
      boundary.context = await db.actor(member);
      const fake = new FakeAssistantModel([]);
      boundary.model = fake;
      const html = renderToStaticMarkup(
        await JobLayout({
          children: createElement("p", {}, "Page-owned unavailable state"),
          params: Promise.resolve({ locale: "en", projectKey: projectKey! }),
        }),
      );
      expect(html).toContain("Page-owned unavailable state");
      expect(html).toContain("Project workspace navigation");
      expect(html).not.toContain("Ask about this job");
      const service = createAssistantServices();
      const out = await service.ask.execute(boundary.context, {
        question: "What is this job’s quote?",
        projectKey: projectKey!,
      });
      expect(out).toMatchObject({ kind: "ANSWER", refusal: "UNAVAILABLE", sources: [] });
      expect(fake.requests).toHaveLength(0);
    }
  });
  it("keeps a readable excluded job's panel but refuses without a model call; Viewer sources have no amounts", async () => {
    boundary.context = await db.actor();
    const excluded = await getPrismaClient().project.findFirstOrThrow({
      where: { organizationId: boundary.context.organizationId, aiExcluded: true },
    });
    await expect(
      JobLayout({
        children: "Job",
        params: Promise.resolve({ locale: "en", projectKey: excluded.businessKey }),
      }),
    ).resolves.toBeTruthy();
    const fake = new FakeAssistantModel([]);
    boundary.model = fake;
    const service = createAssistantServices();
    expect(
      await service.ask.execute(boundary.context, {
        question: "What is this job’s quote?",
        projectKey: excluded.businessKey,
      }),
    ).toMatchObject({ kind: "ANSWER", refusal: "EXCLUDED", sources: [] });
    expect(fake.requests).toHaveLength(0);
    boundary.context = await db.actor("membership_horizon_viewer");
    await expect(
      JobLayout({
        children: "Job",
        params: Promise.resolve({ locale: "en", projectKey: "PRJ-XINYI-026" }),
      }),
    ).resolves.toBeTruthy();
    const status = await service.tools.execute(boundary.context, {
      name: "get_quote_status",
      arguments: { projectKey: "PRJ-XINYI-026" },
    });
    expect(JSON.stringify(status)).not.toMatch(/NT\$|amountBeforeTax|taxAmount|totalAmount/);
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
  it("answers no awaiting clients before another model call and does not save a comparison", async () => {
    await emptyAwaitingScenario(true, async () => {
      const { turn, fake } = await ask(
        "哪些報價還在等客戶回覆？",
        { name: "list_awaiting_client", arguments: {} },
        (facts) => `目前有 ${facts[assistantFactLabels("zh-TW").count!]} 筆報價等待客戶回覆。`,
        true,
      );
      expect(turn).toMatchObject({ ai: true, text: "紀錄顯示：\n\n紀錄\n紀錄筆數：0" });
      expect(turn.aiSources).toHaveLength(1);
      expect(fake.requests).toHaveLength(1);
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
  it.each(["en", "zh-TW"] as const)(
    "exposes only the Quote-tab millwork display rates in %s",
    async (locale) => {
      const tools = createAssistantServices().tools,
        c = { ...(await db.actor()), locale };
      const history = await tools.execute(c, {
        name: "get_past_prices",
        arguments: { projectKey: "J-2611-R7K3", categoryId: "CUSTOM_MILLWORK" },
      });
      expect(history.sources[0]!.facts).toMatchObject({
        count: 3,
        displayMedian: "NT$5,833/m²",
        displayLow: "NT$5,424/m²",
        displayHigh: "NT$5,902/m²",
      });
    },
  );
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
