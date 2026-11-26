import { AssistantModelError } from "@/modules/assistant/domain/model-error";
import { describe, it, expect, vi } from "vitest";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import type { AssistantConfig, ModelReply } from "@/modules/assistant/domain/contracts";
import type { AssistantRepositoryPort } from "@/repositories/ports/assistant-repository";
import { jobContext } from "../projects/job-fixture";
import { FakeAssistantModel } from "./fake-model";
const config: AssistantConfig = {
  enabled: true,
  provider: "gemini",
  model: "configured-model",
  timeoutMs: 1000,
  maxToolCalls: 6,
  maxOutputTokens: 1024,
  dailyCalls: 100,
  inputUsdPerMillion: "0.30",
  outputUsdPerMillion: "2.50",
};
const usage = { inputTokens: 100, outputTokens: 10 };
const call: ModelReply = {
  usage,
  result: { kind: "TOOLS", calls: [{ name: "list_jobs", arguments: {} }] },
};
const source = {
  sourceId: "s",
  href: "/en/projects/J",
  label: "Job",
  facts: { name: "Job", count: 5 },
  projectKeys: ["J"],
};
const answer = (show = "s1.count"): ModelReply => ({
  usage,
  result: { kind: "ANSWER", answer: { parts: [{ say: "RECORDS_SHOW" }, { show }], followUps: [] } },
});
function setup(script: ConstructorParameters<typeof FakeAssistantModel>[0] = [call, answer()]) {
  const model = new FakeAssistantModel(script);
  const repo = {
    readableReferences: vi.fn().mockResolvedValue([]),
    enabled: vi.fn().mockResolvedValue(true),
    jobPolicy: vi.fn().mockResolvedValue({ id: "J", excluded: false }),
    settings: vi.fn(),
    setControl: vi.fn(),
    reserveCall: vi.fn().mockResolvedValue("call"),
    meterCall: vi.fn().mockResolvedValue(undefined),
    finishTurn: vi.fn().mockResolvedValue(undefined),
  } satisfies AssistantRepositoryPort;
  const tools = {
    resolveSubjects: vi.fn().mockResolvedValue({ kind: "AVAILABLE", named: [], projects: [] }),
    execute: vi.fn().mockResolvedValue({ status: "OK", sources: [source] }),
    canSend: vi.fn().mockResolvedValue(true),
  };
  return { model, repo, tools, service: new AskAssistant(model, config, repo, tools) };
}
describe("bounded read-only assistant", () => {
  it.each([0, 1, 2])(
    "carries a discarded answer's subject only for one resolved named job (%i named)",
    async (count) => {
      const f = setup([call, answer("999 jobs")]);
      const named = [
        { projectKey: "J", names: ["Named job", "指定專案"] },
        { projectKey: "K", names: ["Another job", "另一專案"] },
      ].slice(0, count);
      f.tools.resolveSubjects.mockResolvedValue({ kind: "AVAILABLE", named, projects: named });
      const out = await f.service.execute(jobContext(), {
        question: "Named job?",
        projectKey: "PAGE-DEFAULT",
      });
      expect(out).toMatchObject({
        kind: "FALLBACK",
        reason: "UNGROUNDED",
        discardReason: "UNKNOWN_REFERENCE",
      });
      expect(out.kind === "FALLBACK" && out.subjectProjectKey).toBe(count === 1 ? "J" : undefined);
    },
  );
  it("does not return a named fallback subject when the model failed before answering", async () => {
    const f = setup([
      () => {
        throw new AssistantModelError("UNAVAILABLE");
      },
    ]);
    const named = { projectKey: "J", names: ["Named job"] };
    f.tools.resolveSubjects.mockResolvedValue({
      kind: "AVAILABLE",
      named: [named],
      projects: [named],
    });
    expect(await f.service.execute(jobContext(), { question: "Named job?" })).not.toHaveProperty(
      "subjectProjectKey",
    );
  });
  it.each(["en", "zh-TW"] as const)(
    "answers an empty waiting list immediately in %s, ignoring an unrelated page default",
    async (locale) => {
      const script: ModelReply = {
        usage,
        result: { kind: "TOOLS", calls: [{ name: "list_awaiting_client", arguments: {} }] },
      };
      const f = setup([script]);
      f.tools.execute.mockResolvedValue({
        status: "OK",
        sources: [{ ...source, facts: { count: 0 }, projectKeys: [] }],
      });
      const input = {
        question:
          locale === "en" ? "Which quotes are waiting for the client?" : "哪些報價還在等客戶回覆？",
        projectKey: "UNRELATED-001",
      };
      const out = await f.service.execute(jobContext({ locale }), input);
      expect(out).toMatchObject({
        kind: "ANSWER",
        answer: {
          text:
            locale === "en"
              ? "Here is what the records show:\n\nJob\nRecord count: 0"
              : "紀錄顯示：\n\nJob\n紀錄筆數：0",
          sourceIds: ["s"],
          followUps: [],
        },
      });
      expect(f.model.requests).toHaveLength(1);
      expect(f.tools.execute).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(out)).not.toContain("UNRELATED-001");
      const changed = setup([script]);
      changed.tools.execute.mockResolvedValue({
        status: "OK",
        sources: [{ ...source, facts: { count: 0 }, projectKeys: [] }],
      });
      changed.tools.execute.mockImplementation(async () => {
        changed.repo.enabled.mockResolvedValue(false);
        return { status: "OK", sources: [{ ...source, facts: { count: 0 }, projectKeys: [] }] };
      });
      expect(await changed.service.execute(jobContext({ locale }), input)).toMatchObject({
        kind: "FALLBACK",
        reason: "ACCESS_CHANGED",
      });
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "refuses an empty named search in %s without a second model call",
    async (locale) => {
      const f = setup([
        {
          usage,
          result: {
            kind: "TOOLS",
            calls: [{ name: "list_jobs", arguments: { query: "PRJ-DOES-NOT-EXIST" } }],
          },
        },
      ]);
      f.tools.execute.mockResolvedValue({
        status: "OK",
        sources: [{ ...source, facts: { count: 0, matchingCount: 0 }, projectKeys: [] }],
      });
      const out = await f.service.execute(jobContext({ locale }), {
        question:
          locale === "en" ? "Tell me about PRJ-DOES-NOT-EXIST." : "請介紹 PRJ-DOES-NOT-EXIST。",
      });
      expect(out).toMatchObject({
        kind: "ANSWER",
        refusal: "NO_RECORDS",
        sources: [],
        answer: { sourceIds: [], followUps: [] },
      });
      expect(f.model.requests).toHaveLength(1);
      expect(f.tools.execute).toHaveBeenCalledTimes(1);
    },
  );
  it("grounds a result from this turn and logs metadata per call", async () => {
    const f = setup();
    expect((await f.service.execute(jobContext(), { question: "How many jobs?" })).kind).toBe(
      "ANSWER",
    );
    expect(f.repo.reserveCall).toHaveBeenCalledTimes(2);
    expect(f.repo.meterCall).toHaveBeenCalledTimes(2);
    expect(f.repo.finishTurn).toHaveBeenCalledWith(expect.anything(), "ANSWERED");
    expect(f.repo.reserveCall.mock.calls[1]?.[3]).toEqual({
      toolNames: ["list_jobs"],
      sourceIds: ["s"],
    });
    expect(JSON.stringify(f.repo.reserveCall.mock.calls)).not.toContain("How many");
  });
  it("expands list citations and advertises fact and list limits", async () => {
    const f = setup([call, answer("s1.name")]);
    f.tools.execute.mockResolvedValue({
      status: "OK",
      sources: [
        { ...source, facts: { name: "Job" }, countSourceId: "count" },
        { ...source, sourceId: "count", facts: { count: 1 } },
      ],
    });
    const out = await f.service.execute(jobContext(), { question: "How many jobs?" });
    expect(out).toMatchObject({ kind: "ANSWER", answer: { sourceIds: ["s", "count"] } });
    expect(f.model.requests[0]?.instructions).toContain(
      "at most 12 individual fact refs plus at most one whole-list ref",
    );
    expect(f.model.requests[1]?.messages[1]?.text).not.toContain("countSourceId");
  });
  it("passes authorized question-only references to grounding without treating them as amounts", async () => {
    const f = setup([call, answer()]);
    f.repo.readableReferences.mockResolvedValue(["QUESTION-009"]);
    expect(
      await f.service.execute(jobContext(), { question: "What is linked to QUESTION-009?" }),
    ).toMatchObject({ kind: "ANSWER" });
  });
  it("drops sensitive follow-ups without discarding an otherwise grounded answer", async () => {
    const f = setup([
      call,
      {
        usage,
        result: {
          kind: "ANSWER",
          answer: {
            parts: [{ say: "RECORDS_SHOW" }, { show: "s1.count" }],
            followUps: ["password=secret", "Why 99?", "Which job?"],
          },
        },
      },
    ]);
    expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toMatchObject({
      kind: "ANSWER",
      answer: {
        text: "Here is what the records show:\n\nJob\nRecord count: 5",
        followUps: ["Which job?"],
      },
    });
  });
  it("shows the saved finding sentence after expansion, never the model's direction", async () => {
    const f = setup([call, answer("s1.findings.0.text")]);
    const saved = "Overall: quoted price is 43.0% above past quoted prices.";
    f.tools.execute.mockResolvedValue({
      status: "OK",
      sources: [
        { ...source, facts: { findings: [{ text: saved }] }, typedFactPaths: ["findings.*.text"] },
      ],
    });
    expect(await f.service.execute(jobContext(), { question: "Price findings?" })).toMatchObject({
      kind: "ANSWER",
      answer: { text: `Here is what the records show:\n\nJob\nFindings: ${saved}` },
    });
  });
  it("uses no model and no usage row when disabled or no key", async () => {
    for (const [enabled, model] of [
      [false, new FakeAssistantModel([])],
      [true, null],
    ] as const) {
      const f = setup();
      const out = await new AskAssistant(model, { ...config, enabled }, f.repo, f.tools).execute(
        jobContext(),
        { question: "Jobs?" },
      );
      expect(out.kind).toBe("FALLBACK");
      expect(f.repo.reserveCall).not.toHaveBeenCalled();
    }
    const f = setup();
    f.repo.enabled.mockResolvedValue(false);
    expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toEqual({
      kind: "FALLBACK",
      reason: "DISABLED",
    });
    expect(f.model.requests).toHaveLength(0);
  });
  it("rejects unsupported output and provider failures", async () => {
    for (const script of [[call, answer("6 jobs.")], []]) {
      const f = setup(script);
      expect((await f.service.execute(jobContext(), { question: "Jobs?" })).kind).toBe("FALLBACK");
    }
  });
  it("keeps known billed usage when the provider output is truncated", async () => {
    const f = setup();
    const model = {
      generate: vi.fn().mockRejectedValue(new AssistantModelError("OUTPUT_CAP", usage)),
    };
    expect(
      await new AskAssistant(model, config, f.repo, f.tools).execute(jobContext(), {
        question: "Jobs?",
      }),
    ).toEqual({ kind: "FALLBACK", reason: "OUTPUT_CAP" });
    expect(f.repo.meterCall).toHaveBeenCalledWith(expect.anything(), "call", usage, "0.000055000");
    expect(f.repo.finishTurn).toHaveBeenCalledWith(expect.anything(), "FALLBACK_OUTPUT_CAP", {
      callId: "call",
      code: "OUTPUT_CAP",
    });
  });
  it("enforces the tool and organization caps", async () => {
    const f = setup(Array.from({ length: 7 }, () => call));
    expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toEqual({
      kind: "FALLBACK",
      reason: "TOOL_CAP",
    });
    expect(f.tools.execute).toHaveBeenCalledTimes(1);
    const g = setup();
    g.repo.reserveCall.mockResolvedValue(null);
    expect(await g.service.execute(jobContext(), { question: "Jobs?" })).toEqual({
      kind: "FALLBACK",
      reason: "DAILY_CAP",
    });
    expect(g.model.requests).toHaveLength(0);
  });
  it("times out even when a provider fails to honor its abort signal", async () => {
    const f = setup();
    const model = { generate: () => new Promise<ModelReply>(() => {}) };
    expect(
      await new AskAssistant(model, { ...config, timeoutMs: 10 }, f.repo, f.tools).execute(
        jobContext(),
        { question: "Jobs?" },
      ),
    ).toEqual({ kind: "FALLBACK", reason: "TIMEOUT" });
  });
  it("rechecks access before sending results and before displaying the answer", async () => {
    const f = setup();
    f.tools.canSend.mockResolvedValueOnce(true).mockResolvedValue(false);
    expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toEqual({
      kind: "FALLBACK",
      reason: "ACCESS_CHANGED",
    });
    expect(f.model.requests).toHaveLength(1);
  });
  it("redacts questions and record text before sending and supplies fixed refusals", async () => {
    const f = setup([
      call,
      {
        usage,
        result: {
          kind: "ANSWER",
          answer: { parts: [], followUps: [] },
        },
      },
    ]);
    f.tools.execute.mockResolvedValue({ status: "EXCLUDED", sources: [] });
    const out = await f.service.execute(jobContext(), { question: "專案 A123456789?" });
    expect(out.kind === "ANSWER" && out.answer.text).toBe("此專案已設定為不提供給 AI。");
    expect(f.model.requests[0]?.messages[0]?.text).not.toContain("A123456789");
  });
  it.each(["20261103-01", "2026-0012", "113-0825-01", "J-2611-2345"])(
    "keeps the authorized question, result and answer reference %s",
    async (reference) => {
      const f = setup([call, answer("s1.reference")]);
      f.repo.readableReferences.mockResolvedValue([reference]);
      f.tools.execute.mockResolvedValue({
        status: "OK",
        sources: [
          {
            ...source,
            projectKeys: [reference],
            facts: {
              reference,
              observationType: "QUOTED_PRICE",
              amount: "12500000.00",
              name: "A123456789 12345678901234",
              evidenceReferenceIds: ["private_evidence"],
            },
            typedFactPaths: ["reference", "amount", "observationType"],
          },
        ],
      });
      const out = await f.service.execute(jobContext(), {
        question: `What is the price for ${reference}?`,
      });
      expect(out.kind).toBe("ANSWER");
      expect(f.model.requests[0]?.messages[0]?.text).toContain(reference);
      const sent = f.model.requests[1]?.messages[1]?.text ?? "";
      expect(sent).toContain("12500000.00");
      expect(sent).toContain(reference);
      expect(sent).not.toMatch(/A123456789|12345678901234|evidenceReferenceIds|private_evidence/);
      expect(f.repo.readableReferences).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([reference]),
      );
    },
  );
  it("returns a code identifying a discarded answer without logging its text", async () => {
    const f = setup([call, answer("6 jobs.")]);
    expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toEqual({
      kind: "FALLBACK",
      reason: "UNGROUNDED",
      discardReason: "UNKNOWN_REFERENCE",
    });
    expect(JSON.stringify(f.repo.finishTurn.mock.calls)).not.toContain("6 jobs");
  });
  it.each(["NO_RECORDS", "OUT_OF_DATE", "EXCLUDED", "UNAVAILABLE"] as const)(
    "preserves refusal cause %s for the experience fallback decision",
    async (status) => {
      const f = setup([
        call,
        {
          usage,
          result: { kind: "ANSWER", answer: { parts: [], followUps: [] } },
        },
      ]);
      f.tools.execute.mockResolvedValue({ status, sources: [] });
      expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toMatchObject({
        kind: "ANSWER",
        refusal: status,
      });
    },
  );
  it("uses resolved subjects instead of the page default, and retains the page language in links", async () => {
    const f = setup([call, answer()]);
    const named = { projectKey: "J", names: ["Named job", "指定專案"] };
    f.tools.resolveSubjects.mockResolvedValue({
      kind: "AVAILABLE",
      named: [named],
      projects: [named],
    });
    const result = await f.service.execute(jobContext({ locale: "zh-TW" }), {
      question: "What is the status of Named job?",
      projectKey: "DEFAULT",
    });
    expect(result).toMatchObject({
      kind: "ANSWER",
      locale: "en",
      sources: [{ href: "/zh-TW/projects/J" }],
    });
    const message = JSON.parse(f.model.requests[0]!.messages[0]!.text);
    expect(message.subjectProjects).toEqual([{ reference: "J", names: ["Named job", "指定專案"] }]);
    expect(message).not.toHaveProperty("selectedProjectReference");
    expect(f.model.requests[0]!.instructions).toContain(
      "follow-up questions the person can ask and these read tools can answer",
    );
  });
  it("uses only redacted sent subject names for grounding, never unsent authorized names", async () => {
    const named = {
      projectKey: "J",
      names: ["Active Design Project 01", "進行中設計專案01", "Client A123456789 12345678901234"],
    };
    for (const text of [
      "Active Design Project 01",
      "進行中設計專案01",
      "Client A123456789 12345678901234",
      "Unsent job 99",
    ]) {
      const f = setup([
        call,
        { usage, result: { kind: "ANSWER", answer: { text, sourceIds: ["s"], followUps: [] } } },
      ]);
      f.tools.resolveSubjects.mockResolvedValue({
        kind: "AVAILABLE",
        named: [named],
        projects: [named, { projectKey: "OTHER", names: ["Unsent job 99"] }],
      });
      expect(
        await f.service.execute(jobContext(), { question: "Active Design Project 01 status?" }),
      ).toMatchObject({ kind: "FALLBACK", reason: "INVALID_OUTPUT" });
      const sent = f.model.requests[0]!.messages[0]!.text;
      expect(sent).not.toContain("A123456789");
      expect(sent).not.toContain("12345678901234");
      expect(sent).not.toContain("Unsent job 99");
    }
  });
  it("sends the selected page only when no job is named; Home without selection has none", async () => {
    for (const projectKey of [undefined, "J"]) {
      const f = setup();
      await f.service.execute(jobContext(), {
        question: "How many jobs?",
        ...(projectKey ? { projectKey } : {}),
      });
      expect(JSON.parse(f.model.requests[0]!.messages[0]!.text).selectedProjectReference).toBe(
        projectKey,
      );
    }
  });
  it("refuses a tool request for the page default when the question names another job", async () => {
    const f = setup([
      {
        usage,
        result: {
          kind: "TOOLS",
          calls: [{ name: "get_quote_status", arguments: { projectKey: "DEFAULT" } }],
        },
      },
    ]);
    const named = { projectKey: "J", names: ["Named job"] };
    f.tools.resolveSubjects.mockResolvedValue({
      kind: "AVAILABLE",
      named: [named],
      projects: [named],
    });
    expect(
      await f.service.execute(jobContext(), {
        question: "Named job quote?",
        projectKey: "DEFAULT",
      }),
    ).toMatchObject({ kind: "ANSWER", refusal: "UNAVAILABLE" });
    expect(f.tools.execute).not.toHaveBeenCalled();
  });
  it("rejects an answer citing a different job as its subject", async () => {
    const f = setup();
    f.tools.resolveSubjects.mockResolvedValue({
      kind: "AVAILABLE",
      named: [{ projectKey: "OTHER", names: ["Other job"] }],
      projects: [],
    });
    expect(await f.service.execute(jobContext(), { question: "Other job?" })).toMatchObject({
      kind: "FALLBACK",
      discardReason: "SUBJECT_MISMATCH",
    });
  });
  it.each(["UNAVAILABLE", "EXCLUDED"])(
    "ends a named-job %s after the first model call",
    async (status) => {
      const request = {
        usage,
        result: {
          kind: "TOOLS" as const,
          calls: [{ name: "get_quote_status" as const, arguments: { projectKey: "J" } }],
        },
      };
      const f = setup([request]);
      f.tools.execute.mockResolvedValue({ status, sources: [] });
      f.tools.resolveSubjects.mockResolvedValue({
        kind: "AVAILABLE",
        named: [{ projectKey: "J", names: ["Job"] }],
        projects: [{ projectKey: "J", names: ["Job"] }],
      });
      expect(await f.service.execute(jobContext(), { question: "Job quote total?" })).toMatchObject(
        { kind: "ANSWER", refusal: status },
      );
      expect(f.model.requests).toHaveLength(1);
    },
  );
  it("offers only submit_answer after a repeated call and rechecks cached-source access", async () => {
    const f = setup([call, call, answer()]);
    expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toMatchObject({
      kind: "ANSWER",
    });
    expect(f.model.requests[2]!.tools).toEqual([]);
    expect(f.tools.execute).toHaveBeenCalledTimes(1);
    const denied = setup([call, call, answer()]);
    denied.tools.canSend
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    expect(await denied.service.execute(jobContext(), { question: "Jobs?" })).toMatchObject({
      kind: "FALLBACK",
      reason: "ACCESS_CHANGED",
    });
    expect(denied.model.requests).toHaveLength(2);
  });
  it("allows a final answer on call five while retaining the six-tool safety limit", async () => {
    const f = setup([
      ...Array.from({ length: 4 }, (_, offset) => ({
        usage,
        result: {
          kind: "TOOLS" as const,
          calls: [{ name: "list_jobs" as const, arguments: { offset } }],
        },
      })),
      answer(),
    ]);
    expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toMatchObject({
      kind: "ANSWER",
    });
    expect(f.model.requests).toHaveLength(5);
    expect(f.model.requests[4]!.tools).toEqual([]);
    expect(config.maxToolCalls).toBe(6);
  });
  it("reuses identical tool arguments regardless of their key order", async () => {
    const calls = [
      { name: "list_jobs" as const, arguments: { query: "Job", offset: 0 } },
      { name: "list_jobs" as const, arguments: { offset: 0, query: "Job" } },
    ];
    const f = setup([{ usage, result: { kind: "TOOLS", calls } }, answer()]);
    expect((await f.service.execute(jobContext(), { question: "Jobs?" })).kind).toBe("ANSWER");
    expect(f.tools.execute).toHaveBeenCalledTimes(1);
  });
  it.each(["NO_RECORDS", "OUT_OF_DATE"])(
    "returns a read-only comparison link after the comparison turn ends for %s",
    async (status) => {
      const f = setup([
        {
          usage,
          result: {
            kind: "TOOLS",
            calls: [{ name: "get_saved_comparison", arguments: { projectKey: "J" } }],
          },
        },
        { usage, result: { kind: "ANSWER", answer: { parts: [], followUps: [] } } },
      ]);
      f.tools.execute.mockResolvedValue({ status, sources: [], comparisonProjectKey: "J" });
      const out = await f.service.execute(jobContext({ locale: "zh-TW" }), {
        question: "Show the saved comparison for J",
      });
      expect(out).toMatchObject({
        kind: "ANSWER",
        refusal: status,
        sources: [],
        action: { label: "Open comparison", href: "/zh-TW/projects/J/compare" },
      });
      expect(f.model.requests).toHaveLength(2);
    },
  );
  it.each(["NO_RECORDS", "OUT_OF_DATE"] as const)(
    "continues from %s comparison to item prices, including both calls in one reply",
    async (status) => {
      for (const batched of [true, false]) {
        const comparison = { name: "get_past_prices" as const, arguments: { projectKey: "J" } };
        const item = {
          name: "get_item_prices" as const,
          arguments: { description: "Ceiling", projectKey: "J" },
        };
        const f = setup([
          { usage, result: { kind: "TOOLS", calls: batched ? [comparison, item] : [comparison] } },
          ...(!batched ? [{ usage, result: { kind: "TOOLS" as const, calls: [item] } }] : []),
          answer("s1.lastPrice"),
        ]);
        f.tools.execute
          .mockResolvedValueOnce({ status, sources: [], comparisonProjectKey: "J" })
          .mockResolvedValueOnce({
            status: "OK",
            sources: [
              {
                ...source,
                facts: {
                  lastPrice: "NT$3,200",
                  lastQuoted: "2026-11-25",
                  timesQuoted: 2,
                  documentNumber: "J-Q1",
                },
              },
            ],
          });
        const out = await f.service.execute(jobContext(), {
          question: "What do we quote for Ceiling per ping?",
          projectKey: "J",
        });
        expect(out).toMatchObject({
          kind: "ANSWER",
          answer: { text: expect.stringContaining("NT$3,200") },
        });
        expect(out).not.toHaveProperty("refusal");
        expect(f.tools.execute).toHaveBeenCalledTimes(2);
      }
    },
  );
  it("answers a named closed job from another job’s bar after an unavailable comparison", async () => {
    const named = { projectKey: "K", names: ["Closed job", "結案專案"] };
    const f = setup([
      {
        usage,
        result: {
          kind: "TOOLS",
          calls: [{ name: "get_saved_comparison", arguments: { projectKey: "K" } }],
        },
      },
      {
        usage,
        result: { kind: "TOOLS", calls: [{ name: "get_closed_job_lessons", arguments: {} }] },
      },
      answer("s1.overallDifference"),
    ]);
    f.tools.resolveSubjects.mockResolvedValue({
      kind: "AVAILABLE",
      named: [named],
      projects: [named],
    });
    f.tools.execute
      .mockResolvedValueOnce({ status: "NO_RECORDS", sources: [], comparisonProjectKey: "K" })
      .mockResolvedValueOnce({
        status: "OK",
        sources: [
          {
            ...source,
            projectKeys: ["K"],
            facts: { overallDifference: "Actual cost is NT$100 below the quote." },
          },
        ],
      });
    const out = await f.service.execute(jobContext(), {
      question: "How does Closed job’s actual cost compare to its quote?",
      projectKey: "J",
    });
    expect(out).toMatchObject({
      kind: "ANSWER",
      answer: { text: expect.stringContaining("NT$100 below") },
    });
    expect(JSON.parse(f.model.requests[0]!.messages[0]!.text)).not.toHaveProperty(
      "selectedProjectReference",
    );
    expect(out).not.toHaveProperty("action");
  });
  it("does not attach an unrelated comparison notice when an item question ends without facts", async () => {
    const f = setup([
      {
        usage,
        result: {
          kind: "TOOLS",
          calls: [{ name: "get_saved_comparison", arguments: { projectKey: "J" } }],
        },
      },
      { usage, result: { kind: "ANSWER", answer: { parts: [], followUps: [] } } },
    ]);
    f.tools.execute.mockResolvedValue({
      status: "OUT_OF_DATE",
      sources: [],
      comparisonProjectKey: "J",
    });
    const out = await f.service.execute(jobContext(), {
      question: "What do we quote for Ceiling per ping?",
      projectKey: "J",
    });
    expect(out).toMatchObject({ kind: "ANSWER", refusal: "OUT_OF_DATE" });
    expect(out).not.toHaveProperty("action");
    expect(out.kind === "ANSWER" && out.answer.text).not.toContain("comparison");
  });
  it("does not execute a comparison for the page default when a different closed job is named, and lets its closed-record tool answer", async () => {
    const named = { projectKey: "K", names: ["Closed job"] };
    const f = setup([
      {
        usage,
        result: {
          kind: "TOOLS",
          calls: [{ name: "get_saved_comparison", arguments: { projectKey: "J" } }],
        },
      },
      {
        usage,
        result: { kind: "TOOLS", calls: [{ name: "get_closed_job_lessons", arguments: {} }] },
      },
      answer("s1.overallDifference"),
    ]);
    f.tools.resolveSubjects.mockResolvedValue({
      kind: "AVAILABLE",
      named: [named],
      projects: [named],
    });
    f.tools.execute.mockResolvedValue({
      status: "OK",
      sources: [
        {
          ...source,
          projectKeys: ["K"],
          facts: { overallDifference: "Actual cost is NT$100 below the quote." },
        },
      ],
    });
    const out = await f.service.execute(jobContext(), {
      question: "How does Closed job’s actual cost compare to its quote?",
      projectKey: "J",
    });
    expect(f.tools.execute).toHaveBeenCalledTimes(1);
    expect(f.tools.execute.mock.calls[0]![1]).toEqual({
      name: "get_closed_job_lessons",
      arguments: {},
    });
    expect(out).toMatchObject({
      kind: "ANSWER",
      answer: { text: expect.stringContaining("NT$100 below") },
    });
    expect(out).not.toHaveProperty("action");
  });
});
