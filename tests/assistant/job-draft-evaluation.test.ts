import { afterAll, beforeAll, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { jobDraftCases } from "./job-draft-cases";
import {
  runJobDraftCase,
  runJobDraftRounds,
  summarizeJobDraftRound,
  type JobDraftEvaluationRow,
} from "./job-draft-evaluation";
import { assistantDatabase } from "./database-fixture";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import type { JobDraftModelPort } from "@/modules/assistant/domain/contracts";
import { modelDraftForCase } from "./job-draft-model-fixture";
it("has 12 texts per language, all required scenarios, and bounded long privacy messages", () => {
  for (const locale of ["en", "zh-TW"]) {
    expect(jobDraftCases.filter((c) => c.locale === locale)).toHaveLength(12);
    for (const suffix of [
      "ping",
      "existing",
      "no-area",
      "district-only",
      "long-private",
      "not-job",
      "injection",
    ])
      expect(jobDraftCases.find((c) => c.id === `${locale}-${suffix}`)?.required).toBe(true);
    const long = jobDraftCases.find((c) => c.id === `${locale}-long-private`)!.text;
    expect(long.length).toBeGreaterThanOrEqual(600);
    expect(long.length).toBeLessThanOrEqual(1000);
    expect(long).toContain("A123456789");
    expect(long).toContain("0912-345-678");
  }
});
it("does not relax required, support, one-call or per-language score gates", () => {
  const rows = jobDraftCases.map(
    (c) =>
      ({
        id: c.id,
        locale: c.locale,
        required: c.required,
        passed: true,
        calls: 1,
        unsupportedKept: [],
      }) as unknown as JobDraftEvaluationRow,
  );
  expect(summarizeJobDraftRound(1, rows).passed).toBe(true);
  for (const patch of [{ passed: false }, { unsupportedKept: ["locationCity"] }, { calls: 2 }])
    expect(summarizeJobDraftRound(1, [{ ...rows[0]!, ...patch }, ...rows.slice(1)]).passed).toBe(
      false,
    );
  const optional = rows.filter((r) => !r.required && r.locale === "en").map((r) => r.id);
  expect(
    summarizeJobDraftRound(
      1,
      rows.map((r) => (optional.slice(0, 2).includes(r.id) ? { ...r, passed: false } : r)),
    ).passed,
  ).toBe(true);
  expect(
    summarizeJobDraftRound(
      1,
      rows.map((r) => (optional.slice(0, 3).includes(r.id) ? { ...r, passed: false } : r)),
    ).passed,
  ).toBe(false);
});
const suite = process.env.DATABASE_URL ? describe : describe.skip;
let db: Awaited<ReturnType<typeof assistantDatabase>>;
beforeAll(async () => {
  if (process.env.DATABASE_URL) db = await assistantDatabase();
}, 30000);
afterAll(async () => {
  await db?.close();
});
suite("deterministic job-draft evaluation harness", () => {
  it("runs every case in three rounds through the real support, conversion, client and usage path", async () => {
    const config = { ...assistantConfig({}), enabled: true };
    const report = await runJobDraftRounds(async (test) => {
      const fake: JobDraftModelPort = {
        async draftJob() {
          return { draft: modelDraftForCase(test), usage: { inputTokens: 0, outputTokens: 0 } };
        },
      };
      return runJobDraftCase(db, test, config, fake);
    });
    const path = process.env.STRIDEBRAIN_AI_DRAFT_FAKE_REPORT;
    if (path) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify({ mode: "FAKE_MODEL", ...report }, null, 2) + "\n");
    }
    expect(report.rounds.map((r) => r.scores)).toEqual(Array(3).fill({ en: 12, "zh-TW": 12 }));
    expect(report.passed).toBe(true);
  }, 30000);
});
