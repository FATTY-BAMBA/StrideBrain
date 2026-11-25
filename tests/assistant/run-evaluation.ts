import { AnswerFactRegistry } from "@/modules/assistant/domain/fact-answers";
import { referenceCandidates } from "@/modules/assistant/domain/redaction";
import { randomUUID } from "node:crypto";
import { AskAssistant } from "@/modules/assistant/application/ask-assistant";
import type {
  AssistantConfig,
  AssistantModelPort,
  AssistantSource,
  ToolCall,
} from "@/modules/assistant/domain/contracts";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { getPrismaClient } from "@/lib/server/prisma";
import { FakeAssistantModel } from "./fake-model";
import {
  evaluateAnswer,
  expectedFacts,
  selectedFacts,
  matchesExpected,
  type EvaluationQuestion,
} from "./evaluation";
import { evaluationMemberships, emptyAwaitingScenario } from "./evaluation-fixture";
import type { assistantDatabase } from "./database-fixture";
export async function runEvaluationQuestion(
  db: Awaited<ReturnType<typeof assistantDatabase>>,
  question: EvaluationQuestion,
  config: AssistantConfig,
  provider: AssistantModelPort | null,
) {
  return emptyAwaitingScenario(question.scenario === "EMPTY_AWAITING", () =>
    evaluateQuestion(db, question, config, provider),
  );
}
async function evaluateQuestion(
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
  const registry = new AnswerFactRegistry(question.locale);
  registry.register(oracle);
  const available = registry.modelSources(oracle).flatMap((s) => s.facts);
  let refs =
    question.expected.kind === "DECLINE"
      ? []
      : facts.map((expected) => {
          const found = available.find((f) =>
            selectedFacts(
              {
                phraseId: "RECORDS_SHOW",
                shown: [
                  {
                    ref: f.ref,
                    sourceId: oracle.find((source) =>
                      registry.modelSources([source])[0]!.facts.some((fact) => fact.ref === f.ref),
                    )!.sourceId,
                    path: f.ref.slice(f.ref.indexOf(".") + 1),
                    kind: "fact",
                  },
                ],
              },
              oracle,
            ).some((actual) => matchesExpected(actual, expected)),
          );
          if (!found) throw Error(`FAKE_MISSING_REF:${question.id}:${expected.path}`);
          return found.ref;
        });
  if (question.expected.match === "ANY_SAVED_FINDING") refs = refs.slice(0, 1);
  if (question.expected.match === "NONEMPTY_LIST")
    refs = [registry.modelSources(oracle).find((s) => s.list)!.list!.ref];
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
          parts: refs.length ? [{ say: "RECORDS_SHOW" }, ...refs.map((show) => ({ show }))] : [],
          followUps: [],
        },
      },
    },
  ]);
  const toolCalls: ToolCall[] = [];
  let rawAnswer: unknown;
  let sentSubjectNames: string[] = [];
  let sentReferenceTexts: string[] = [];
  const ledger: AssistantSource[] = [];
  const model: AssistantModelPort = {
    async generate(input) {
      const sent = JSON.parse(input.messages[0]!.text) as {
        subjectProjects?: { reference: string; names: string[] }[];
        selectedProjectReference?: string;
      };
      sentSubjectNames = sent.subjectProjects?.flatMap((p) => p.names) ?? [];
      sentReferenceTexts = [
        ...(sent.subjectProjects?.map((p) => p.reference) ?? []),
        ...(sent.selectedProjectReference ? [sent.selectedProjectReference] : []),
      ];
      const reply = await (provider ?? fake).generate(input);
      if (reply.result.kind === "ANSWER") rawAnswer = reply.result.answer;
      else toolCalls.push(...reply.result.calls);
      return reply;
    },
  };
  const tools = {
    resolveSubjects: services.tools.resolveSubjects.bind(services.tools),
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
    ).execute(c, {
      question: question.question,
      ...(question.projectKey ? { projectKey: question.projectKey } : {}),
    });
  const latencyMs = Math.round(performance.now() - started);
  const references = await services.repository.readableReferences(
    c,
    referenceCandidates([question.question, ...sentReferenceTexts]),
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
    required: question.required ?? false,
    qualityRegression: question.qualityRegression ?? false,
    factSelectionRegression: question.factSelectionRegression ?? false,
    namedJobRefusal:
      outcome.kind === "ANSWER" &&
      !!outcome.refusal &&
      (sentSubjectNames.length > 0 ||
        toolCalls.some((t) => typeof t.arguments.projectKey === "string")),
    ...(judgement.verdict === "wrong" || usage._count > 3 ? { toolCalls } : {}),
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
