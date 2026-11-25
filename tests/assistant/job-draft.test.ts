import { seededFirmLists } from "@/fixtures/firm-lists";
import { createHash } from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import { draftArea } from "@/modules/projects/domain/draft-area";
import {
  supportJobDraft,
  matchDraftClient,
  draftFields,
} from "@/modules/assistant/domain/job-draft";
import { DraftJob, jobDraftInstructions } from "@/modules/assistant/application/draft-job";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import type { AssistantRepositoryPort } from "@/repositories/ports/assistant-repository";
import { AssistantModelError } from "@/modules/assistant/domain/model-error";
import { jobContext } from "../projects/job-fixture";
import { jobDraftCases } from "./job-draft-cases";
import { modelDraftForCase } from "./job-draft-model-fixture";

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
    expect(supportJobDraft("120 m2.", raw, seededFirmLists)?.values.areaQuantity).toBeUndefined();
    expect(supportJobDraft("20 m2.", raw, seededFirmLists)?.values.areaQuantity).toBe("20");
  });
  it("does not take the tail of a number grouped with commas", () => {
    const raw = { ...emptyDraft(), area: { digits: "200", unit: "m2", quote: "200 m2" } };
    const ping = { ...emptyDraft(), area: { digits: "200", unit: "坪", quote: "200 坪" } };
    expect(
      supportJobDraft("1,200 m2 shop", raw, seededFirmLists)?.values.areaQuantity,
    ).toBeUndefined();
    expect(
      supportJobDraft("面積 1,200 坪", ping, seededFirmLists)?.values.areaQuantity,
    ).toBeUndefined();
    expect(supportJobDraft("Taipei City, 200 m2", raw, seededFirmLists)?.values.areaQuantity).toBe(
      "200",
    );
    expect(supportJobDraft("台北市，200 m2", raw, seededFirmLists)?.values.areaQuantity).toBe(
      "200",
    );
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
    const draft = supportJobDraft(
      "旗艦店裝修，信義區，１２０ 坪，木作",
      {
        ...emptyDraft(),
        name: quoted("旗艦店裝修"),
        locationCity: quoted("台北市"),
        locationDistrict: quoted("信義區"),
        subtype: quoted("RETAIL_FLAGSHIP", "旗艦店"),
        scopeCategoryIds: [quoted("CUSTOM_MILLWORK", "木作"), quoted("UNKNOWN", "木作")],
        area: { digits: "120", unit: "坪", quote: "１２０\n坪" },
      },
      seededFirmLists,
    );
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
    const draft = supportJobDraft(
      "旗艦店裝修 [removed]",
      {
        ...emptyDraft(),
        name: quoted("Flagship", "旗艦店裝修"),
        clientName: quoted("[removed]"),
      },
      seededFirmLists,
    );
    expect(draft?.kept).toEqual([]);
    expect(supportJobDraft("x", { ...emptyDraft(), reference: "J-1" }, seededFirmLists)).toBeNull();
    expect(supportJobDraft("x", {}, seededFirmLists)).toBeNull();
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
describe("client support uses distinct occurrences", () => {
  it.each([
    ["en-existing", "Retail"],
    ["zh-TW-existing", "零售"],
    ["zh-TW-district-only", "零售"],
    ["en-client-normalization", "Retail showroom"],
    ["en-client-normalization", "Retail"],
  ])("drops client type borrowed from the job: %s / %s", (id, quote) => {
    const test = jobDraftCases.find((c) => c.id === id)!;
    const draft = supportJobDraft(
      test.text,
      {
        ...modelDraftForCase(test),
        clientType: quoted("RETAIL", quote),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual(test.expected);
    expect(draft.scopeCategoryIds).toEqual(test.scopes);
    expect(draft.dropped).toContain("clientType");
    expect(draft.kept).not.toContain("clientType");
  });
  it.each([
    ["en-full-width", "Retail", "Retail"],
    ["en-written-area", "Thirty Showroom", "Retail showroom"],
  ])("drops both client fields borrowed from the job: %s", (id, client, typeQuote) => {
    const test = jobDraftCases.find((c) => c.id === id)!;
    const draft = supportJobDraft(
      test.text,
      {
        ...modelDraftForCase(test),
        clientName: quoted(client),
        clientType: quoted("RETAIL", typeQuote),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual(test.expected);
    expect(draft.scopeCategoryIds).toEqual(test.scopes);
    expect(draft.dropped).toEqual(expect.arrayContaining(["clientName", "clientType"]));
    expect(draft.kept).toEqual(expect.arrayContaining(["name", "subtype"]));
    expect(draft.kept).not.toContain("clientName");
    expect(draft.kept).not.toContain("clientType");
  });
  it.each([
    ...["en-ping", "en-long-private"].flatMap((id) =>
      ["Retail", "retail", "client type: retail"].map((quote) => [id, quote]),
    ),
    ...["zh-TW-ping", "zh-TW-long-private"].flatMap((id) =>
      ["零售", "客戶類型：零售"].map((quote) => [id, quote]),
    ),
  ])("keeps distinct client-type support: %s / %s", (id, quote) => {
    const test = jobDraftCases.find((c) => c.id === id)!;
    const draft = supportJobDraft(
      test.text,
      {
        ...modelDraftForCase(test),
        clientType: quoted("RETAIL", quote),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual(test.expected);
    expect(draft.kept).toContain("clientType");
    expect(draft.dropped).not.toContain("clientType");
  });
  it.each([
    ["Job name: Aster. Client: Aster.", "Aster"],
    ["Client: Aster Retail. Job name: Aster.", "Aster Retail"],
  ])("tries all name occurrences: %s", (text, client) => {
    const draft = supportJobDraft(
      text,
      {
        ...emptyDraft(),
        name: quoted("Aster"),
        clientName: quoted(client),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual({ name: "Aster", clientName: client });
  });
  it("does not use the client's name as its type", () => {
    const draft = supportJobDraft(
      "Lobby refresh for Coast Hotels.",
      {
        ...emptyDraft(),
        clientName: quoted("Coast Hotels"),
        clientType: quoted("HOSPITALITY", "Hotels"),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual({ clientName: "Coast Hotels" });
    expect(draft.dropped).toContain("clientType");
  });
  it("allows name and subtype to share words", () => {
    const draft = supportJobDraft(
      "光序展示店，信義區，85 坪",
      {
        ...emptyDraft(),
        name: quoted("光序展示店"),
        subtype: quoted("RETAIL_SHOWROOM", "展示店"),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual({ name: "光序展示店", subtype: "RETAIL_SHOWROOM" });
  });
  it("can drop only client name while preserving distinct client type", () => {
    const draft = supportJobDraft(
      "Job name: Aster. Client type: retail.",
      {
        ...emptyDraft(),
        name: quoted("Aster"),
        clientName: quoted("Aster"),
        clientType: quoted("RETAIL", "retail"),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual({ name: "Aster", clientType: "RETAIL" });
    expect(draft.dropped).toContain("clientName");
    expect(draft.dropped).not.toContain("clientType");
  });
  it("case-insensitive location never relaxes text value equality", () => {
    const draft = supportJobDraft(
      "Job name: Aster. Client: ASTER.",
      {
        ...emptyDraft(),
        name: quoted("Aster"),
        clientName: quoted("Aster", "ASTER"),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual({ name: "Aster" });
    expect(draft.dropped).toContain("clientName");
  });
  it("caps each quote at twenty occurrences", () => {
    const name = "A ".repeat(20).trim();
    const draft = supportJobDraft(
      `${name}. Client: A.`,
      {
        ...emptyDraft(),
        name: quoted(name),
        clientName: quoted("A"),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual({ name });
    expect(draft.dropped).toContain("clientName");
  });
});
describe("client type needs more than relationship words", () => {
  it("preserves the exact instruction used in paid evaluation 45651010861", () => {
    expect(createHash("sha256").update(jobDraftInstructions).digest("hex")).toBe(
      "c3bf0c8b9752f93fe72a76bc88afe1e5f4547a153ecdfd439a9c7d61de2894a2",
    );
  });
  it.each([
    "新客戶",
    "既有客戶",
    "老客戶",
    "客戶",
    "new client",
    "existing client",
    "our client",
    " NEW CLIENT！ ",
    "（新客戶），既有客戶／老客戶：客戶。",
    "new client, existing client; our client.",
    "新客戶 / our client！",
  ])("drops a relationship-only type quote without dropping the name: %s", (quote) => {
    const draft = supportJobDraft(
      `Residential renovation in Taichung City for ${quote} Mr. Wang`,
      {
        ...emptyDraft(),
        name: quoted("Residential renovation"),
        clientName: quoted("Mr. Wang"),
        locationCity: quoted("Taichung City"),
        clientType: quoted("INDIVIDUAL", quote),
      },
      seededFirmLists,
    )!;
    expect(draft.values).toEqual({
      name: "Residential renovation",
      clientName: "Mr. Wang",
      locationCity: "TAICHUNG_CITY",
    });
    expect(draft.dropped.filter((field) => field === "clientType")).toHaveLength(1);
    expect(draft.kept).not.toContain("clientType");
  });
  it.each([
    ["client type: individual", "INDIVIDUAL"],
    ["客戶類型：個人", "INDIVIDUAL"],
    ["individual", "INDIVIDUAL"],
    ["個人", "INDIVIDUAL"],
    ["new client; client type: retail", "RETAIL"],
    ["新客戶，客戶類型：零售", "RETAIL"],
  ])("keeps a type quote with content beyond relationship words: %s", (quote, value) => {
    const draft = supportJobDraft(
      quote,
      { ...emptyDraft(), clientType: quoted(value, quote) },
      seededFirmLists,
    )!;
    expect(draft.values.clientType).toBe(value);
    expect(draft.kept).toContain("clientType");
    expect(draft.dropped).not.toContain("clientType");
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
