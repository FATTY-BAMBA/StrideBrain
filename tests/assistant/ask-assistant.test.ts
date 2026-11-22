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
});
