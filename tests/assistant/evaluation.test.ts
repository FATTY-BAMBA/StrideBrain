import { runEvaluationRounds } from "./evaluation-stability";
import { writeFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import questions from "./questions.json";
import { FakeAssistantModel } from "./fake-model";
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation } from "./evaluation-fixture";
import { runEvaluationQuestion } from "./run-evaluation";
import { evaluateAnswer, type EvaluationQuestion } from "./evaluation";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
describe("evaluation contract", () => {
  it("contains twenty core English and twenty core zh-TW cases plus eight hosted regressions with explicit facts or refusals", () => {
    expect(
      questions.filter((q) => q.locale === "en" && !("required" in q && q.required)),
    ).toHaveLength(20);
    expect(
      questions.filter((q) => q.locale === "zh-TW" && !("required" in q && q.required)),
    ).toHaveLength(20);
    expect(questions.filter((q) => "required" in q && q.required)).toHaveLength(8);
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

(process.env.DATABASE_URL ? it : it.skip)(
  "scores the paid empty-list answer with its authorized page-reference follow-up",
  async () => {
    const db = await assistantDatabase();
    try {
      const question = questions.find(
        (q) => q.id === "en-home-empty-awaiting",
      ) as EvaluationQuestion;
      const model = new FakeAssistantModel([
        {
          usage: { inputTokens: 0, outputTokens: 0 },
          result: { kind: "TOOLS", calls: [{ name: "list_awaiting_client", arguments: {} }] },
        },
        (request) => {
          const data = JSON.parse(request.messages.at(-1)!.text);
          expect(JSON.parse(request.messages[0]!.text).selectedProjectReference).toBe(
            "J-2611-R7K3",
          );
          expect(data.sources).toHaveLength(1);
          expect(data.sources[0].facts.count).toBe(0);
          return {
            usage: { inputTokens: 0, outputTokens: 0 },
            result: {
              kind: "ANSWER",
              answer: {
                text: "There are currently 0 quotes waiting for the client.",
                sourceIds: [data.sources[0].sourceId],
                followUps: [
                  "What is the status of quotes for project J-2611-R7K3?",
                  "Are there any quotes in the inquiry stage?",
                  "Can you list the closed jobs?",
                ],
              },
            },
          };
        },
      ]);
      const row = await runEvaluationQuestion(db, question, assistantConfig({}), model);
      expect(row).toMatchObject({
        verdict: "grounded and correct",
        wrongNumber: false,
        draftWrongNumber: false,
      });
      expect(row.followUps).toContain("What is the status of quotes for project J-2611-R7K3?");
    } finally {
      await db.close();
    }
  },
  30000,
);
