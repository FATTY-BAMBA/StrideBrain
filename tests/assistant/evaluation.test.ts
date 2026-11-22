import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import questions from "./questions.json";
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation } from "./evaluation-fixture";
import { runEvaluationQuestion } from "./run-evaluation";
import { evaluateAnswer, type EvaluationQuestion } from "./evaluation";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
describe("evaluation contract", () => {
  it("contains twenty English and twenty zh-TW cases with explicit facts or refusals", () => {
    expect(questions.filter((q) => q.locale === "en")).toHaveLength(20);
    expect(questions.filter((q) => q.locale === "zh-TW")).toHaveLength(20);
    expect(
      questions.every((q) => q.expected.kind === "DECLINE" || q.expected.facts.length > 0),
    ).toBe(true);
  });
  it("fails a wrong number even when the application fell back", () => {
    const q = questions[0] as EvaluationQuestion;
    expect(
      evaluateAnswer(q, { kind: "FALLBACK", reason: "UNGROUNDED" }, [], { text: "$999" }, []),
    ).toEqual({ verdict: "wrong", wrongNumber: true });
  });
});
(process.env.DATABASE_URL ? it : it.skip)(
  "runs all evaluation cases with the fake over authorized seeded records (not a model-quality score)",
  async () => {
    const db = await assistantDatabase();
    try {
      await prepareEvaluation(db);
      const failures = [];
      for (const question of questions as EvaluationQuestion[]) {
        const report = await runEvaluationQuestion(
          db,
          question,
          { ...assistantConfig({}), dailyCalls: 1000 },
          null,
        );
        if (report.verdict === "wrong" || report.wrongNumber) failures.push(report);
      }
      expect(failures).toEqual([]);
    } finally {
      await db.close();
    }
  },
  120000,
);
