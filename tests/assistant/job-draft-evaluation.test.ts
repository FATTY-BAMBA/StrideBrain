import { afterAll, beforeAll, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { jobDraftCases, reportedJobDraftCases } from "./job-draft-cases";
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
it("has 16 scored texts per language, all required scenarios, and bounded long privacy messages", () => {
  for (const locale of ["en", "zh-TW"]) {
    expect(jobDraftCases.filter((c) => c.locale === locale)).toHaveLength(16);
    for (const suffix of [
      "ping",
      "existing",
      "no-area",
      "district-only",
      "long-private",
      "not-job",
      "injection",
      "individual-client",
      "chinese-city",
      "residential-unlisted",
      "new-client-acceptance",
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
  for (const suffix of [
    "individual-client",
    "chinese-city",
    "residential-unlisted",
    "new-client-acceptance",
  ]) {
    expect(
      summarizeJobDraftRound(
        1,
        rows.filter((r) => !r.id.endsWith(suffix)),
      ).passed,
    ).toBe(false);
    expect(
      summarizeJobDraftRound(
        1,
        rows.map((r) => (r.id.endsWith(suffix) ? { ...r, passed: false } : r)),
      ).passed,
    ).toBe(false);
  }
  expect(summarizeJobDraftRound(1, [rows[1]!, ...rows.slice(1)]).passed).toBe(false);
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
it("reports the placeholder independently without allowing it to offset a scored failure", async () => {
  expect(reportedJobDraftCases).toHaveLength(1);
  expect(reportedJobDraftCases[0]).toMatchObject({
    required: false,
    text: "幫測試客戶甲在台北市大安區做一間 30 坪的住宅裝修",
  });
  const report = await runJobDraftRounds(
    async (test) =>
      ({
        id: test.id,
        locale: test.locale,
        required: test.required,
        calls: 1,
        passed: !reportedJobDraftCases.includes(test),
        unsupportedKept: reportedJobDraftCases.includes(test) ? ["clientName"] : [],
      }) as unknown as JobDraftEvaluationRow,
  );
  expect(report.passed).toBe(true);
  expect(report.rounds.map((r) => r.scores)).toEqual(Array(3).fill({ en: 16, "zh-TW": 16 }));
  for (const round of report.rounds) {
    expect(round.reportedCases).toEqual([
      expect.objectContaining({ passed: false, unsupportedKept: ["clientName"] }),
    ]);
    const rows = round.cases.map((r) =>
      r.id === "zh-TW-new-client-acceptance" ? { ...r, passed: false } : r,
    );
    expect(summarizeJobDraftRound(round.round, rows).passed).toBe(false);
  }
  expect(report.reportedPerCase).toEqual([
    { id: "zh-TW-residential-placeholder", locale: "zh-TW", passes: 0, rounds: 3 },
  ]);
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
    expect(report.rounds.map((r) => r.scores)).toEqual(Array(3).fill({ en: 16, "zh-TW": 16 }));
    expect(report.rounds.every((r) => r.reportedCases.length === 1)).toBe(true);
    expect(report.passed).toBe(true);
  }, 30000);
});
