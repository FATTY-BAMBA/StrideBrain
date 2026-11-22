import { runEvaluationRounds } from "./evaluation-stability";
import { writeFileSync } from "node:fs";
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
      questions.every(
        (q) =>
          q.expected.kind === "DECLINE" ||
          q.expected.match === "ANY_SAVED_FINDING" ||
          q.expected.facts.length > 0,
      ),
    ).toBe(true);
  });
  it("reports a discarded wrong number separately from displayed output", () => {
    const q = questions[0] as EvaluationQuestion;
    expect(
      evaluateAnswer(q, { kind: "FALLBACK", reason: "UNGROUNDED" }, [], { text: "$999" }, []),
    ).toMatchObject({
      verdict: "wrong",
      wrongNumber: false,
      draftWrongNumber: true,
      draftUnsupportedTokens: ["999"],
      rawAnswerText: "$999",
    });
  });
});
(process.env.DATABASE_URL ? it : it.skip)(
  "runs all evaluation cases with the fake over authorized seeded records (not a model-quality score)",
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
    expect(report.passed).toBe(true);
    expect(report.rounds).toHaveLength(3);
    expect(report.perQuestion.every((q) => q.passes === 3)).toBe(true);
  },
  120000,
);
