import { runEvaluationRounds, roundSummary } from "./evaluation-stability";
import { writeFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import questions from "./questions.json";
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation } from "./evaluation-fixture";
import { runEvaluationQuestion } from "./run-evaluation";
import {
  evaluateAnswer,
  selectedFacts,
  matchesExpected,
  expectedFacts,
  evaluationLogRow,
  type EvaluationQuestion,
} from "./evaluation";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import { AnswerFactRegistry } from "@/modules/assistant/domain/fact-answers";
const source = {
  sourceId: "s",
  label: "Job",
  href: "/en",
  projectKeys: ["J"],
  facts: {
    documentNumber: "PRJ-ACTIVE-001-Q1",
    reference: "PRJ-ACTIVE-001",
    amounts: { totalAmount: "NT$11,665,710" },
  },
};
const q: EvaluationQuestion = {
  id: "test",
  locale: "en",
  person: "owner",
  question: "Quote number?",
  oracleTools: [],
  expected: { kind: "FACTS", facts: ["@documentNumber"], forbidden: [] },
};
const raw = (show: string) => ({ parts: [{ say: "RECORDS_SHOW" }, { show }], followUps: [] });
function scored(show = "s1.documentNumber", mutate?: (s: string) => string) {
  const registry = new AnswerFactRegistry("en");
  registry.register([source]);
  const rendered = registry.render(raw(show));
  if (rendered.kind !== "ACCEPTED") throw Error("render");
  return evaluateAnswer(
    q,
    {
      ...rendered,
      kind: "ANSWER",
      locale: "en",
      answer: {
        ...rendered.answer,
        text: mutate ? mutate(rendered.answer.text) : rendered.answer.text,
      },
      sources: [source],
    },
    expectedFacts(q, [source]),
    raw(show),
    [source],
  );
}
describe("evaluation by selected references", () => {
  it("keeps twenty core questions per language and adds all twenty-eight required fact-selection cases", () => {
    for (const locale of ["en", "zh-TW"]) {
      expect(
        questions.filter(
          (q) =>
            q.locale === locale &&
            !("required" in q && q.required) &&
            !("reported" in q && q.reported),
        ),
      ).toHaveLength(20);
      expect(
        questions.filter(
          (q) => q.locale === locale && "factSelectionRegression" in q && q.factSelectionRegression,
        ),
      ).toHaveLength(14);
    }
    expect(questions).toHaveLength(84);
  });
  it("counts a true page fact for an unresolved named job as a wrong record value", () => {
    const registry = new AnswerFactRegistry("en");
    registry.register([source]);
    const rendered = registry.render(raw("s1.documentNumber"));
    if (rendered.kind !== "ACCEPTED") throw Error("render");
    const result = evaluateAnswer(
      { ...q, expected: { kind: "DECLINE", unresolvedSubject: true, facts: [], forbidden: [] } },
      { ...rendered, kind: "ANSWER", locale: "en", sources: [source] },
      [],
      raw("s1.documentNumber"),
      [source],
    );
    expect(result).toMatchObject({ verdict: "wrong", wrongRecordValue: true });
  });
  it("rejects the recorded wrong identifier even though it is another true fact", () => {
    expect(scored()).toMatchObject({ verdict: "grounded and correct", wrongRecordValue: false });
    expect(scored("s1.reference")).toMatchObject({ verdict: "wrong", wrongRecordValue: false });
    expect(
      scored("s1.documentNumber", (text) => text.replace("PRJ-ACTIVE-001-Q1", "PRJ-ACTIVE-001")),
    ).toMatchObject({ verdict: "wrong", wrongRecordValue: true });
  });
  it.each(["NT$11,665,711", "wrong record heading", "2026-12-23"])(
    "catches any post-render mutation: %s",
    (bad) => {
      expect(scored("s1.documentNumber", (text) => `${text}\n${bad}`)).toMatchObject({
        verdict: "wrong",
        wrongRecordValue: true,
      });
    },
  );
  it("scores only shown output and records every raw answer without logging it", () => {
    const draft = { text: "Private draft 999", sourceIds: [], followUps: [] };
    const judgement = evaluateAnswer(
      { ...q, expected: { kind: "DECLINE", facts: [], forbidden: [] } },
      {
        kind: "ANSWER",
        locale: "en",
        refusal: "UNAVAILABLE",
        answer: { text: "Fixed refusal", sourceIds: [], followUps: [] },
        sources: [],
      },
      [],
      draft,
      [],
    );
    expect(judgement).toMatchObject({
      verdict: "correctly declined",
      wrongRecordValue: false,
      draftRejected: true,
      rawAnswer: draft,
    });
    const pass = scored();
    expect(pass.rawAnswer).toEqual(raw("s1.documentNumber"));
    const log = evaluationLogRow({
      ...judgement,
      id: "case",
      locale: "en",
      discardReason: null,
      latencyMs: 1,
      calls: 1,
      inputTokens: 10,
      outputTokens: 10,
      estimatedUsd: "0.01",
    });
    expect(JSON.stringify(log)).not.toMatch(/Private|999|rawAnswer|sourceLedger|followUps|PRJ/);
  });
  it("scores only list fields the server prints and the children of an indivisible fact", () => {
    const ledger = [
      {
        ...source,
        sourceId: "row",
        countSourceId: "count",
        facts: {
          reference: "J",
          quoteBeforeTax: "999",
          pastJobs: [{ name: "Past", score: "56/100" }],
        },
      },
      { ...source, sourceId: "count", facts: { count: 1, matchingCount: 4 } },
    ];
    const actual = selectedFacts(
      {
        phraseId: "RECORDS_SHOW",
        shown: [{ ref: "s2.list", sourceId: "count", path: "list", kind: "list" }],
      },
      ledger,
    );
    expect(actual.map((f) => f.path)).toEqual([
      "matchingCount",
      "reference",
      "pastJobs.0.name",
      "pastJobs.0.score",
    ]);
    expect(actual.some((f) => f.value === "999")).toBe(false);
    expect(
      selectedFacts(
        {
          phraseId: "RECORDS_SHOW",
          shown: [{ ref: "s1.pastJobs.0", sourceId: "row", path: "pastJobs.0", kind: "fact" }],
        },
        ledger,
      ).map((f) => f.value),
    ).toEqual(["Past", "56/100"]);
  });
  it("accepts the same global item with optional job context but rejects a different item, unit or price", () => {
    const item = {
      ...source,
      sourceId: "item",
      projectKeys: ["PRICE-JOB"],
      facts: {
        description: "Ceiling",
        unit: "坪",
        documentNumber: "PRICE-Q1",
        lastPrice: "NT$3,200",
      },
    };
    const question = {
      ...q,
      expected: { kind: "FACTS" as const, facts: ["@lastPrice"], forbidden: [] },
    };
    const expected = expectedFacts(question, [item])[0]!;
    const withJob = {
      ...item,
      sourceId: "item-with-job",
      projectKeys: ["PRICE-JOB", "CONTEXT-JOB"],
      subjectProjectKeys: ["CONTEXT-JOB"],
    };
    const select = (row: typeof withJob) =>
      selectedFacts(
        {
          phraseId: "RECORDS_SHOW",
          shown: [{ ref: "s1.lastPrice", sourceId: row.sourceId, path: "lastPrice", kind: "fact" }],
        },
        [row],
      ).find((f) => f.path === "lastPrice")!;
    expect(matchesExpected(select(withJob), expected)).toBe(true);
    for (const facts of [
      { ...item.facts, description: "Floor" },
      { ...item.facts, unit: "m²" },
      { ...item.facts, lastPrice: "NT$9,999" },
    ])
      expect(matchesExpected(select({ ...withJob, facts }), expected)).toBe(false);
  });
  it("makes a wrong record value fail the whole round independently of per-language score", () => {
    const rows = (questions as EvaluationQuestion[]).map((q) => ({
      ...q,
      verdict: "grounded and correct",
      wrongRecordValue: false,
      wrongNumber: false,
      wrongAmountLabel: false,
      badDisplayFormat: false,
      calls: 2,
      latencyMs: 1000,
      estimatedUsd: "0.001",
    }));
    expect(roundSummary(1, rows).passed).toBe(true);
    rows[0]!.wrongRecordValue = true;
    expect(roundSummary(1, rows).passed).toBe(false);
    rows[0]!.wrongRecordValue = false;
    rows.forEach((q) => (q.latencyMs = 2501));
    expect(roundSummary(1, rows).passed).toBe(false);
    rows.forEach((q) => {
      q.latencyMs = 1000;
      q.estimatedUsd = "0.001528";
    });
    expect(roundSummary(1, rows).passed).toBe(false);
  });
});
(process.env.DATABASE_URL ? it : it.skip)(
  "replays all 84 evaluation cases through the fake and authorized records in three rounds",
  async () => {
    const report = await runEvaluationRounds(async () => {
      const db = await assistantDatabase();
      try {
        await prepareEvaluation(db);
        const rows = [];
        for (const question of questions as EvaluationQuestion[])
          rows.push(await runEvaluationQuestion(db, question, assistantConfig({}), null));
        return rows;
      } finally {
        await db.close();
      }
    });
    if (process.env.STRIDEBRAIN_AI_FAKE_REPORT)
      writeFileSync(
        process.env.STRIDEBRAIN_AI_FAKE_REPORT,
        JSON.stringify({ mode: "DETERMINISTIC_FAKE_NOT_MODEL_QUALITY", ...report }, null, 2) + "\n",
      );
    expect(
      report.rounds.flatMap((r) =>
        r.questions
          .filter((q) => q.verdict === "wrong")
          .map((q) => ({ id: q.id, discardReason: q.discardReason })),
      ),
    ).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.perQuestion.every((q) => q.passes === 3)).toBe(true);
  },
  120000,
);
