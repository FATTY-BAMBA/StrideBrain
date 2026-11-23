import { describe, it, expect, vi } from "vitest";
import { draftArea } from "@/modules/projects/domain/draft-area";
import {
  supportJobDraft,
  matchDraftClient,
  draftFields,
} from "@/modules/assistant/domain/job-draft";
import { DraftJob } from "@/modules/assistant/application/draft-job";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import type { AssistantRepositoryPort } from "@/repositories/ports/assistant-repository";
import { AssistantModelError } from "@/modules/assistant/domain/model-error";
import { jobContext } from "../projects/job-fixture";

export const emptyDraft = () =>
  Object.fromEntries(draftFields.map((k) => [k, k === "scopeCategoryIds" ? [] : null]));
const quoted = (value: string, quote = value) => ({ value, quote });
const config = assistantConfig({
  STRIDEBRAIN_AI_ENABLED: "true",
  STRIDEBRAIN_AI_PAID_TIER_CONFIRMED: "true",
  STRIDEBRAIN_AI_TIMEOUT_MS: "1000",
});
function setup(draft: unknown = { ...emptyDraft(), name: quoted("旗艦店裝修") }) {
  const model = {
    draftJob: vi.fn().mockResolvedValue({ draft, usage: { inputTokens: 100, outputTokens: 10 } }),
  };
  const usage = {
    enabled: vi.fn().mockResolvedValue(true),
    readableReferences: vi.fn(),
    jobPolicy: vi.fn(),
    settings: vi.fn(),
    setControl: vi.fn(),
    reserveCall: vi.fn().mockResolvedValue("usage"),
    meterCall: vi.fn().mockResolvedValue(undefined),
    finishTurn: vi.fn().mockResolvedValue(undefined),
  } satisfies AssistantRepositoryPort;
  const clients = {
    listActiveClients: vi
      .fn()
      .mockResolvedValue([
        { businessKey: "CL-1", nameEn: "Star Retail", nameZhTw: "星序零售台灣" },
      ]),
  };
  return { model, usage, clients, service: new DraftJob(model, config, usage, clients) };
}
describe("draft support and area", () => {
  it("does not take a substring of larger area digits, but accepts sentence punctuation", () => {
    const raw = { ...emptyDraft(), area: { digits: "20", unit: "m2", quote: "20 m2" } };
    expect(supportJobDraft("120 m2.", raw)?.values.areaQuantity).toBeUndefined();
    expect(supportJobDraft("20 m2.", raw)?.values.areaQuantity).toBe("20");
  });
  it("does not take the tail of a number grouped with commas", () => {
    const raw = { ...emptyDraft(), area: { digits: "200", unit: "m2", quote: "200 m2" } };
    const ping = { ...emptyDraft(), area: { digits: "200", unit: "坪", quote: "200 坪" } };
    expect(supportJobDraft("1,200 m2 shop", raw)?.values.areaQuantity).toBeUndefined();
    expect(supportJobDraft("面積 1,200 坪", ping)?.values.areaQuantity).toBeUndefined();
    expect(supportJobDraft("Taipei City, 200 m2", raw)?.values.areaQuantity).toBe("200");
    expect(supportJobDraft("台北市，200 m2", raw)?.values.areaQuantity).toBe("200");
  });
  it.each([
    ["120", "坪", "396.694"],
    ["１２０", "坪", "396.694"],
    ["1", "坪", "3.306"],
    ["85.5", "m²", "85.5"],
    ["８５", "m2", "85"],
    ["三十", "坪", null],
    ["30", "feet", null],
    ["0", "坪", null],
    ["-1", "坪", null],
  ] as const)("converts %s %s exactly", (value, unit, expected) => {
    expect(draftArea(value, unit)).toBe(expected);
  });
  it("normalizes support, drops individual invented/unsupported fields, keeps the rest", () => {
    const draft = supportJobDraft("旗艦店裝修，信義區，１２０ 坪，木作", {
      ...emptyDraft(),
      name: quoted("旗艦店裝修"),
      locationCity: quoted("台北市"),
      locationDistrict: quoted("信義區"),
      subtype: quoted("RETAIL_FLAGSHIP", "旗艦店"),
      scopeCategoryIds: [quoted("CUSTOM_MILLWORK", "木作"), quoted("UNKNOWN", "木作")],
      area: { digits: "120", unit: "坪", quote: "１２０\n坪" },
    });
    expect(draft?.values).toEqual({
      name: "旗艦店裝修",
      locationDistrict: "信義區",
      subtype: "RETAIL_FLAGSHIP",
      areaQuantity: "396.694",
    });
    expect(draft?.scopeCategoryIds).toEqual(["CUSTOM_MILLWORK"]);
    expect(draft?.dropped).toContain("locationCity");
  });
  it("text values must equal the quoted words, never translated names or sensitive placeholders", () => {
    const draft = supportJobDraft("旗艦店裝修 [removed]", {
      ...emptyDraft(),
      name: quoted("Flagship", "旗艦店裝修"),
      clientName: quoted("[removed]"),
    });
    expect(draft?.kept).toEqual([]);
    expect(supportJobDraft("x", { ...emptyDraft(), reference: "J-1" })).toBeNull();
    expect(supportJobDraft("x", {})).toBeNull();
  });
  it("matches either client name with NFKC, trim and case, and refuses ambiguous matches", () => {
    const clients = [{ businessKey: "a", nameEn: "Lumen Retail", nameZhTw: "光零售" }];
    expect(matchDraftClient(" ＬＵＭＥＮ Retail ", clients)).toBe("a");
    expect(matchDraftClient("光零售", clients)).toBe("a");
    expect(matchDraftClient("missing", clients)).toBeNull();
    expect(
      matchDraftClient("光零售", [...clients, { ...clients[0]!, businessKey: "b" }]),
    ).toBeNull();
  });
});
describe("DraftJob fake-model use case", () => {
  it("makes one redacted call, matches clients afterwards, meters without retaining text", async () => {
    const f = setup({
      ...emptyDraft(),
      name: quoted("旗艦店裝修"),
      clientName: quoted("星序零售台灣"),
    });
    const text = `旗艦店裝修，客戶星序零售台灣。電話 0912-345-678，身分證 A123456789。${"請使用明亮的照明。".repeat(65)}`;
    expect(text.length).toBeGreaterThan(600);
    const out = await f.service.execute(jobContext(), text);
    expect(out).toMatchObject({
      kind: "DRAFTED",
      draft: { clientMode: "existing", clientBusinessKey: "CL-1" },
    });
    expect(f.model.draftJob).toHaveBeenCalledTimes(1);
    const sent = JSON.stringify(f.model.draftJob.mock.calls[0]);
    expect(sent).not.toContain("0912-345-678");
    expect(sent).not.toContain("A123456789");
    expect(sent).not.toContain("Star Retail");
    expect(sent).not.toContain("CL-1");
    expect(sent).toContain("[removed]");
    expect(f.usage.reserveCall).toHaveBeenCalledTimes(1);
    expect(f.usage.meterCall).toHaveBeenCalledTimes(1);
    expect(
      JSON.stringify([
        ...f.usage.reserveCall.mock.calls,
        ...f.usage.meterCall.mock.calls,
        ...f.usage.finishTurn.mock.calls,
      ]),
    ).not.toContain("旗艦店裝修");
    expect(f.usage.readableReferences).not.toHaveBeenCalled();
    expect(f.usage.jobPolicy).not.toHaveBeenCalled();
  });
  it.each(["project:create", "project:read"] as const)(
    "checks %s before model or repository access",
    async (capability) => {
      const f = setup();
      const c = jobContext();
      const capabilities = new Set(c.capabilities);
      capabilities.delete(capability);
      expect(await f.service.execute({ ...c, capabilities }, "旗艦店裝修")).toMatchObject({
        kind: "UNAVAILABLE",
      });
      expect(f.model.draftJob).not.toHaveBeenCalled();
      expect(f.usage.enabled).not.toHaveBeenCalled();
      expect(f.clients.listActiveClients).not.toHaveBeenCalled();
    },
  );
  it("supports empty output, new clients, disabled and daily-cap outcomes without retry", async () => {
    const f = setup(emptyDraft());
    expect(await f.service.execute(jobContext(), "今天天氣很好")).toMatchObject({ kind: "EMPTY" });
    expect(f.clients.listActiveClients).not.toHaveBeenCalled();
    const n = setup({ ...emptyDraft(), clientName: quoted("New Client") });
    expect(await n.service.execute(jobContext(), "New Client")).toMatchObject({
      kind: "DRAFTED",
      draft: { clientMode: "new", clientBusinessKey: "" },
    });
    const off = setup();
    off.usage.enabled.mockResolvedValue(false);
    expect(await off.service.execute(jobContext(), "旗艦店裝修")).toMatchObject({
      reason: "DISABLED",
    });
    expect(off.model.draftJob).not.toHaveBeenCalled();
    const cap = setup();
    cap.usage.reserveCall.mockResolvedValue(null);
    expect(await cap.service.execute(jobContext(), "旗艦店裝修")).toMatchObject({
      reason: "DAILY_CAP",
    });
    expect(cap.model.draftJob).not.toHaveBeenCalled();
  });
  it("logs invalid output with known usage and retains no model content", async () => {
    const f = setup({ unexpected: "sensitive" });
    expect(await f.service.execute(jobContext(), "旗艦店裝修")).toMatchObject({
      reason: "INVALID_OUTPUT",
    });
    expect(f.usage.finishTurn).toHaveBeenCalledWith(expect.anything(), "FALLBACK_INVALID_OUTPUT");
    const broken = setup();
    broken.model.draftJob.mockRejectedValue(
      new AssistantModelError("INVALID_OUTPUT", { inputTokens: 50, outputTokens: 2 }),
    );
    expect(await broken.service.execute(jobContext(), "旗艦店裝修")).toMatchObject({
      reason: "INVALID_OUTPUT",
    });
    expect(broken.usage.meterCall).toHaveBeenCalledTimes(1);
    expect(broken.model.draftJob).toHaveBeenCalledTimes(1);
  });
  it("times out even if a provider ignores abort, with no retry", async () => {
    vi.useFakeTimers();
    try {
      const f = setup();
      f.model.draftJob.mockImplementation(() => new Promise(() => {}));
      const result = f.service.execute(jobContext(), "旗艦店裝修");
      await vi.advanceTimersByTimeAsync(1001);
      expect(await result).toMatchObject({ reason: "TIMEOUT" });
      expect(f.model.draftJob).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
