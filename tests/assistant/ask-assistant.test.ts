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
const answer = (text = "5 jobs."): ModelReply => ({
  usage,
  result: { kind: "ANSWER", answer: { text, sourceIds: ["s"], followUps: [] } },
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
    execute: vi.fn().mockResolvedValue({ status: "OK", sources: [source] }),
    canSend: vi.fn().mockResolvedValue(true),
  };
  return { model, repo, tools, service: new AskAssistant(model, config, repo, tools) };
}
describe("bounded read-only assistant", () => {
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
  it("expands list citations at the application boundary and keeps the model's 120-word instruction", async () => {
    const f = setup([call, answer("one job")]);
    f.tools.execute.mockResolvedValue({
      status: "OK",
      sources: [
        { ...source, facts: { name: "Job" }, countSourceId: "count" },
        { ...source, sourceId: "count", facts: { count: 1 } },
      ],
    });
    const out = await f.service.execute(jobContext(), { question: "How many jobs?" });
    expect(out).toMatchObject({ kind: "ANSWER", answer: { sourceIds: ["s", "count"] } });
    expect(f.model.requests[0]?.instructions).toContain("At most 120 words.");
    expect(f.model.requests[1]?.messages[1]?.text).not.toContain("countSourceId");
  });
  it("passes authorized question-only references to grounding without treating them as amounts", async () => {
    const f = setup([call, answer("QUESTION-009: 5 jobs")]);
    f.repo.readableReferences.mockResolvedValue(["QUESTION-009"]);
    expect(
      await f.service.execute(jobContext(), { question: "What is linked to QUESTION-009?" }),
    ).toMatchObject({ kind: "ANSWER" });
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
    expect(f.repo.finishTurn).toHaveBeenCalledWith(expect.anything(), "FALLBACK_OUTPUT_CAP");
  });
  it("enforces the tool and organization caps", async () => {
    const f = setup(Array.from({ length: 7 }, () => call));
    expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toEqual({
      kind: "FALLBACK",
      reason: "TOOL_CAP",
    });
    expect(f.tools.execute).toHaveBeenCalledTimes(6);
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
          answer: { text: "untrusted refusal", sourceIds: [], followUps: [] },
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
      const text = `${reference}: 12500000.00`;
      const f = setup([call, answer(text)]);
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
      discardReason: "UNSUPPORTED_NUMBER",
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
          result: { kind: "ANSWER", answer: { text: "No records", sourceIds: [], followUps: [] } },
        },
      ]);
      f.tools.execute.mockResolvedValue({ status, sources: [] });
      expect(await f.service.execute(jobContext(), { question: "Jobs?" })).toMatchObject({
        kind: "ANSWER",
        refusal: status,
      });
    },
  );
});
