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
it("evaluates the explicitly configured paid provider on disposable seed data", async () => {
  if (
    process.env.STRIDEBRAIN_AI_EVAL !== "true" ||
    !process.env.STRIDEBRAIN_GEMINI_API_KEY ||
    process.env.STRIDEBRAIN_AI_PAID_TIER_CONFIRMED !== "true"
  )
    throw new Error("PAID_EVALUATION_CONFIGURATION_REQUIRED");
  const config = assistantConfig(process.env),
    model = new GeminiAssistantModel(process.env.STRIDEBRAIN_GEMINI_API_KEY, config.model);
  const stability = await runEvaluationRounds(async (round) => {
    const db = await assistantDatabase();
    const rows: Awaited<ReturnType<typeof runEvaluationQuestion>>[] = [];
    try {
      await prepareEvaluation(db);
      for (const question of questions as EvaluationQuestion[]) {
        const row = await runEvaluationQuestion(db, question, config, model);
        rows.push(row);
        console.log(JSON.stringify({ round, ...evaluationLogRow(row) }));
      }
      return rows;
    } finally {
      await db.close();
    }
  });
  const { passed } = stability;
  const report = {
    mode: "PAID_PROVIDER",
    provider: config.provider,
    model: config.model,
    inputUsdPerMillion: config.inputUsdPerMillion,
    outputUsdPerMillion: config.outputUsdPerMillion,
    generatedAt: new Date().toISOString(),
    ...stability,
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
