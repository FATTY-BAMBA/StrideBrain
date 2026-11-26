import { evaluationMode } from "./evaluation-mode";
import { EvaluationBudget } from "./evaluation-budget";
import { runEvaluationRounds } from "./evaluation-stability";
import { it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import questions from "./questions.json";
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation } from "./evaluation-fixture";
import { runEvaluationQuestion } from "./run-evaluation";
import { evaluationLogRow, type EvaluationQuestion } from "./evaluation";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import { GeminiAssistantModel } from "@/modules/assistant/infrastructure/gemini-model";
import { runJobDraftCase, runJobDraftRounds } from "./job-draft-evaluation";
it("evaluates the explicitly configured paid provider on disposable seed data", async () => {
  if (
    process.env.STRIDEBRAIN_AI_EVAL !== "true" ||
    !process.env.STRIDEBRAIN_GEMINI_API_KEY ||
    process.env.STRIDEBRAIN_AI_PAID_TIER_CONFIRMED !== "true"
  )
    throw new Error("PAID_EVALUATION_CONFIGURATION_REQUIRED");
  const mode = evaluationMode(
    questions as EvaluationQuestion[],
    process.env.STRIDEBRAIN_AI_EVAL_CASES,
  );
  const config = assistantConfig(process.env),
    provider = new GeminiAssistantModel(process.env.STRIDEBRAIN_GEMINI_API_KEY, config.model),
    budget = new EvaluationBudget(process.env.STRIDEBRAIN_AI_EVAL_MAX_USD ?? "0.50", config),
    model = {
      generate: (input: Parameters<typeof provider.generate>[0]) =>
        budget.call(input, () => provider.generate(input)),
      draftJob: (input: Parameters<typeof provider.draftJob>[0]) =>
        budget.call(input, () => provider.draftJob(input)),
    };
  const stability = await runEvaluationRounds(async (round) => {
    const db = await assistantDatabase();
    const rows: Awaited<ReturnType<typeof runEvaluationQuestion>>[] = [];
    try {
      await prepareEvaluation(db);
      for (const question of mode.questions) {
        const row = await runEvaluationQuestion(db, question, config, model);
        rows.push(row);
        console.log(JSON.stringify({ round, ...evaluationLogRow(row) }));
      }
      return rows;
    } finally {
      await db.close();
    }
  }, mode.caseIds);
  let jobDrafts = null;
  if (mode.acceptanceRun) {
    const draftDb = await assistantDatabase();
    try {
      jobDrafts = await runJobDraftRounds(async (test, round) => {
        const row = await runJobDraftCase(draftDb, test, config, model);
        // Artifact carries fields; workflow logs contain only metering and verdict metadata.
        console.log(
          JSON.stringify({
            set: "JOB_DRAFT",
            round,
            id: row.id,
            locale: row.locale,
            passed: row.passed,
            calls: row.calls,
            inputTokens: row.inputTokens,
            outputTokens: row.outputTokens,
            estimatedUsd: row.estimatedUsd,
          }),
        );
        return row;
      });
    } finally {
      await draftDb.close();
    }
  }
  const questionGatePassed =
    stability.passed &&
    (!mode.acceptanceRun ||
      (stability.perQuestion.find((q) => q.id === "zh-TW-finding")?.passes ?? 0) >= 2);
  const passed = questionGatePassed && (jobDrafts?.passed ?? !mode.acceptanceRun);
  const report = {
    mode: mode.acceptanceRun ? "PAID_PROVIDER" : "FOCUSED_PAID_NOT_ACCEPTANCE",
    focusedCaseIds: mode.caseIds ?? null,
    budget: { maximumUsd: budget.maximumUsd, estimatedUsd: budget.estimatedUsd },
    provider: config.provider,
    model: config.model,
    inputUsdPerMillion: config.inputUsdPerMillion,
    outputUsdPerMillion: config.outputUsdPerMillion,
    generatedAt: new Date().toISOString(),
    ...stability,
    questionGatePassed,
    jobDrafts,
    passed,
    recommendation: passed
      ? null
      : "Below the issue's pass mark; evaluate the next model tier. Do not tune prompts to these questions.",
  };
  const file =
    process.env.STRIDEBRAIN_AI_EVAL_REPORT ??
    "foundry/tasks/SB-039/evidence/provider-evaluation.json";
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  if (!passed) throw new Error("AI_EVALUATION_BELOW_PASS_MARK");
}, 1200000);
