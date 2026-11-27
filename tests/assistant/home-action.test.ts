vi.mock("@/lib/server/assistant-turn-timing", () => ({
  scheduleAssistantTurnTiming: boundary.timing,
}));
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { jobContext } from "../projects/job-fixture";
const boundary = vi.hoisted(() => ({
  ask: vi.fn(),
  timing: vi.fn(),
  context: vi.fn(),
  legacy: vi.fn(),
  runComparison: vi.fn(),
}));
vi.mock("@/lib/server/assistant-services", () => ({
  createAssistantServices: () => ({ ask: { execute: boundary.ask } }),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: boundary.context }));
vi.mock("@/lib/server/demo-value-context", () => ({ loadDemoValueContext: boundary.legacy }));
vi.mock("@/lib/server/comparison-services", () => ({
  createComparisonServices: () => ({ runComparison: { execute: boundary.runComparison } }),
}));
import { askHomeAction } from "@/app/[locale]/home-chat-actions";
import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts";
beforeEach(() => {
  vi.stubEnv("STRIDEBRAIN_AI_ENABLED", "true");
  vi.stubEnv("STRIDEBRAIN_AI_PAID_TIER_CONFIRMED", "true");
  vi.stubEnv("STRIDEBRAIN_GEMINI_API_KEY", "synthetic-test-key");
  boundary.context.mockResolvedValue(jobContext());
  boundary.legacy.mockResolvedValue({ projects: [], workspace: null });
});
afterEach(() => vi.unstubAllEnvs());
function form() {
  const value = new FormData();
  value.set("locale", "en");
  value.set("message", "Which jobs await a client?");
  return value;
}
describe("Home assistant integration", () => {
  it("starts timing before runtime resolution and schedules it even for an early refusal", async () => {
    const started = Date.now();
    boundary.ask.mockResolvedValue({
      kind: "ANSWER",
      locale: "en",
      refusal: "UNAVAILABLE",
      answer: { text: "Refused", sourceIds: [], followUps: [] },
      sources: [],
    });
    const result = await askHomeAction(initialHomeChatState, form());
    expect(result.turns.at(-1)?.text).toBe("Refused");
    expect(boundary.timing).toHaveBeenCalledWith(
      expect.objectContaining({ membershipId: jobContext().membershipId }),
      expect.any(Date),
    );
    expect(boundary.timing.mock.calls.at(-1)![1].getTime()).toBeGreaterThanOrEqual(started);
    expect(boundary.timing.mock.invocationCallOrder.at(-1)).toBeLessThan(
      boundary.ask.mock.invocationCallOrder.at(-1)!,
    );
  });
  it("does not execute record search after a discarded answer", async () => {
    boundary.ask.mockResolvedValue({
      kind: "FALLBACK",
      reason: "UNGROUNDED",
      discardReason: "UNSUPPORTED_NUMBER",
      subjectProjectKey: "PRJ-XINYI-026",
    });
    const input = form();
    input.set("message", "PRJ-XINYI-026 quote findings?");
    input.set("projectKey", "J-2611-R7K3");
    const result = await askHomeAction(initialHomeChatState, input);
    expect(boundary.legacy).not.toHaveBeenCalled();
    expect(boundary.runComparison).not.toHaveBeenCalled();
    expect(input.get("projectKey")).toBe("J-2611-R7K3");
    expect(result.turns.at(-1)?.text).toBe("The AI could not answer this time. Please ask again.");
    expect(result.turns.at(-1)?.aiQuestionChips).toEqual([
      { label: "Ask again", question: "PRJ-XINYI-026 quote findings?" },
    ]);
  });
  it("uses AI text and only server-supplied sources; never resends past assistant text", async () => {
    boundary.ask.mockResolvedValue({
      kind: "ANSWER",
      locale: "en",
      answer: { text: "Saved fact", sourceIds: ["s"], followUps: ["Show the job?"] },
      sources: [
        { sourceId: "s", label: "Job", href: "/en/projects/J", facts: {}, projectKeys: ["J"] },
      ],
    });
    const previous = {
      turns: [
        { id: "old", role: "assistant" as const, text: "STALE_PRIVATE_FACT" },
        { id: "user", role: "user" as const, text: "Previous question" },
      ],
      context: {},
    };
    const result = await askHomeAction(previous, form());
    expect(result.turns.at(-1)).toMatchObject({
      ai: true,
      text: "Saved fact",
      aiSources: [{ sourceId: "s", label: "Job", href: "/en/projects/J" }],
    });
    expect(boundary.ask.mock.calls[0]?.[1]).toMatchObject({
      previousQuestions: ["Previous question"],
    });
    expect(JSON.stringify(boundary.ask.mock.calls)).not.toContain("STALE_PRIVATE_FACT");
    expect(boundary.legacy).not.toHaveBeenCalled();
  });
  it("uses record search without a key but retries a failed AI answer", async () => {
    vi.stubEnv("STRIDEBRAIN_GEMINI_API_KEY", "");
    boundary.ask.mockResolvedValue({ kind: "FALLBACK", reason: "NO_KEY" });
    const noKey = await askHomeAction(initialHomeChatState, form());
    expect(boundary.ask).not.toHaveBeenCalled();
    expect(boundary.legacy).toHaveBeenCalled();
    expect(noKey.turns.at(-1)?.aiQuestionChips).toBeUndefined();
    boundary.legacy.mockClear();
    expect(noKey.turns.at(-1)?.aiFallback).toBeUndefined();
    vi.stubEnv("STRIDEBRAIN_GEMINI_API_KEY", "synthetic-test-key");
    boundary.ask.mockResolvedValue({ kind: "FALLBACK", reason: "TIMEOUT" });
    const failed = await askHomeAction(initialHomeChatState, form());
    expect(failed.turns.at(-1)?.text).toBe("The AI could not answer this time. Please ask again.");
    expect(failed.turns.at(-1)?.aiQuestionChips?.[0]?.question).toBe(form().get("message"));
  });
  it.each(["DISABLED", "NO_KEY"])("leaves %s on the keyword path", async (reason) => {
    boundary.ask.mockResolvedValue({ kind: "FALLBACK", reason });
    const result = await askHomeAction(initialHomeChatState, form());
    expect(result.turns.at(-1)?.aiFallback).toBeUndefined();
    expect(boundary.legacy).toHaveBeenCalled();
  });
  it.each(["NO_RECORDS", "OUT_OF_DATE"])(
    "never falls through or writes after %s",
    async (refusal) => {
      boundary.ask.mockResolvedValue({
        kind: "ANSWER",
        locale: "zh-TW",
        refusal,
        answer: { text: "AI refusal", sourceIds: [], followUps: [] },
        sources: [],
      });
      const input = form();
      input.set("locale", "zh-TW");
      input.set("message", "哪些報價還在等客戶回覆？");
      input.set("projectKey", "J-2611-R7K3");
      const result = await askHomeAction(initialHomeChatState, input);
      expect(result.turns.at(-1)).toMatchObject({ text: "AI refusal", ai: true });
      expect(boundary.legacy).not.toHaveBeenCalled();
      expect(boundary.runComparison).not.toHaveBeenCalled();
    },
  );
  it("keeps the AI refusal for an unmatched question", async () => {
    boundary.ask.mockResolvedValue({
      kind: "ANSWER",
      locale: "en",
      refusal: "NO_RECORDS",
      answer: { text: "The records do not show this.", sourceIds: [], followUps: [] },
      sources: [],
    });
    boundary.legacy.mockResolvedValue({
      projects: [],
      workspace: { project: { businessKey: "J" }, openActions: [] },
    });
    const input = form();
    input.set("message", "Will it rain tomorrow?");
    const result = await askHomeAction(initialHomeChatState, input);
    expect(result.turns.at(-1)).toMatchObject({ text: "The records do not show this.", ai: true });
    expect(boundary.runComparison).not.toHaveBeenCalled();
  });
  it("preserves the server-built comparison link without invoking keywords", async () => {
    boundary.ask.mockResolvedValue({
      kind: "ANSWER",
      locale: "en",
      refusal: "OUT_OF_DATE",
      answer: { text: "Saved comparison is out of date", sourceIds: [], followUps: [] },
      sources: [],
      action: { label: "Open comparison", href: "/zh-TW/projects/J/compare" },
    });
    const input = form();
    input.set("message", "Show similar jobs");
    const result = await askHomeAction(initialHomeChatState, input);
    expect(result.turns.at(-1)).toMatchObject({
      ai: true,
      action: { href: "/zh-TW/projects/J/compare" },
    });
    expect(boundary.legacy).not.toHaveBeenCalled();
    expect(boundary.runComparison).not.toHaveBeenCalled();
  });
  it.each(["EXCLUDED", "UNAVAILABLE"])(
    "does not route %s into the keyword path",
    async (refusal) => {
      boundary.ask.mockResolvedValue({
        kind: "ANSWER",
        locale: "en",
        refusal,
        answer: { text: "Fixed refusal", sourceIds: [], followUps: [] },
        sources: [],
      });
      const input = form();
      input.set("message", "Show open actions");
      expect((await askHomeAction(initialHomeChatState, input)).turns.at(-1)?.text).toBe(
        "Fixed refusal",
      );
      expect(boundary.legacy).not.toHaveBeenCalled();
    },
  );
});

it("passes confirmed context separately and rejects repeated, oversized and forged-shape context", async () => {
  boundary.ask.mockResolvedValue({ kind: "FALLBACK", reason: "TIMEOUT" });
  const input = form();
  input.set("message", "Xinyi store total?");
  input.set("projectKey", "PAGE");
  input.set("confirmedProjectKey", "PRJ-XINYI-026");
  const out = await askHomeAction(initialHomeChatState, input);
  expect(boundary.ask.mock.calls.at(-1)![1]).toMatchObject({
    question: "Xinyi store total?",
    projectKey: "PAGE",
    confirmedProjectKey: "PRJ-XINYI-026",
  });
  expect(out.turns.at(-1)?.aiQuestionChips?.[0]).toMatchObject({
    question: "Xinyi store total?",
    confirmedProjectKey: "PRJ-XINYI-026",
  });
  boundary.ask.mockClear();
  input.append("confirmedProjectKey", "J");
  expect(await askHomeAction(initialHomeChatState, input)).toEqual(initialHomeChatState);
  input.set("confirmedProjectKey", "x".repeat(129));
  expect(await askHomeAction(initialHomeChatState, input)).toEqual(initialHomeChatState);
  input.set("confirmedProjectKey", "../private");
  expect(await askHomeAction(initialHomeChatState, input)).toEqual(initialHomeChatState);
  expect(boundary.ask).not.toHaveBeenCalled();
  expect(boundary.legacy).not.toHaveBeenCalled();
});
