import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { workerRun } from "./worker";
const databaseTest = process.env.DATABASE_URL ? it : it.skip;
databaseTest(
  "proves parallel worker isolation and reset between files, with failing negative controls",
  async () => {
    const proof = [];
    for (const mode of ["parallel", "shared", "reset", "sticky"]) {
      const directory = mkdtempSync(join(tmpdir(), "sb071-probe-"));
      try {
        const env: NodeJS.ProcessEnv = {
          ...process.env,
          DATABASE_URL: workerRun()!.adminUrl,
          SB_TEST_PROBE_MODE: mode,
          SB_TEST_PROBE_DIR: directory,
        };
        delete env.STRIDEBRAIN_TEST_DATABASE_RUN;
        delete env.VITEST_MAX_WORKERS;
        let output = "";
        const child = spawn(
          process.execPath,
          [
            "node_modules/vitest/vitest.mjs",
            "run",
            "--config",
            "tests/database/probes/config.ts",
            "--reporter=json",
            `--outputFile=${directory}/report.json`,
          ],
          { env, stdio: ["ignore", "pipe", "pipe"] },
        );
        child.stdout.on("data", (chunk) => {
          output += String(chunk);
        });
        child.stderr.on("data", (chunk) => {
          output += String(chunk);
        });
        const code = await new Promise<number | null>((resolve, reject) => {
          child.once("error", reject);
          child.once("exit", resolve);
        });
        const report = JSON.parse(readFileSync(`${directory}/report.json`, "utf8"));
        const positive = mode === "parallel" || mode === "reset";
        expect(code, output).toBe(positive ? 0 : 1);
        expect(report.numTotalTests).toBe(2);
        expect(report.numPendingTests).toBe(0);
        expect(report.numPassedTests).toBe(positive ? 2 : 1);
        expect(report.numFailedTests).toBe(positive ? 0 : 1);
        if (!positive)
          expect(JSON.stringify(report)).toContain(
            mode === "shared" ? "ISOLATION_SAME_ROW" : "ISOLATION_SEEDED_STATE",
          );
        const observations = readFileSync(`${directory}/observations.jsonl`, "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line));
        if (positive) {
          expect(observations.map((row) => row.observed).sort()).toEqual([
            "isolation-a",
            "isolation-b",
          ]);
          expect(new Set(observations.map((row) => row.database)).size).toBe(
            mode === "parallel" ? 2 : 1,
          );
          expect(new Set(observations.map((row) => row.worker)).size).toBe(
            mode === "parallel" ? 2 : 1,
          );
        }
        proof.push({
          mode,
          exitCode: code,
          passed: report.numPassedTests,
          failed: report.numFailedTests,
          observations,
        });
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    }
    console.info("DATABASE_ISOLATION_PROOF", JSON.stringify(proof));
  },
  90000,
);
