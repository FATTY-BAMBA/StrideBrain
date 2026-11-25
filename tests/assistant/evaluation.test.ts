import { runEvaluationRounds } from "./evaluation-stability";
import { writeFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import questions from "./questions.json";
import { FakeAssistantModel } from "./fake-model";
import { assistantDatabase } from "./database-fixture";
import { prepareEvaluation } from "./evaluation-fixture";
import { runEvaluationQuestion } from "./run-evaluation";
import { evaluateAnswer, type EvaluationQuestion } from "./evaluation";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
describe("evaluation contract", () => {
  it("contains twenty core English and twenty core zh-TW cases plus eight hosted regressions, two count/range cases and four job-page cases with explicit facts or refusals", () => {
    expect(
      questions.filter((q) => q.locale === "en" && !("required" in q && q.required)),
    ).toHaveLength(20);
    expect(
      questions.filter((q) => q.locale === "zh-TW" && !("required" in q && q.required)),
    ).toHaveLength(20);
    expect(questions.filter((q) => "required" in q && q.required)).toHaveLength(14);
    expect(
      questions
        .filter((q) => q.id.includes("-job-page-"))
        .map((q) => [q.locale, q.required, q.projectKey]),
    ).toEqual([
      ["en", true, "J-2611-R7K3"],
      ["en", true, "J-2611-R7K3"],
      ["zh-TW", true, "J-2611-R7K3"],
      ["zh-TW", true, "J-2611-R7K3"],
    ]);
    expect(
      questions.every(
        (q) =>
          q.expected.kind === "DECLINE" ||
          q.expected.match === "ANY_SAVED_FINDING" ||
          q.expected.facts.length > 0,
      ),
    ).toBe(true);
  });
  it("reports a discarded wrong number separately from displayed output", () => {
    const q = questions[0] as EvaluationQuestion;
    expect(
      evaluateAnswer(q, { kind: "FALLBACK", reason: "UNGROUNDED" }, [], { text: "$999" }, []),
    ).toMatchObject({
      verdict: "wrong",
      wrongNumber: false,
      draftWrongNumber: true,
      draftUnsupportedTokens: ["999"],
      rawAnswerText: "$999",
    });
  });
  it.each(["en-work", "zh-TW-work"])(
    "fails a contradictory empty Work list in %s even when it names the expected jobs",
    (id) => {
      const q = questions.find((q) => q.id === id) as EvaluationQuestion;
      expect(q.expected.match).toBe("NONEMPTY_LIST");
      const en = q.locale === "en";
      const names = en
        ? ["Active Design Project 03", "Active Design Project 04"]
        : ["進行中設計專案03", "進行中設計專案04"];
      const sources: AssistantSource[] = [
        ...names.map((name, index) => ({
          sourceId: `row-${index}`,
          href: "/",
          label: name,
          facts: { name },
          projectKeys: [`PRJ-ACTIVE-00${index + 3}`],
          countSourceId: "count",
        })),
        {
          sourceId: "count",
          href: "/",
          label: "Jobs",
          facts: { count: 2, matchingCount: 2, appliedStageGroup: en ? "Work" : "施工" },
          projectKeys: [],
        },
      ];
      const score = (text: string, question = q) => {
        const answer = { text, sourceIds: ["row-0", "row-1"], followUps: [] };
        return evaluateAnswer(
          question,
          { kind: "ANSWER", locale: q.locale, answer, sources },
          names,
          answer,
          sources,
        );
      };
      // Exact English hosted answer; equivalent zh-TW contradiction.
      const rejected = en
        ? "There are no jobs currently in the work stage. The available jobs (Active Design Project 03 and Active Design Project 04) are in the Construction stage."
        : "目前沒有專案在施工階段群組。可用的專案（進行中設計專案03與進行中設計專案04）處於施工階段。";
      expect(score(rejected)).toMatchObject({ verdict: "wrong", wrongNumber: false });
      expect(
        score(rejected, { ...q, expected: { kind: "FACTS", facts: names, forbidden: [] } }).verdict,
      ).toBe("grounded and correct");
      expect(
        score(`${en ? "None right now." : "目前有零個專案。"} ${names.join(", ")}`).verdict,
      ).toBe("wrong");
      expect(
        score(
          en
            ? `Work: 2 jobs. ${names.join(" and ")} are in Construction.`
            : `施工群組：2 個專案。${names.join("與")}均為施工階段。`,
        ).verdict,
      ).toBe("grounded and correct");
    },
  );
});
(process.env.DATABASE_URL ? it : it.skip)(
  "runs all evaluation cases with the fake over authorized seeded records (not a model-quality score)",
  async () => {
    const report = await runEvaluationRounds(async () => {
      const db = await assistantDatabase();
      try {
        await prepareEvaluation(db);
        const rows = [];
        for (const question of questions as EvaluationQuestion[])
          rows.push(await runEvaluationQuestion(db, question, assistantConfig({}), null));
        return rows;
      } finally {
        await db.close();
      }
    });
    if (process.env.STRIDEBRAIN_AI_FAKE_REPORT)
      writeFileSync(
        process.env.STRIDEBRAIN_AI_FAKE_REPORT,
        JSON.stringify({ mode: "DETERMINISTIC_FAKE_NOT_MODEL_QUALITY", ...report }, null, 2) + "\n",
      );
    expect(report.passed).toBe(true);
    expect(report.rounds).toHaveLength(3);
    expect(report.perQuestion.every((q) => q.passes === 3)).toBe(true);
  },
  120000,
);

(process.env.DATABASE_URL ? it : it.skip)(
  "scores the server empty-list answer without requesting the paid draft's unrelated page follow-up",
  async () => {
    const db = await assistantDatabase();
    try {
      const question = questions.find(
        (q) => q.id === "en-home-empty-awaiting",
      ) as EvaluationQuestion;
      const model = new FakeAssistantModel([
        {
          usage: { inputTokens: 0, outputTokens: 0 },
          result: { kind: "TOOLS", calls: [{ name: "list_awaiting_client", arguments: {} }] },
        },
        (request) => {
          const data = JSON.parse(request.messages.at(-1)!.text);
          expect(JSON.parse(request.messages[0]!.text).selectedProjectReference).toBe(
            "J-2611-R7K3",
          );
          expect(data.sources).toHaveLength(1);
          expect(data.sources[0].facts["Record count"]).toBe(0);
          return {
            usage: { inputTokens: 0, outputTokens: 0 },
            result: {
              kind: "ANSWER",
              answer: {
                text: "There are currently 0 quotes waiting for the client.",
                sourceIds: [data.sources[0].sourceId],
                followUps: [
                  "What is the status of quotes for project J-2611-R7K3?",
                  "Are there any quotes in the inquiry stage?",
                  "Can you list the closed jobs?",
                ],
              },
            },
          };
        },
      ]);
      const row = await runEvaluationQuestion(db, question, assistantConfig({}), model);
      expect(row).toMatchObject({
        verdict: "grounded and correct",
        wrongNumber: false,
        draftWrongNumber: false,
      });
      expect(model.requests).toHaveLength(1);
      expect(row.followUps).toEqual([]);
      expect(row.answerText).not.toContain("J-2611-R7K3");
    } finally {
      await db.close();
    }
  },
  30000,
);
