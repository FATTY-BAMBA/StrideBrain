import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { jobContext } from "../projects/job-fixture";
const boundary = vi.hoisted(() => ({ ask: vi.fn(), context: vi.fn(), legacy: vi.fn() }));
vi.mock("@/lib/server/assistant-services", () => ({
  createAssistantServices: () => ({ ask: { execute: boundary.ask } }),
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: boundary.context }));
vi.mock("@/lib/server/demo-value-context", () => ({ loadDemoValueContext: boundary.legacy }));
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
  it("keeps the no-key behavior identical and adds a visible state only for an attempted AI failure", async () => {
    vi.stubEnv("STRIDEBRAIN_GEMINI_API_KEY", "");
    const noKey = await askHomeAction(initialHomeChatState, form());
    expect(boundary.ask).not.toHaveBeenCalled();
    expect(noKey.turns.at(-1)?.aiFallback).toBeUndefined();
    vi.stubEnv("STRIDEBRAIN_GEMINI_API_KEY", "synthetic-test-key");
    boundary.ask.mockResolvedValue({ kind: "FALLBACK", reason: "TIMEOUT" });
    const failed = await askHomeAction(initialHomeChatState, form());
    expect(failed.turns.at(-1)?.text).toBe(noKey.turns.at(-1)?.text);
    expect(failed.turns.at(-1)?.aiFallback).toBe(true);
  });
  it("leaves organization-off behavior on the keyword path", async () => {
    boundary.ask.mockResolvedValue({ kind: "FALLBACK", reason: "DISABLED" });
    const result = await askHomeAction(initialHomeChatState, form());
    expect(result.turns.at(-1)?.aiFallback).toBeUndefined();
    expect(boundary.legacy).toHaveBeenCalled();
  });
});
