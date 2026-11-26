import { it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readFileSync, writeFileSync } from "node:fs";
import { AnswerFactRegistry } from "@/modules/assistant/domain/fact-answers";
import type {
  AssistantSource,
  AssistantOutcome,
  ToolCall,
} from "@/modules/assistant/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { evaluateAnswer, expectedFacts, type EvaluationQuestion } from "./evaluation";
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation, evaluationMemberships } from "./evaluation-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import questions from "./questions.json";
type Row = {
  id: string;
  locale: Locale;
  rawAnswer: { parts: { say?: string; show?: string }[]; followUps: string[] } | null;
  selection: { phraseId: string; shown: { ref: string }[] } | null;
  sourceLedger: AssistantSource[];
  verdict: string;
  toolCalls?: ToolCall[];
};
(process.env.DATABASE_URL ? it : it.skip)(
  "replays all 252 run-6 selections and the recorded ping calls without a provider",
  async () => {
    const report = JSON.parse(
      readFileSync("foundry/tasks/SB-079/evidence/paid-run-6.json", "utf8"),
    ) as { rounds: { round: number; questions: Row[] }[] };
    const db = await assistantDatabase();
    try {
      await prepareEvaluation(db);
      const services = createAssistantServices();
      const rows = [];
      const ping = [];
      for (const round of report.rounds)
        for (const row of round.questions) {
          const q = (questions as EvaluationQuestion[]).find((q) => q.id === row.id)!;
          const context = {
            ...(await db.actor(evaluationMemberships[q.person])),
            locale: q.locale,
          };
          const guard = await services.repository.questionMentionsUnreadableJob(
            context,
            q.question,
          );
          // Remove ONLY the obsolete metadata. Parts, selected refs, order and follow-ups
          // stay recorded. Never generate a replacement selection to turn a refusal into facts.
          const raw = row.rawAnswer
            ? { parts: row.rawAnswer.parts, followUps: row.rawAnswer.followUps }
            : null;
          const registry = new AnswerFactRegistry(row.locale);
          registry.register(row.sourceLedger);
          const refusal: AssistantOutcome = {
            kind: "ANSWER",
            locale: row.locale,
            refusal: "UNAVAILABLE",
            answer: { text: "Recorded/server refusal", sourceIds: [], followUps: [] },
            sources: [],
          };
          const score = (applyAll: boolean) => {
            const whitespace = raw?.parts.some((part) => part.show && /\s/u.test(part.show));
            const rendered = raw
              ? registry.render(raw)
              : row.selection
                ? registry.render({
                    parts: [
                      { say: row.selection.phraseId },
                      ...row.selection.shown.map((f) => ({ show: f.ref })),
                    ],
                    followUps: [],
                  })
                : null;
            let outcome: AssistantOutcome = refusal;
            if (applyAll && guard) outcome = refusal;
            else if (!applyAll && whitespace)
              outcome = {
                kind: "FALLBACK",
                reason: "UNGROUNDED",
                discardReason: "UNKNOWN_REFERENCE",
              };
            else if (rendered?.kind === "ACCEPTED")
              outcome = {
                ...rendered,
                kind: "ANSWER",
                locale: row.locale,
                sources: row.sourceLedger.filter((s) =>
                  rendered.answer.sourceIds.includes(s.sourceId),
                ),
              };
            else if (rendered?.kind === "REJECTED")
              outcome = { kind: "FALLBACK", reason: "UNGROUNDED", discardReason: rendered.reason };
            const oracle = row.sourceLedger.filter((s) =>
              q.oracleTools.some((tool) => {
                const a = tool.arguments;
                if (tool.name === "get_comparison_category_price_ranges")
                  return (
                    s.facts.categoryId && (!a.categoryId || a.categoryId === s.facts.categoryId)
                  );
                if (tool.name === "get_price_list_item_last_prices")
                  return (
                    typeof s.facts.description === "string" &&
                    s.facts.description
                      .toLowerCase()
                      .includes(String(a.description).toLowerCase()) &&
                    (!a.unit || s.facts.unit === a.unit)
                  );
                return true;
              }),
            );
            const expected =
              outcome.kind === "ANSWER" && !outcome.refusal ? expectedFacts(q, oracle) : [];
            const judgement = evaluateAnswer(
              q,
              outcome,
              expected,
              raw,
              row.sourceLedger,
              row.sourceLedger.flatMap((s) => s.projectKeys),
            );
            return {
              verdict: judgement.verdict,
              wrongRecordValue: judgement.wrongRecordValue,
              accessViolation: judgement.accessViolation,
              ...(outcome.kind === "FALLBACK" ? { discardReason: outcome.discardReason } : {}),
              answerText: outcome.kind === "ANSWER" ? outcome.answer.text : null,
            };
          };
          rows.push({
            round: round.round,
            id: q.id,
            guard,
            fieldRemovalOnly: score(false),
            currentChecks: score(true),
          });
          for (const call of row.toolCalls ?? [])
            if (call.name === "get_price_list_item_last_prices" && call.arguments.unit === "ping") {
              const result = await services.tools.execute(context, call);
              expect(result.status).toBe("OK");
              const items = result.sources.filter((s) => s.countSourceId);
              expect(
                items.some(
                  (s) =>
                    s.facts.description === "天花板 Ceiling" &&
                    s.facts.unit === "坪" &&
                    s.facts.lastPrice === "NT$3,200",
                ),
              ).toBe(true);
              ping.push({ round: round.round, id: q.id, call, result });
            }
        }
      const summary = {
        mode: "FREE_RECORDED_REPLAY_NOT_MODEL_QUALITY",
        paidRun: 45794522013,
        total: rows.length,
        fieldRemovalOnlyPassed: rows.filter((r) => r.fieldRemovalOnly.verdict !== "wrong").length,
        currentChecksPassed: rows.filter((r) => r.currentChecks.verdict !== "wrong").length,
        currentWrongValues: rows.filter((r) => r.currentChecks.wrongRecordValue).length,
        pingCalls: ping.length,
        note: "Only obsolete metadata is removed. The original ping answer is still a refusal; replaying its reads proves available data, not a new model selection. Field-removal-only projection intentionally retains the old whitespace lookup and has no new unreadable-identity guard.",
        rows,
        ping,
      };
      if (process.env.STRIDEBRAIN_AI_ROUND3_REPLAY_REPORT)
        writeFileSync(
          process.env.STRIDEBRAIN_AI_ROUND3_REPLAY_REPORT,
          JSON.stringify(summary, null, 2) + "\n",
        );
      expect(rows).toHaveLength(252);
      expect(summary.fieldRemovalOnlyPassed).toBe(249);
      expect(summary.currentChecksPassed).toBe(251);
      expect(summary.currentWrongValues).toBe(0);
      expect(ping).toHaveLength(6);
    } finally {
      await db.close();
    }
  },
  120000,
);
