import { it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { AnswerFactRegistry } from "@/modules/assistant/domain/fact-answers";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { evaluateAnswer, expectedFacts, type EvaluationQuestion } from "./evaluation";
import questions from "./questions.json";
type Row = {
  id: string;
  locale: Locale;
  rawAnswer: unknown;
  sourceLedger: AssistantSource[];
  selection: unknown;
  answerText: string | null;
  discardReason: string | null;
  verdict: string;
};
it.each([1, 2, 3])(
  "replays every raw question answer from SB-079 paid run %i against its recorded ledger",
  (run) => {
    const report = JSON.parse(
      readFileSync(`foundry/tasks/SB-079/evidence/paid-run-${run}.json`, "utf8"),
    ) as { rounds: { round: number; questions: Row[] }[] };
    // Names come only from authorized recorded sources in this same synthetic run. No
    // new provider call or financial read is needed to replay the changed headings.
    const names = new Map<string, string>();
    for (const round of report.rounds)
      for (const row of round.questions)
        for (const s of row.sourceLedger) {
          if (typeof s.facts.name === "string" && typeof s.facts.reference === "string")
            names.set(`${row.locale}:${s.facts.reference}`, s.facts.name);
        }
    const rows = report.rounds.flatMap((round) =>
      round.questions.map((row) => {
        if (row.rawAnswer === null) {
          expect(row.discardReason).toBeNull();
          return {
            round: round.round,
            id: row.id,
            result: "SERVER_EARLY_ANSWER",
            verdict: row.verdict,
            wrongRecordValue: false,
          };
        }
        const ledger = row.sourceLedger.map((s) => {
          const key = (s.subjectProjectKeys ?? s.projectKeys)[0];
          const name = names.get(`${row.locale}:${key}`);
          let label = s.label;
          if (name && (label === name || label.startsWith(key!)))
            label = `${name} · ${label === name ? key : label}`;
          if (typeof s.facts.lastPrice === "string")
            label = `${s.facts.description}（${s.facts.unit}）`;
          return { ...s, label };
        });
        const registry = new AnswerFactRegistry(row.locale);
        registry.register(ledger);
        const result = registry.render(row.rawAnswer);
        let verdict = row.verdict,
          wrongRecordValue = false;
        if (row.selection) {
          expect(result.kind, row.id).toBe("ACCEPTED");
          if (result.kind === "ACCEPTED") {
            const q = (questions as EvaluationQuestion[]).find((q) => q.id === row.id)!;
            // Score the unchanged question/expected values against the recorded facts,
            // using the new displayed text (not equality with the intentionally old layout).
            const scored = evaluateAnswer(
              q,
              {
                ...result,
                kind: "ANSWER",
                locale: row.locale,
                sources: ledger.filter((s) => result.answer.sourceIds.includes(s.sourceId)),
              },
              expectedFacts(
                q,
                row.sourceLedger.filter((s) =>
                  q.oracleTools.some((tool) => {
                    const a = tool.arguments;
                    if (tool.name === "get_past_prices")
                      return (
                        s.facts.categoryId && (!a.categoryId || s.facts.categoryId === a.categoryId)
                      );
                    if (tool.name === "get_item_prices")
                      return (
                        typeof s.facts.description === "string" &&
                        s.facts.description
                          .toLowerCase()
                          .includes(String(a.description).toLowerCase()) &&
                        (!a.unit || s.facts.unit === a.unit)
                      );
                    return true;
                  }),
                ),
              ),
              row.rawAnswer,
              ledger,
              ledger.flatMap((s) => s.projectKeys),
            );
            verdict = scored.verdict;
            wrongRecordValue = scored.wrongRecordValue;
            expect(wrongRecordValue, row.id).toBe(false);
            if (row.verdict !== "wrong") expect(verdict, row.id).toBe("grounded and correct");
          }
        } else if (row.discardReason) {
          expect(result.kind, row.id).toBe("REJECTED");
          if (result.kind === "REJECTED") expect(result.reason, row.id).toBe(row.discardReason);
        } else expect(result.kind, row.id).toBe("REFUSAL");
        return {
          round: round.round,
          id: row.id,
          result: result.kind,
          verdict,
          wrongRecordValue,
          ...(result.kind === "REJECTED" ? { reason: result.reason } : {}),
          ...(result.kind === "ACCEPTED" ? { answerText: result.answer.text } : {}),
        };
      }),
    );
    expect(rows).toHaveLength(186);
    if (run === 3)
      expect(rows.every((r) => r.verdict !== "wrong" && !r.wrongRecordValue)).toBe(true);
    if (process.env.STRIDEBRAIN_AI_REPLAY_REPORT)
      writeFileSync(
        process.env.STRIDEBRAIN_AI_REPLAY_REPORT.replace(".json", `-run-${run}.json`),
        JSON.stringify(
          {
            mode: "FREE_REPLAY_NO_PROVIDER",
            paidRun: [45702234409, 45728856574, 45732833274][run - 1],
            passed: true,
            note: "Replays unchanged raw selections through the new layout, with names from recorded authorized sources. Server early replies are unchanged; tool routing changes require the paid run.",
            rows,
          },
          null,
          2,
        ) + "\n",
      );
  },
);
