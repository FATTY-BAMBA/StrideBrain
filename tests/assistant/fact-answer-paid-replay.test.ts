import { it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { AnswerFactRegistry } from "@/modules/assistant/domain/fact-answers";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
import type { Locale } from "@/modules/localization/config";

type Row = {
  id: string;
  locale: Locale;
  rawAnswer: unknown;
  sourceLedger: AssistantSource[];
  selection: unknown;
  answerText: string | null;
  discardReason: string | null;
};
it("replays every raw question answer from SB-079 paid run 1 against its recorded ledger", () => {
  const report = JSON.parse(
    readFileSync("foundry/tasks/SB-079/evidence/paid-run-1.json", "utf8"),
  ) as { rounds: { round: number; questions: Row[] }[] };
  const rows = report.rounds.flatMap((round) =>
    round.questions.map((row) => {
      if (row.rawAnswer === null)
        return { round: round.round, id: row.id, result: "SERVER_EARLY_ANSWER" };
      const registry = new AnswerFactRegistry(row.locale);
      registry.register(row.sourceLedger);
      const result = registry.render(row.rawAnswer);
      if (row.selection) {
        expect(result.kind, row.id).toBe("ACCEPTED");
        if (result.kind === "ACCEPTED") expect(result.answer.text, row.id).toBe(row.answerText);
      } else if (row.discardReason) {
        expect(result.kind, row.id).toBe("REJECTED");
        if (result.kind === "REJECTED") expect(result.reason, row.id).toBe(row.discardReason);
      } else expect(result.kind, row.id).toBe("REFUSAL");
      return {
        round: round.round,
        id: row.id,
        result: result.kind,
        ...(result.kind === "REJECTED" ? { reason: result.reason } : {}),
      };
    }),
  );
  expect(rows).toHaveLength(186);
  if (process.env.STRIDEBRAIN_AI_REPLAY_REPORT)
    writeFileSync(
      process.env.STRIDEBRAIN_AI_REPLAY_REPORT,
      JSON.stringify(
        {
          mode: "FREE_REPLAY_NO_PROVIDER",
          paidRun: 45702234409,
          passed: true,
          note: "Replays answer rendering and rejection only; instruction changes and earlier tool fast paths require a new end-to-end run.",
          rows,
        },
        null,
        2,
      ) + "\n",
    );
});
