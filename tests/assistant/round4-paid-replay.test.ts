import { it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readFileSync, writeFileSync } from "node:fs";
import { AnswerFactRegistry, type AnswerSelection } from "@/modules/assistant/domain/fact-answers";
import { matchesSubject, namedProjects } from "@/modules/assistant/domain/subjects";
import { redactText, typedAnswerValues } from "@/modules/assistant/domain/redaction";
import type { AssistantSource, AssistantOutcome } from "@/modules/assistant/domain/contracts";
import { evaluateAnswer, expectedFacts, type EvaluationQuestion } from "./evaluation";
import { roundSummary, stabilitySummary, type ScoredRow } from "./evaluation-stability";
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation, evaluationMemberships } from "./evaluation-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import questions from "./questions.json";
type Row = ScoredRow & {
  rawAnswer: unknown;
  selection: AnswerSelection | null;
  sourceLedger: AssistantSource[];
  answerText: string | null;
};
(process.env.DATABASE_URL ? it : it.skip)(
  "replays run 45804259788 unchanged through current server checks: 252/252 with no discard or wrong value",
  async () => {
    const report = JSON.parse(
      readFileSync("foundry/tasks/SB-079/evidence/round3-full-run-1.json", "utf8"),
    ) as { rounds: { round: number; questions: Row[] }[] };
    const db = await assistantDatabase();
    try {
      await prepareEvaluation(db);
      const { repository, tools } = createAssistantServices();
      const rounds = [];
      for (const round of report.rounds) {
        const rows = [];
        for (const row of round.questions) {
          const q = (questions as EvaluationQuestion[]).find((q) => q.id === row.id)!;
          const context = {
            ...(await db.actor(evaluationMemberships[q.person])),
            locale: q.locale,
          };
          const registry = new AnswerFactRegistry(row.locale);
          registry.register(row.sourceLedger);
          // Raw selections, refs, order, follow-ups and source values are unchanged.
          // A zero-model server answer is replayed from its recorded selection.
          const raw =
            row.rawAnswer ??
            (row.selection
              ? {
                  parts: [
                    { say: row.selection.phraseId },
                    ...row.selection.shown.map((s) => ({ show: s.ref })),
                  ],
                  followUps: [],
                }
              : null);
          const rendered = raw ? registry.render(raw) : null;
          let outcome: AssistantOutcome = {
            kind: "ANSWER",
            locale: row.locale,
            refusal: "UNAVAILABLE",
            answer: {
              text: row.answerText ?? "Recorded/server refusal",
              sourceIds: [],
              followUps: [],
            },
            sources: [],
          };
          let guarded = false;
          if (rendered?.kind === "REJECTED")
            outcome = { kind: "FALLBACK", reason: "UNGROUNDED", discardReason: rendered.reason };
          else if (rendered?.kind === "ACCEPTED") {
            // Same final boundary order as AskAssistant. No provider is instantiated or called.
            guarded = await repository.questionMentionsUnreadableJob(context, q.question);
            if (!guarded) {
              const resolved = await tools.resolveSubjects(context, q.question);
              expect(resolved.kind).toBe("AVAILABLE");
              if (resolved.kind !== "AVAILABLE") throw Error("subjects");
              expect(
                matchesSubject(
                  rendered.answer,
                  row.sourceLedger,
                  namedProjects(q.question, resolved.projects).map((p) => p.projectKey),
                  resolved.projects,
                ),
                q.id,
              ).toBe(true);
              const cited = row.sourceLedger.filter((s) =>
                rendered.answer.sourceIds.includes(s.sourceId),
              );
              const preserved = [
                ...row.sourceLedger.flatMap((s) => s.projectKeys),
                ...typedAnswerValues(cited),
              ];
              expect(redactText(rendered.answer.text, preserved), q.id).toBe(rendered.answer.text);
              outcome = { ...rendered, kind: "ANSWER", locale: row.locale, sources: cited };
            }
          }
          const oracle = row.sourceLedger.filter((s) =>
            q.oracleTools.some((tool) => {
              const a = tool.arguments;
              if (tool.name === "get_comparison_category_price_ranges")
                return s.facts.categoryId && (!a.categoryId || a.categoryId === s.facts.categoryId);
              if (tool.name === "get_price_list_item_last_prices")
                return (
                  typeof s.facts.description === "string" &&
                  s.facts.description.toLowerCase().includes(String(a.description).toLowerCase()) &&
                  (!a.unit || s.facts.unit === a.unit)
                );
              return true;
            }),
          );
          const judged = evaluateAnswer(
            q,
            outcome,
            outcome.kind === "ANSWER" && !outcome.refusal ? expectedFacts(q, oracle) : [],
            row.rawAnswer,
            row.sourceLedger,
            row.sourceLedger.flatMap((s) => s.projectKeys),
          );
          rows.push({
            ...row,
            ...judged,
            guarded,
            recordedDiscardReason: row.discardReason ?? null,
            fallback: outcome.kind === "FALLBACK" ? outcome.reason : undefined,
            discardReason:
              outcome.kind === "FALLBACK" ? (outcome.discardReason ?? outcome.reason) : null,
            answerText: outcome.kind === "ANSWER" ? outcome.answer.text : null,
            presentation: outcome.kind === "ANSWER" ? outcome.answer.presentation : null,
            selection: outcome.kind === "ANSWER" ? (outcome.selection ?? null) : null,
          });
        }
        rounds.push(roundSummary(round.round, rows, true));
      }
      const summary = stabilitySummary(rounds, undefined, true);
      const rows = rounds.flatMap((r) => r.questions);
      const proof = {
        mode: "FREE_REPLAY_OF_PAID_RUN",
        paidRun: 45804259788,
        newProviderCalls: 0,
        newEstimatedUsd: "0.000000000",
        note: "Original raw answers and ledgers unchanged; current layout and final identity/subject/redaction checks, unchanged questions, expected values and pass rules. Calls, latency and cost in rounds are the original paid measurements, not new measurements.",
        total: rows.length,
        passedAnswers: rows.filter((r) => r.verdict !== "wrong").length,
        discards: rows.filter((r) => r.discardReason).length,
        wrongValues: rows.filter((r) => r.wrongRecordValue || r.wrongNumber).length,
        accessViolations: rows.filter((r) => r.accessViolation).length,
        ...summary,
      };
      if (process.env.STRIDEBRAIN_AI_ROUND4_REPLAY_REPORT)
        writeFileSync(
          process.env.STRIDEBRAIN_AI_ROUND4_REPLAY_REPORT,
          JSON.stringify(proof, null, 2) + "\n",
        );
      expect(proof).toMatchObject({
        total: 252,
        passedAnswers: 252,
        discards: 0,
        wrongValues: 0,
        accessViolations: 0,
        passed: true,
      });
      expect(summary.requiredAnswers).toEqual({ passed: 126, total: 126 });
      expect(summary.perQuestion.every((q) => q.passes === 3)).toBe(true);
      const closed = rounds[1]!.questions.find((q) => q.id === "en-closed")!;
      const cards = closed.presentation!.blocks.filter((b) => b.kind === "CARD");
      expect(closed.selection!.shown).toHaveLength(13);
      expect(cards).toHaveLength(3);
      expect(cards.map((c) => c.rows.length)).toEqual([3, 3, 3]);
      expect(cards.some((c) => c.remaining)).toBe(false);
    } finally {
      await db.close();
    }
  },
  120000,
);
