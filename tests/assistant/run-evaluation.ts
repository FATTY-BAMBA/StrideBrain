import { referenceCandidates } from "@/modules/assistant/domain/redaction";
import { randomUUID } from "node:crypto";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import type {
  AssistantConfig,
  AssistantModelPort,
  AssistantSource,
} from "@/modules/assistant/domain/contracts";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { FakeAssistantModel } from "./fake-model";
import { evaluateAnswer, expectedFacts, type EvaluationQuestion } from "./evaluation";
import { evaluationMemberships } from "./evaluation-fixture";
import type { assistantDatabase } from "./database-fixture";
export async function runEvaluationQuestion(
  db: Awaited<ReturnType<typeof assistantDatabase>>,
  question: EvaluationQuestion,
  config: AssistantConfig,
  provider: AssistantModelPort | null,
) {
  const c = {
      ...(await db.actor(evaluationMemberships[question.person])),
      locale: question.locale,
      requestId: randomUUID(),
    },
    services = createAssistantServices();
  const oracle: AssistantSource[] = [];
  for (const tool of question.oracleTools) {
    const result = await services.tools.execute(c, tool);
    oracle.push(...result.sources);
  }
  const facts = expectedFacts(question, oracle);
  const fake = new FakeAssistantModel([
    ...(question.oracleTools.length
      ? [
          {
            usage: { inputTokens: 0, outputTokens: 0 },
            result: { kind: "TOOLS" as const, calls: question.oracleTools },
          },
        ]
      : []),
    {
      usage: { inputTokens: 0, outputTokens: 0 },
      result: {
        kind: "ANSWER",
        answer: {
          text:
            question.expected.kind === "DECLINE"
              ? "No relevant records."
              : question.expected.match === "ANY_SAVED_FINDING"
                ? facts[0]!
                : facts.join(" · "),
          sourceIds: question.expected.kind === "DECLINE" ? [] : oracle.map((s) => s.sourceId),
          followUps: [],
        },
      },
    },
  ]);
  let rawAnswer: unknown;
  const ledger: AssistantSource[] = [];
  const model: AssistantModelPort = {
    async generate(input) {
      const reply = await (provider ?? fake).generate(input);
      if (reply.result.kind === "ANSWER") rawAnswer = reply.result.answer;
      return reply;
    },
  };
  const tools = {
    canSend: services.tools.canSend.bind(services.tools),
    async execute(context: typeof c, call: EvaluationQuestion["oracleTools"][number]) {
      const result = await services.tools.execute(context, call);
      ledger.push(...result.sources);
      return result;
    },
  };
  const started = performance.now(),
    outcome = await new AskAssistant(
      model,
      { ...config, enabled: true },
      services.repository,
      tools,
    ).execute(c, { question: question.question });
  const latencyMs = Math.round(performance.now() - started);
  const references = await services.repository.readableReferences(
    c,
    referenceCandidates([question.question]),
  );
  const judgement = evaluateAnswer(question, outcome, facts, rawAnswer, ledger, references);
  const usage = await getPrismaClient().assistantUsage.aggregate({
    where: { organizationId: c.organizationId, requestId: c.requestId },
    _sum: { inputTokens: true, outputTokens: true, estimatedUsd: true },
    _count: true,
  });
  return {
    id: question.id,
    locale: question.locale,
    ...judgement,
    discardReason: outcome.kind === "FALLBACK" ? (outcome.discardReason ?? outcome.reason) : null,
    latencyMs,
    calls: usage._count,
    inputTokens: usage._sum.inputTokens ?? 0,
    outputTokens: usage._sum.outputTokens ?? 0,
    estimatedUsd: usage._sum.estimatedUsd?.toFixed(9) ?? "0.000000000",
    ...(outcome.kind === "FALLBACK" ? { fallback: outcome.reason } : {}),
  };
}
