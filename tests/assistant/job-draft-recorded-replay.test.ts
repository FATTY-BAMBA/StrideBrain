import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import type { JobDraftModelPort } from "@/modules/assistant/domain/contracts";
import { assistantDatabase } from "./database-fixture";
import { jobDraftCases } from "./job-draft-cases";
import {
  runJobDraftCase,
  summarizeJobDraftRound,
  type JobDraftEvaluationRow,
} from "./job-draft-evaluation";

const recorded = JSON.parse(
  readFileSync(
    new URL("../../foundry/tasks/SB-073/evidence/evaluation-3.json", import.meta.url),
    "utf8",
  ),
) as {
  jobDrafts: {
    rounds: {
      round: number;
      cases: JobDraftEvaluationRow[];
      reportedCases: JobDraftEvaluationRow[];
    }[];
  };
};
const suite = process.env.DATABASE_URL ? describe : describe.skip;
let db: Awaited<ReturnType<typeof assistantDatabase>>;
beforeAll(async () => {
  if (process.env.DATABASE_URL) db = await assistantDatabase();
}, 30000);
afterAll(async () => {
  await db?.close();
});

suite("free replay of saved SB-073 model output", () => {
  it("replays all available raw drafts and distinguishes prior passes that lack raw output", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("NO_PAID_CALLS"));
    const config = { ...assistantConfig({}), enabled: true };
    const rounds = [];
    for (const original of recorded.jobDrafts.rounds) {
      const replayed: JobDraftEvaluationRow[] = [];
      const carried: JobDraftEvaluationRow[] = [];
      for (const row of original.cases) {
        if (row.rawDraft === undefined) {
          // Passing rows were recorded after support checks, without their original quotes.
          // Do not reconstruct a model draft from those values and call it an exact replay.
          expect(row.passed).toBe(true);
          carried.push(row);
          continue;
        }
        const test = jobDraftCases.find((test) => test.id === row.id)!;
        const model: JobDraftModelPort = {
          async draftJob() {
            return {
              draft: structuredClone(row.rawDraft),
              usage: { inputTokens: 0, outputTokens: 0 },
            };
          },
        };
        const result = await runJobDraftCase(db, test, config, model);
        expect(result.passed, `${original.round}: ${row.id}`).toBe(true);
        expect(result.unsupportedKept).toEqual([]);
        expect(result.dropped).toContain("clientType");
        replayed.push(result);
      }
      expect(replayed.map((row) => row.id)).toEqual(["en-new-client-acceptance"]);
      expect(carried).toHaveLength(31);
      const combined = summarizeJobDraftRound(original.round, [...replayed, ...carried]);
      expect(combined.scores).toEqual({ en: 16, "zh-TW": 16 });
      expect(combined.passed).toBe(true);
      rounds.push({
        round: original.round,
        replayed,
        missingRawDraftIds: carried.map((row) => row.id),
        priorRecordedPasses: carried.length,
        priorReportedCases: original.reportedCases,
        combinedScoresWithPriorPasses: combined.scores,
        combinedGateWithPriorPasses: combined.passed,
      });
    }
    expect(rounds).toHaveLength(3);
    expect(fetch).not.toHaveBeenCalled();
    const path = process.env.STRIDEBRAIN_AI_DRAFT_REPLAY_REPORT;
    if (path) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(
        path,
        JSON.stringify(
          {
            mode: "PARTIAL_RECORDED_REPLAY",
            sourceRunId: 45651010861,
            fullReplay: false,
            providerCalls: 0,
            estimatedUsd: "0.000000000",
            explanation:
              "Only the three failed scored cases have rawDraft. The other 93 scored passes and three reported placeholder passes lack raw output and are carried forward, not replayed.",
            rounds,
          },
          null,
          2,
        ) + "\n",
      );
    }
  }, 30000);
});
