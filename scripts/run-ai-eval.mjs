import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
const path =
  process.env.STRIDEBRAIN_AI_EVAL_REPORT ??
  "foundry/tasks/SB-039/evidence/provider-evaluation.json";
if (
  !process.env.STRIDEBRAIN_GEMINI_API_KEY ||
  process.env.STRIDEBRAIN_AI_PAID_TIER_CONFIRMED !== "true"
) {
  const questions = JSON.parse(readFileSync("tests/assistant/questions.json", "utf8")).map((q) => ({
    id: q.id,
    locale: q.locale,
    verdict: "not run",
    reason: "Paid provider key/confirmation not configured",
    latencyMs: null,
    inputTokens: null,
    outputTokens: null,
    estimatedUsd: null,
  }));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    JSON.stringify(
      {
        mode: "NOT_RUN",
        model: process.env.STRIDEBRAIN_AI_MODEL ?? "gemini-3.5-flash-lite",
        inputUsdPerMillion: "0.30",
        outputUsdPerMillion: "2.50",
        generatedAt: new Date().toISOString(),
        questions,
      },
      null,
      2,
    ) + "\n",
  );
  for (const question of questions) console.log(JSON.stringify(question));
  process.exitCode = 2;
} else {
  const result = spawnSync(
    "npx",
    ["--no-install", "vitest", "run", "--config", "vitest.ai-eval.config.ts"],
    { stdio: "inherit", env: { ...process.env, STRIDEBRAIN_AI_EVAL: "true" } },
  );
  process.exitCode = result.status ?? 1;
}
