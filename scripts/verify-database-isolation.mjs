/** Twenty independent, fail-fast executions. This is not a test retry mechanism. */
import { execFileSync, spawn } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const root = process.cwd(),
  evidence = resolve("foundry/tasks/SB-071/evidence/stability");
if (!process.env.DATABASE_URL) throw new Error("LOCAL_DATABASE_URL_REQUIRED");
execFileSync(
  "git",
  [
    "diff",
    "--exit-code",
    "HEAD",
    "--",
    "src",
    "tests",
    "scripts",
    "package.json",
    "package-lock.json",
    "vitest.config.ts",
    "vitest.ai-eval.config.ts",
    ".github/workflows/ci.yml",
  ],
  { stdio: "pipe" },
);
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const heroHash = execFileSync(
  "git",
  ["hash-object", "tests/comparison-experience/postgres-hero-flow.test.ts"],
  { encoding: "utf8" },
).trim();
mkdirSync(evidence, { recursive: true });
const results = [];
for (let index = 0; index < 20; index++) {
  const seed = index < 10 ? null : 71001 + index - 10;
  const mode = seed === null ? "default" : `shuffle-${seed}`;
  const name = `run-${String(index + 1).padStart(2, "0")}-${mode}`;
  const temporary = mkdtempSync(join(tmpdir(), "sb071-report-"));
  const log = openSync(join(evidence, `${name}.log`), "w");
  const startedAt = new Date().toISOString(),
    started = performance.now();
  try {
    const args = [
      "run",
      "test",
      "--",
      "--reporter=default",
      "--reporter=json",
      `--outputFile=${temporary}/report.json`,
      ...(seed === null ? [] : ["--sequence.shuffle.files", `--sequence.seed=${seed}`]),
    ];
    const env = { ...process.env };
    delete env.STRIDEBRAIN_GEMINI_API_KEY;
    delete env.STRIDEBRAIN_AI_PAID_TIER_CONFIRMED;
    const child = spawn("npm", args, { cwd: root, env, stdio: ["ignore", log, log] });
    const code = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", resolve);
    });
    const report = JSON.parse(readFileSync(`${temporary}/report.json`, "utf8"));
    const hero = report.testResults.find((row) =>
      row.name.endsWith("/tests/comparison-experience/postgres-hero-flow.test.ts"),
    );
    const row = {
      run: index + 1,
      mode,
      seed,
      commit,
      heroHash,
      startedAt,
      wallSeconds: Number(((performance.now() - started) / 1000).toFixed(3)),
      exitCode: code,
      tests: report.numTotalTests,
      passed: report.numPassedTests,
      failed: report.numFailedTests,
      skipped: report.numPendingTests,
      heroPassed:
        hero?.status === "passed" &&
        hero.assertionResults.every((test) => test.status === "passed"),
      log: `${name}.log`,
    };
    results.push(row);
    writeFileSync(
      join(evidence, "summary.json"),
      JSON.stringify({ commit, heroHash, runs: results }, null, 2) + "\n",
    );
    console.info(JSON.stringify(row));
    if (code !== 0 || row.failed !== 0 || row.skipped !== 0 || row.tests < 1589 || !row.heroPassed)
      throw new Error(`STABILITY_FAILED_RUN_${index + 1}`);
  } finally {
    closeSync(log);
    rmSync(temporary, { recursive: true, force: true });
  }
}
console.info(
  "All 20 consecutive test runs passed; 10 distinct shuffled file-order seeds; no retries or skipped tests.",
);
