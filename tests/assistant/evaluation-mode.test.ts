import { describe, expect, it, vi } from "vitest";
import { evaluationMode } from "./evaluation-mode";
import { EvaluationBudget } from "./evaluation-budget";
import { runEvaluationRounds } from "./evaluation-stability";
import questions from "./questions.json";
import type { EvaluationQuestion } from "./evaluation";
describe("focused paid evaluation", () => {
  it("requires exact nonduplicate case ids and never silently runs the full suite", () => {
    const all = questions as EvaluationQuestion[];
    expect(evaluationMode(all, "").acceptanceRun).toBe(true);
    expect(evaluationMode(all, "en-viewer-stage,zh-TW-viewer-stage")).toMatchObject({
      acceptanceRun: false,
      caseIds: ["en-viewer-stage", "zh-TW-viewer-stage"],
    });
    for (const value of ["unknown", "en-viewer-stage,", "en-viewer-stage,en-viewer-stage"])
      expect(() => evaluationMode(all, value)).toThrow("INVALID_FOCUSED_CASE_IDS");
  });
  it("marks even a successful focused run as not acceptance", async () => {
    const report = await runEvaluationRounds(
      async () => [
        {
          id: "focus",
          locale: "en" as const,
          verdict: "grounded and correct",
          wrongNumber: false,
          wrongRecordValue: false,
          wrongAmountLabel: false,
          badDisplayFormat: false,
          calls: 2,
          latencyMs: 1000,
          estimatedUsd: "0.001",
        },
      ],
      ["focus"],
    );
    expect(report).toMatchObject({
      passed: true,
      acceptanceRun: false,
      requiredAnswers: { passed: 3, total: 3 },
    });
  });
  it("reserves before a paid call, meters exactly, and cannot exceed its authorized ceiling by starting another call", async () => {
    const budget = new EvaluationBudget("0.012", {
      inputUsdPerMillion: "0.30",
      outputUsdPerMillion: "2.50",
    });
    const invoke = vi.fn().mockResolvedValue({ usage: { inputTokens: 1000, outputTokens: 1000 } });
    await budget.call({ maxOutputTokens: 2048 }, invoke);
    expect(budget.estimatedUsd).toBe("0.002800000");
    await budget.call({ maxOutputTokens: 2048 }, invoke);
    await expect(budget.call({ maxOutputTokens: 2048 }, invoke)).rejects.toThrow(
      "EVALUATION_BUDGET_REACHED",
    );
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
