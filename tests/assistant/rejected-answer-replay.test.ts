import { it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation, evaluationMemberships } from "./evaluation-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { checkAnswer } from "@/modules/assistant/domain/grounding";
import { redactSource } from "@/modules/assistant/domain/redaction";
import { evaluateAnswer, expectedFacts, type EvaluationQuestion } from "./evaluation";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
import questions from "./questions.json";
import fixtures from "./rejected-answer-fixtures.json";
import qualityFixtures from "./quality-rejected-answer-fixtures.json";
import sb060Fixtures from "./sb060-rejected-answer-fixtures.json";
(process.env.DATABASE_URL ? it : it.skip)(
  "replays rejected paid answers against the authorized synthetic sources",
  async () => {
    const db = await assistantDatabase();
    try {
      await prepareEvaluation(db);
      const failures = [];
      for (const fixture of [...fixtures, ...qualityFixtures, ...sb060Fixtures]) {
        const q = questions.find((q) => q.id === fixture.id)! as EvaluationQuestion;
        const c = { ...(await db.actor(evaluationMemberships[q.person])), locale: q.locale };
        const services = createAssistantServices();
        const oracle: AssistantSource[] = [];
        for (const call of q.oracleTools)
          oracle.push(...(await services.tools.execute(c, call)).sources);
        const ledger = [...oracle];
        if (fixture.id.endsWith("status"))
          ledger.push(
            ...(await services.tools.execute(c, { name: "list_jobs", arguments: { query: "01" } }))
              .sources,
          );
        if (fixture.id.endsWith("viewer-amount"))
          ledger.push(
            ...(
              await services.tools.execute(c, {
                name: "list_jobs",
                arguments: { query: "PRJ-XINYI-026" },
              })
            ).sources,
          );
        const sources = ledger.map((s) => redactSource(s, s.projectKeys));
        const ids = oracle.length ? oracle.map((s) => s.sourceId) : sources.map((s) => s.sourceId);
        const raw = { text: fixture.text, sourceIds: ids, followUps: [] };
        const checked = checkAnswer(raw, sources, q.locale);
        if (fixture.run === 45053587841 && fixture.id === "zh-TW-status") {
          // SB-058 now forbids the raw acceptedOn field retained in this original fixture.
          expect(checked).toEqual({ kind: "REJECTED", reason: "DISPLAY_FORMAT" });
          const clean = checkAnswer(
            { ...raw, text: fixture.text.replace("（acceptedOn 為 null）", "") },
            sources,
            q.locale,
          );
          expect(clean.kind).toBe("ACCEPTED");
          continue;
        }
        if (checked.kind === "REJECTED") {
          failures.push({ id: fixture.id, run: fixture.run, reason: checked.reason });
          continue;
        }
        if (fixture.id === "zh-TW-finding" && sb060Fixtures.some((f) => f.text === fixture.text)) {
          const savedSentences = sources.flatMap((s) =>
            Array.isArray(s.facts.findings)
              ? s.facts.findings.map((f: { text: string }) => f.text)
              : [],
          );
          for (const sentence of checked.answer.text
            .split("\n")
            .filter((line) => line.includes("%")))
            expect(savedSentences).toContain(sentence);
        }
        if (q.expected.kind === "DECLINE") continue; // Original report did not retain its refusal's citations.
        const result = evaluateAnswer(
          q,
          {
            kind: "ANSWER",
            locale: q.locale,
            answer: checked.answer,
            sources: sources.filter((s) => checked.answer.sourceIds.includes(s.sourceId)),
          },
          expectedFacts(q, oracle),
          raw,
          sources,
        );
        if (result.verdict === "wrong")
          failures.push({
            id: fixture.id,
            run: fixture.run,
            reason: "EVALUATION",
            unsupported: result.unsupportedTokens,
          });
      }
      expect(failures).toEqual([]);
    } finally {
      await db.close();
    }
  },
  120000,
);
