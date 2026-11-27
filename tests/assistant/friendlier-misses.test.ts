import { mentionsUnreadableIdentity } from "@/modules/assistant/domain/subjects";
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
    finishTurn: vi.fn().mockResolvedValue(undefined),
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

import { nearestJobs, nameFollowUp } from "@/modules/assistant/domain/job-chips";
import { AnswerFactRegistry, parseFactAnswer } from "@/modules/assistant/domain/fact-answers";
import { maySuggestFollowUp } from "@/modules/assistant/domain/follow-ups";
const jobs = [
  { projectKey: "PRJ-XINYI-026", names: ["Xinyi Flagship Renovation", "信義旗艦店裝修"] },
  { projectKey: "RIVER", names: ["Riverside Display Studio", "河岸展示工作室"] },
];
it("B: shared text has a deterministic floor, bilingual labels and at most three chips", () => {
  expect(nearestJobs("信義店", jobs, "zh-TW").map((j) => j.name)).toEqual(["信義旗艦店裝修"]);
  expect(nearestJobs("河岸工作室", jobs, "zh-TW").map((j) => j.projectKey)).toEqual(["RIVER"]);
  expect(nearestJobs("Xinyi store", jobs, "en")[0]?.projectKey).toBe("PRJ-XINYI-026");
  expect(nearestJobs("月光咖啡館", jobs, "zh-TW")).toEqual([]);
  expect(nearestJobs("Unrelated moon cafe", jobs, "en")).toEqual([]);
  const many = Array.from({ length: 6 }, (_, i) => ({
    projectKey: `J${i}`,
    names: ["Xinyi store"],
  }));
  expect(nearestJobs("Xinyi", many.reverse(), "en").map((j) => j.projectKey)).toEqual([
    "J0",
    "J1",
    "J2",
  ]);
});
it.each(["en", "zh-TW"] as const)(
  "B: the same question has identical chips, output, calls and logs with an unreadable job present or absent (%s)",
  async (locale) => {
    const results = [];
    for (const exists of [true, false]) {
      const query = locale === "en" ? "Xinyi store" : "信義店";
      const f = missesFixture([
        { usage, result: { kind: "TOOLS", calls: [{ name: "list_jobs", arguments: { query } }] } },
      ]);
      f.tools.resolveSubjects.mockResolvedValue({ kind: "AVAILABLE", projects: jobs, named: [] });
      f.repo.questionMentionsUnreadableJob.mockResolvedValue(exists);
      f.tools.execute.mockResolvedValue({
        status: "OK",
        sources: [
          {
            sourceId: "count",
            href: `/${locale}/projects`,
            label: "Jobs",
            facts: { count: 0, matchingCount: 0 },
            projectKeys: [],
          },
        ],
      });
      const out = await f.service.execute(jobContext({ locale }), { question: `${query}?` });
      results.push({
        out,
        calls: f.model.requests.length,
        reserve: f.repo.reserveCall.mock.calls.map((r) => r[3]),
        finish: f.repo.finishTurn.mock.calls.map((r) => r[1]),
      });
      expect(out).toMatchObject({
        questionChips: [
          {
            label: locale === "en" ? jobs[0]!.names[0] : jobs[0]!.names[1],
            question: `${query}?`,
            confirmedProjectKey: jobs[0]!.projectKey,
          },
        ],
      });
      expect(JSON.stringify(f.repo.reserveCall.mock.calls.map((r) => r[3]))).not.toContain(query);
    }
    expect(results[0]).toEqual(results[1]);
  },
);
it("B: confirmed job replaces an unresolved name and page project, but still checks access and exclusion", async () => {
  const f = missesFixture([
    {
      usage,
      result: {
        kind: "TOOLS",
        calls: [{ name: "get_quote_status", arguments: { projectKey: jobs[0]!.projectKey } }],
      },
    },
    {
      usage,
      result: {
        kind: "ANSWER",
        answer: { parts: [{ say: "RECORDS_SHOW" }, { show: "s1.totalAmount" }], followUps: [] },
      },
    },
  ]);
  f.tools.resolveSubjects.mockResolvedValue({ kind: "AVAILABLE", projects: jobs, named: [] });
  f.tools.execute.mockResolvedValue({
    status: "OK",
    sources: [
      {
        sourceId: "quote",
        href: "/en/projects/PRJ-XINYI-026/quote",
        label: jobs[0]!.names[0],
        facts: { totalAmount: "NT$17,304,000" },
        projectKeys: [jobs[0]!.projectKey],
      },
    ],
  });
  const input = {
    question: "Xinyi store total?",
    projectKey: "PAGE",
    confirmedProjectKey: jobs[0]!.projectKey,
  };
  const out = await f.service.execute(jobContext(), input);
  expect(out.kind, JSON.stringify(out)).toBe("ANSWER");
  expect(out.kind === "ANSWER" && out.answer.text).toContain("NT$17,304,000");
  expect(JSON.parse(f.model.requests[0]!.messages[0]!.text)).toMatchObject({
    confirmedProjectReference: jobs[0]!.projectKey,
    currentQuestion: input.question,
  });
  expect(JSON.stringify(f.model.requests[0])).not.toContain("pageContextReference");
  const denied = missesFixture([]);
  denied.tools.resolveSubjects.mockResolvedValue({ kind: "AVAILABLE", projects: jobs, named: [] });
  expect(
    await denied.service.execute(jobContext(), { ...input, confirmedProjectKey: "FORGED" }),
  ).toMatchObject({ kind: "ANSWER", refusal: "NO_RECORDS" });
  denied.repo.jobPolicy.mockResolvedValue(null);
  expect(await denied.service.execute(jobContext(), input)).toMatchObject({
    kind: "ANSWER",
    refusal: "NO_RECORDS",
    answer: { text: assistantCopy("en").jobNotFound },
  });
  denied.repo.jobPolicy.mockResolvedValue({ id: "J", excluded: true });
  expect(await denied.service.execute(jobContext(), input)).toMatchObject({
    kind: "ANSWER",
    refusal: "EXCLUDED",
  });
  expect(denied.model.requests).toHaveLength(0);
});
it.each(["en", "zh-TW"] as const)(
  "C: forty parts, twelve printed rows with remaining counts and an optional partial notice (%s)",
  (locale) => {
    const registry = new AnswerFactRegistry(locale);
    registry.register([
      {
        sourceId: "s",
        label: "Job",
        href: "/en/projects/J",
        projectKeys: ["J"],
        facts: { findings: Array.from({ length: 38 }, (_, i) => ({ text: `Saved fact ${i}` })) },
      },
    ]);
    const refs = Array.from({ length: 38 }, (_, i) => ({ show: `s1.findings.${i}.text` }));
    const result = registry.render({
      parts: [{ say: "RECORDS_SHOW" }, ...refs, { say: "PARTIAL_RECORDS" }],
      followUps: [],
    });
    expect(result.kind).toBe("ACCEPTED");
    if (result.kind !== "ACCEPTED") throw Error("rejected");
    const cards = result.answer.presentation!.blocks.filter((b) => b.kind === "CARD");
    expect(cards.flatMap((b) => b.rows)).toHaveLength(12);
    expect(cards[0]!.remaining).toContain("26");
    expect(result.answer.presentation!.blocks.at(-1)).toMatchObject({
      kind: "NOTICE",
      text:
        locale === "en"
          ? "Part of what you asked is not in the records you may read."
          : "您問的部分內容不在可查看的紀錄中。",
    });
    const full = registry.render({ parts: [{ say: "RECORDS_SHOW" }, ...refs], followUps: [] });
    expect(
      full.kind === "ACCEPTED" && full.answer.presentation!.blocks.some((b) => b.kind === "NOTICE"),
    ).toBe(false);
    expect(
      parseFactAnswer({
        parts: [{ say: "RECORDS_SHOW" }, ...refs, { show: "x" }, { show: "y" }],
        followUps: [],
      }),
    ).toBeNull();
    expect(
      registry.render({
        parts: [{ say: "RECORDS_SHOW" }, ...refs, { show: "s1.unknown" }],
        followUps: [],
      }),
    ).toMatchObject({ reason: "UNKNOWN_REFERENCE" });
  },
);
it("D: follow-ups use authorized names and remove unsupported personal information for owners too", () => {
  expect(nameFollowUp("What stage is PRJ-XINYI-026 in?", jobs, "en")).toBe(
    "What stage is Xinyi Flagship Renovation in?",
  );
  expect(nameFollowUp("PRJ-XINYI-026 的報價呢？", jobs, "zh-TW")).toBe("信義旗艦店裝修 的報價呢？");
  expect(nameFollowUp("PRJ-XINYI-026 Xinyi Flagship Renovation?", jobs, "en")).toContain(
    "PRJ-XINYI-026",
  );
  expect(nameFollowUp("PRIVATE-JOB?", jobs, "en")).toBe("PRIVATE-JOB?");
  for (const text of [
    "Who is the client?",
    "What is the client of PRJ-XINYI-026?",
    "What is the site address?",
    "Contact details?",
    "客戶是誰？",
    "聯絡電話？",
    "工地地址？",
  ])
    expect(maySuggestFollowUp(text, jobContext().capabilities)).toBe(false);
  expect(maySuggestFollowUp("What is the quote total?", jobContext().capabilities)).toBe(true);
});

it.each(["en", "zh-TW"] as const)(
  "C: recorded partial phrase order is normalized into the same server-owned layout (%s)",
  (locale) => {
    const registry = new AnswerFactRegistry(locale);
    registry.register([
      {
        sourceId: "s",
        label: "Job",
        href: "/en/projects/J",
        projectKeys: ["J"],
        facts: { stage: "Design" },
      },
    ]);
    const canonical = {
      parts: [{ say: "RECORDS_SHOW" }, { show: "s1.stage" }, { say: "PARTIAL_RECORDS" }],
      followUps: [],
    };
    expect(
      registry.render({
        parts: [{ say: "PARTIAL_RECORDS" }, { say: "RECORDS_SHOW" }, { show: "s1.stage" }],
        followUps: [],
      }),
    ).toEqual(registry.render(canonical));
    expect(
      registry.render({ parts: [{ say: "PARTIAL_RECORDS" }, { show: "s1.stage" }], followUps: [] }),
    ).toEqual(registry.render(canonical));
    for (const parts of [
      [{ say: "PARTIAL_RECORDS" }, { say: "RECORDS_SHOW" }],
      [...canonical.parts, { say: "PARTIAL_RECORDS" }],
    ])
      expect(parseFactAnswer({ parts, followUps: [] })).toBeNull();
  },
);
it("C: replays the focused run's three discarded raw partial answers without changing selected facts", () => {
  const report = JSON.parse(
    readFileSync("foundry/tasks/SB-081/evidence/focused-paid-1.json", "utf8"),
  );
  let count = 0;
  for (const round of report.rounds)
    for (const row of round.questions) {
      if (row.discardReason !== "INVALID_OUTPUT") continue;
      const registry = new AnswerFactRegistry(row.locale);
      registry.register(row.sourceLedger);
      const out = registry.render(row.rawAnswer);
      expect(out.kind).toBe("ACCEPTED");
      if (out.kind !== "ACCEPTED") throw Error("replay");
      expect(out.selection.noticePhraseId).toBe("PARTIAL_RECORDS");
      expect(out.answer.presentation!.blocks.at(-1)?.kind).toBe("NOTICE");
      count++;
    }
  expect(count).toBe(3);
});

it("C: valid partial-only phrase selections from focused run 2 are laid out without losing facts", () => {
  const report = JSON.parse(
    readFileSync("foundry/tasks/SB-081/evidence/focused-paid-2.json", "utf8"),
  );
  let n = 0;
  for (const round of report.rounds)
    for (const row of round.questions) {
      if (row.discardReason !== "INVALID_OUTPUT") continue;
      const registry = new AnswerFactRegistry(row.locale);
      registry.register(row.sourceLedger);
      const rendered = registry.render(row.rawAnswer);
      expect(rendered.kind).toBe("ACCEPTED");
      if (rendered.kind !== "ACCEPTED") throw Error("replay");
      expect(rendered.selection.noticePhraseId).toBe("PARTIAL_RECORDS");
      expect(rendered.selection.shown).toHaveLength(
        row.rawAnswer.parts.filter((p: { show?: string }) => p.show).length,
      );
      n++;
    }
  expect(n).toBe(5);
});

it("B/E: a failed candidate access read produces only a failed-turn log, never a premature success", async () => {
  const f = missesFixture([
    {
      usage,
      result: {
        kind: "TOOLS",
        calls: [{ name: "list_jobs", arguments: { query: "Xinyi store" } }],
      },
    },
  ]);
  f.tools.resolveSubjects.mockResolvedValue({ kind: "AVAILABLE", projects: jobs, named: [] });
  f.tools.execute.mockResolvedValue({
    status: "OK",
    sources: [
      {
        sourceId: "count",
        href: "/en/projects",
        label: "Jobs",
        facts: { count: 0, matchingCount: 0 },
        projectKeys: [],
      },
    ],
  });
  f.repo.jobPolicy.mockRejectedValue(new Error("test read failure"));
  expect(await f.service.execute(jobContext(), { question: "Xinyi store total?" })).toMatchObject({
    kind: "FALLBACK",
    reason: "UNAVAILABLE",
  });
  expect(f.repo.finishTurn).toHaveBeenCalledTimes(1);
  expect(f.repo.finishTurn.mock.calls[0]![1]).toBe("FALLBACK_UNAVAILABLE");
});

it("B: guard chip search is the typed match, never another canonical field or unrelated question text", () => {
  const matched = vi.fn();
  expect(
    mentionsUnreadableIdentity(
      "Xinyi stage? And private-river quote?",
      [],
      ["PRIVATE-RIVER", "Canonical Secret Studio"],
      matched,
    ),
  ).toBe(true);
  expect(matched).toHaveBeenCalledExactlyOnceWith("private-river");
  expect(nearestJobs(matched.mock.calls[0]![0], jobs, "en").map((p) => p.projectKey)).not.toContain(
    "PRJ-XINYI-026",
  );
});
