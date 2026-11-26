import { describe, it, expect, vi } from "vitest";
import {
  AnswerFactRegistry,
  answerPhrases,
  parseFactAnswer,
} from "@/modules/assistant/domain/fact-answers";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
import { FakeAssistantModel } from "./fake-model";
import { jobContext } from "../projects/job-fixture";
const source = (sourceId: string, facts: AssistantSource["facts"] = {}): AssistantSource => ({
  sourceId,
  label: `Job ${sourceId}`,
  href: `/en/projects/${sourceId}`,
  projectKeys: [sourceId],
  facts,
});
const select = (...refs: string[]) => ({
  parts: [{ say: "RECORDS_SHOW" }, ...refs.map((show) => ({ show }))],
  followUps: [],
});
describe("server-rendered fact selections", () => {
  it.each(["en", "zh-TW"] as const)(
    "prints owned records, page labels and exact values in %s",
    (locale) => {
      const registry = new AnswerFactRegistry(locale);
      registry.register([
        source("A", { reference: "PRJ-ACTIVE-001", amounts: { totalAmount: "NT$16,480,000" } }),
        source("B", {
          documentNumber: "PRJ-ACTIVE-001-Q1",
          status: locale === "en" ? "Issued" : "已核發",
        }),
      ]);
      const result = registry.render(
        select("s1.reference", "s2.status", "s1.amounts.totalAmount", "s2.documentNumber"),
      );
      expect(result.kind).toBe("ACCEPTED");
      if (result.kind !== "ACCEPTED") throw Error("not rendered");
      const [lead, a, b] = result.answer.text.split("\n\n");
      expect(lead).toBe(answerPhrases.RECORDS_SHOW[locale]);
      expect(a).toContain("Job A\n");
      expect(a).toContain("NT$16,480,000");
      expect(a).not.toContain("PRJ-ACTIVE-001-Q1");
      expect(b).toContain("Job B\n");
      expect(b).toContain("PRJ-ACTIVE-001-Q1");
      expect(b).not.toContain("NT$");
      expect(result.answer.sourceIds).toEqual(["A", "B"]);
      expect(result.selection.shown.map((f) => f.path)).toEqual([
        "reference",
        "status",
        "amounts.totalAmount",
        "documentNumber",
      ]);
    },
  );
  it.each([
    "This job is in construction.",
    "此專案正在施工。",
    "NT$999",
    "__proto__",
    "constructor",
  ])("does not accept model prose or prototype keys: %s", (text) => {
    const registry = new AnswerFactRegistry("en");
    registry.register([source("A", { count: 1 })]);
    expect(registry.render({ text, sourceIds: ["A"], followUps: [] }).kind).toBe("REJECTED");
    expect(
      registry.render({ parts: [{ say: text }, { show: "s1.count" }], followUps: [] }).kind,
    ).toBe("REJECTED");
    expect(registry.render(select(text))).toEqual({
      kind: "REJECTED",
      reason: "UNKNOWN_REFERENCE",
    });
    expect(registry.render({ ...select("s1.count"), text }).kind).toBe("REJECTED");
  });
  it("cannot put another past job's score beside a selected name, or confuse latest issued with current status", () => {
    const registry = new AnswerFactRegistry("en");
    registry.register([
      source("A", {
        pastJobs: [
          { name: "Past A", score: "56/100" },
          { name: "Past B", score: "71/100" },
        ],
        status: "Draft",
        issued: { status: "Issued" },
      }),
    ]);
    expect(registry.render(select("s1.pastJobs.0.name", "s1.pastJobs.1.score"))).toMatchObject({
      reason: "UNKNOWN_REFERENCE",
    });
    expect(registry.render(select("s1.pastJobs.0", "s1.issued.status"))).toMatchObject({
      kind: "ACCEPTED",
      answer: {
        text: "Here is what the records show:\n\nJob A\nSelected past jobs: Past A · 56/100\nLatest issued quote · Quote status: Issued",
      },
    });
  });
  it("reserves the fourteenth provider part only when this turn can show a list", () => {
    const registry = new AnswerFactRegistry("en");
    const findings = source("F", {
      findings: Array.from({ length: 13 }, (_, i) => ({ text: `Saved sentence ${i}` })),
    });
    registry.register([findings]);
    expect(registry.maxAnswerParts()).toBe(13);
    const refs = Array.from({ length: 12 }, (_, i) => `s1.findings.${i}.text`);
    expect(registry.render(select(...refs)).kind).toBe("ACCEPTED");
    expect(registry.render(select(...refs, "s1.findings.12.text"))).toMatchObject({
      reason: "FACT_LIMIT",
    });
    registry.register([source("C", { count: 0 })]);
    expect(registry.maxAnswerParts()).toBe(14);
    expect(registry.render(select(...refs, "s2.list")).kind).toBe("ACCEPTED");
  });
  it("sends only selectable references, never bare record aliases that look selectable", () => {
    const registry = new AnswerFactRegistry("en");
    const rows = [
      { ...source("A", { status: "Issued" }), countSourceId: "C" },
      source("C", { count: 1 }),
    ];
    registry.register(rows);
    const sent = registry.modelSources(rows);
    expect(sent.every((s) => !("record" in s))).toBe(true);
    expect(sent[1]!.list).toEqual({ ref: "s2.list" });
    expect(registry.render(select("s1"))).toMatchObject({ reason: "UNKNOWN_REFERENCE" });
    expect(registry.render({ parts: [{ say: "RECORDS_SHOW" }], followUps: [] })).toMatchObject({
      reason: "INVALID_OUTPUT",
    });
  });
  it("is turn-local, stable across repeated tool calls, and accepts no model value or path traversal", () => {
    const registry = new AnswerFactRegistry("en"),
      rows = [source("A", { count: 1 })];
    registry.register(rows);
    const before = registry.modelSources(rows);
    registry.register(rows);
    expect(registry.modelSources(rows)).toEqual(before);
    expect(new AnswerFactRegistry("en").render(select("s1.count"))).toMatchObject({
      reason: "UNKNOWN_REFERENCE",
    });
    for (const ref of ["s1.__proto__.count", "s1.count=99", "s2.count", 's1["count"]'])
      expect(registry.render(select(ref))).toMatchObject({ reason: "UNKNOWN_REFERENCE" });
    expect(
      parseFactAnswer({
        parts: [{ say: "RECORDS_SHOW" }, { show: "s1.count", value: 99 }],
        followUps: [],
      }),
    ).toBeNull();
  });
  it("prints saved finding sentences unchanged on separate lines; long facts are not a word-limit failure", () => {
    const texts = [
      "Overall: quoted price is 43.0% above past quoted prices.",
      "照明與電氣：報價比過往報價高 9.4%",
      "saved ".repeat(300),
    ];
    const registry = new AnswerFactRegistry("en");
    registry.register([
      source("A", {
        findings: texts.map((text) => ({
          text,
          claimKind: "PRICE",
          evidenceReferenceIds: ["private"],
        })),
      }),
    ]);
    const result = registry.render(select(...texts.map((_, i) => `s1.findings.${i}.text`)));
    expect(result.kind).toBe("ACCEPTED");
    if (result.kind === "ACCEPTED")
      for (const text of texts)
        expect(result.answer.text.split("\n")).toContain(`Findings: ${text}`);
    expect(JSON.stringify(registry.modelSources([source("A")]))).not.toMatch(
      /claimKind|private|evidenceReferenceIds/,
    );
  });
  it("limits scalar facts independently of a bounded list and computes remaining count", () => {
    const count = source("count", { count: 15 });
    const rows = Array.from({ length: 15 }, (_, i) => ({
      ...source(`A${i}`, { reference: `J-${i}`, status: "Issued" }),
      countSourceId: "count",
    }));
    const registry = new AnswerFactRegistry("en");
    registry.register([...rows, count]);
    const out = registry.render(select("s16.list"));
    expect(out.kind).toBe("ACCEPTED");
    if (out.kind !== "ACCEPTED") throw Error("list rejected");
    expect(out.answer.text).toContain("Record count: 15");
    expect(out.answer.text).toContain("5 more records.");
    expect(out.answer.text).toContain("Job A9 — Job reference: J-9; Quote status: Issued");
    expect(out.answer.text).not.toContain("Job A10");
    expect(
      registry.render(select(...rows.slice(0, 13).map((_, i) => `s${i + 1}.status`))),
    ).toMatchObject({ reason: "FACT_LIMIT" });
    const second = source("count2", { count: 0 });
    registry.register([second]);
    expect(registry.render(select("s16.list", "s17.list"))).toMatchObject({ reason: "LIST_LIMIT" });
  });
  it("filters write offers independently; malformed follow-ups do not bypass the schema", () => {
    const registry = new AnswerFactRegistry("en");
    registry.register([source("A", { count: 1 })]);
    expect(
      registry.render({
        ...select("s1.count"),
        followUps: ["Can I create a quote?", "What stage is this job in?"],
      }),
    ).toMatchObject({ kind: "ACCEPTED", answer: { followUps: ["What stage is this job in?"] } });
    expect(registry.render({ ...select("s1.count"), followUps: "bad" })).toMatchObject({
      kind: "REJECTED",
    });
  });
  it("proves the fake-model path uses registered facts and retains final access checks", async () => {
    const usage = { inputTokens: 10, outputTokens: 10 };
    const model = new FakeAssistantModel([
      {
        usage,
        result: {
          kind: "TOOLS",
          calls: [{ name: "get_quote_status", arguments: { projectKey: "J" } }],
        },
      },
      (request) => {
        const data = JSON.parse(request.messages.at(-1)!.text);
        const ref = data.sources[0].facts.find((f: { ref: string }) =>
          f.ref.endsWith(".totalAmount"),
        ).ref;
        expect(data.sources[0]).not.toHaveProperty("sourceId");
        return { usage, result: { kind: "ANSWER", answer: select(ref) } };
      },
    ]);
    const repo = {
      readableReferences: vi.fn().mockResolvedValue(["J"]),
      enabled: vi.fn().mockResolvedValue(true),
      jobPolicy: vi.fn().mockResolvedValue({ id: "J", excluded: false }),
      settings: vi.fn(),
      setControl: vi.fn(),
      reserveCall: vi.fn().mockResolvedValue("call"),
      meterCall: vi.fn(),
      finishTurn: vi.fn(),
    };
    const tools = {
      resolveSubjects: vi.fn().mockResolvedValue({ kind: "AVAILABLE", named: [], projects: [] }),
      canSend: vi.fn().mockResolvedValue(true),
      execute: vi.fn().mockResolvedValue({
        status: "OK",
        sources: [
          {
            ...source("J", { amounts: { totalAmount: "NT$12,500,000" } }),
            typedFactPaths: ["amounts"],
          },
        ],
      }),
    };
    const service = new AskAssistant(
      model,
      {
        enabled: true,
        provider: "gemini",
        model: "fake",
        timeoutMs: 1000,
        maxToolCalls: 6,
        maxOutputTokens: 1024,
        dailyCalls: 100,
        inputUsdPerMillion: "0.30",
        outputUsdPerMillion: "2.50",
      },
      repo,
      tools,
    );
    const result = await service.execute(jobContext(), { question: "What is the quote total?" });
    expect(result).toMatchObject({
      kind: "ANSWER",
      answer: {
        text: "Here is what the records show:\n\nJob J\nTotal including tax: NT$12,500,000",
      },
      selection: { phraseId: "RECORDS_SHOW" },
    });
    expect(tools.canSend).toHaveBeenCalledTimes(3);
  });
});
