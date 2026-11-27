import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import { assistantCopy } from "@/modules/localization/assistant";
import type {
  AssistantConfig,
  AssistantSource,
  ModelReply,
} from "@/modules/assistant/domain/contracts";
import type { AssistantRepositoryPort } from "@/repositories/ports/assistant-repository";
import type { Locale } from "@/modules/localization/config";
import { FakeAssistantModel } from "./fake-model";
import { jobContext } from "../projects/job-fixture";
import questions from "./questions.json";
const usage = { inputTokens: 0, outputTokens: 0 };
const config: AssistantConfig = {
  enabled: true,
  provider: "gemini",
  model: "test",
  timeoutMs: 1000,
  maxToolCalls: 6,
  maxOutputTokens: 4096,
  dailyCalls: 100,
  inputUsdPerMillion: "0.30",
  outputUsdPerMillion: "2.50",
};
export function missesFixture(script: ConstructorParameters<typeof FakeAssistantModel>[0]) {
  const model = new FakeAssistantModel(script);
  const repo = {
    questionMentionsUnreadableJob: vi.fn().mockResolvedValue(false),
    readableReferences: vi.fn().mockResolvedValue([]),
    enabled: vi.fn().mockResolvedValue(true),
    jobPolicy: vi.fn().mockResolvedValue({ id: "J", excluded: false }),
    settings: vi.fn(),
    setControl: vi.fn(),
    reserveCall: vi.fn().mockResolvedValue("call"),
    meterCall: vi.fn(),
    finishTurn: vi.fn(),
  } satisfies AssistantRepositoryPort;
  const tools = {
    resolveSubjects: vi.fn().mockResolvedValue({ kind: "AVAILABLE", projects: [], named: [] }),
    canSend: vi.fn().mockResolvedValue(true),
    execute: vi.fn().mockResolvedValue({ status: "OK", sources: [] }),
  };
  return { repo, tools, model, service: new AskAssistant(model, config, repo, tools) };
}
it("A: replays recorded zero-match ledgers with the dedicated sentence in both languages", async () => {
  const report = JSON.parse(
    readFileSync("foundry/tasks/SB-079/evidence/paid-run-6.json", "utf8"),
  ) as {
    rounds: { questions: { id: string; sourceLedger: AssistantSource[]; rawAnswer: unknown }[] }[];
  };
  let replayed = 0;
  for (const round of report.rounds)
    for (const row of round.questions) {
      const q = questions.find((q) => q.id === row.id);
      if (
        !q?.expected.unresolvedSubject ||
        row.sourceLedger.length !== 1 ||
        row.sourceLedger[0]!.facts.count !== 0
      )
        continue;
      const f = missesFixture([
        {
          usage,
          result: {
            kind: "TOOLS",
            calls: [{ name: "list_jobs", arguments: { query: q.question } }],
          },
        },
      ]);
      f.tools.execute.mockResolvedValue({ status: "OK", sources: row.sourceLedger });
      const out = await f.service.execute(jobContext({ locale: q.locale as Locale }), {
        question: q.question,
        ...(q.projectKey ? { projectKey: q.projectKey } : {}),
      });
      expect(out).toMatchObject({
        kind: "ANSWER",
        answer: {
          text: assistantCopy(q.locale as Locale).jobNotFound,
          sourceIds: [],
          followUps: [],
        },
        sources: [],
      });
      expect(f.model.requests).toHaveLength(1);
      replayed++;
    }
  expect(replayed).toBeGreaterThanOrEqual(30);
});
it.each(["en", "zh-TW"] as const)("A: unreadable guard has the same copy (%s)", async (locale) => {
  const script: ModelReply[] = [
    {
      usage,
      result: { kind: "TOOLS", calls: [{ name: "get_job", arguments: { projectKey: "J" } }] },
    },
    {
      usage,
      result: {
        kind: "ANSWER",
        answer: { parts: [{ say: "RECORDS_SHOW" }, { show: "s1.stage" }], followUps: [] },
      },
    },
  ];
  const f = missesFixture(script);
  f.repo.questionMentionsUnreadableJob.mockResolvedValue(true);
  f.tools.execute.mockResolvedValue({
    status: "OK",
    sources: [
      {
        sourceId: "s",
        href: "/en/projects/J",
        label: "Readable",
        facts: { stage: "Design" },
        projectKeys: ["J"],
      },
    ],
  });
  expect(
    await f.service.execute(jobContext({ locale }), {
      question: locale === "en" ? "Hidden job stage?" : "未指派專案目前在哪個階段？",
    }),
  ).toMatchObject({
    kind: "ANSWER",
    refusal: "UNAVAILABLE",
    answer: { text: assistantCopy(locale).jobNotFound },
    sources: [],
  });
});
