import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { DraftJob } from "@/modules/assistant/application/draft-job";
import type { AssistantConfig, JobDraftModelPort } from "@/modules/assistant/domain/contracts";
import { draftFields } from "@/modules/assistant/domain/job-draft";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaAssistantRepository } from "@/repositories/prisma/prisma-assistant-repository";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import type { assistantDatabase } from "./database-fixture";
import { jobDraftCases, reportedJobDraftCases, type JobDraftCase } from "./job-draft-cases";

export async function runJobDraftCase(
  db: Awaited<ReturnType<typeof assistantDatabase>>,
  test: JobDraftCase,
  config: AssistantConfig,
  provider: JobDraftModelPort,
) {
  const c = { ...(await db.actor()), locale: test.locale, requestId: randomUUID() },
    prisma = getPrismaClient();
  let calls = 0,
    rawDraft: unknown;
  const model: JobDraftModelPort = {
    async draftJob(input) {
      calls++;
      const reply = await provider.draftJob(input);
      rawDraft = reply.draft;
      return reply;
    },
  };
  const result = await new DraftJob(
    model,
    config,
    new PrismaAssistantRepository(prisma),
    new PrismaProjectWriteRepository(prisma),
  ).execute(c, test.text);
  const draft = result.kind !== "UNAVAILABLE" ? result.draft : undefined;
  const values = draft?.values ?? {},
    scopes = [...(draft?.scopeCategoryIds ?? [])].sort();
  // This independent case oracle catches semantically unsupported choices too, not just absent quotes.
  const unsupportedKept = [
    ...Object.entries(values)
      .filter(([key, value]) => test.expected[key] !== value)
      .map(([key]) => key),
    ...scopes
      .filter((scope) => !test.scopes.includes(scope))
      .map((scope) => `scopeCategoryIds.${scope}`),
    ...(draft?.clientBusinessKey && draft.clientBusinessKey !== test.clientKey
      ? ["clientBusinessKey"]
      : []),
  ];
  const passed =
    !!draft &&
    calls === 1 &&
    !unsupportedKept.length &&
    isDeepStrictEqual(values, test.expected) &&
    isDeepStrictEqual(scopes, [...test.scopes].sort()) &&
    draft.clientBusinessKey === test.clientKey;
  const usage = await prisma.assistantUsage.findMany({
    where: { organizationId: c.organizationId, requestId: c.requestId },
  });
  if (usage.length !== 1) throw new Error("DRAFT_USAGE_ROW_COUNT");
  return {
    id: test.id,
    locale: test.locale,
    required: test.required,
    passed,
    calls,
    outcome: result.kind,
    ...(result.kind === "UNAVAILABLE" ? { reason: result.reason } : {}),
    kept: {
      ...values,
      scopeCategoryIds: scopes,
      clientBusinessKey: draft?.clientBusinessKey ?? "",
    },
    dropped: draft?.dropped ?? draftFields,
    unsupportedKept,
    ...(!passed
      ? {
          rawDraft,
          expected: {
            ...test.expected,
            scopeCategoryIds: test.scopes,
            clientBusinessKey: test.clientKey,
          },
        }
      : {}),
    inputTokens: usage[0]!.inputTokens,
    outputTokens: usage[0]!.outputTokens,
    estimatedUsd: usage[0]!.estimatedUsd?.toFixed(9) ?? "0.000000000",
  };
}
export type JobDraftEvaluationRow = Awaited<ReturnType<typeof runJobDraftCase>>;
export function summarizeJobDraftRound(round: number, cases: readonly JobDraftEvaluationRow[]) {
  const scores = Object.fromEntries(
    ["en", "zh-TW"].map((locale) => [
      locale,
      cases.filter((c) => c.locale === locale && c.passed).length,
    ]),
  );
  const required = cases.filter((c) => c.required);
  const passed =
    cases.length === jobDraftCases.length &&
    new Set(cases.map((c) => c.id)).size === jobDraftCases.length &&
    jobDraftCases.every((test) =>
      cases.some((c) => c.id === test.id && c.locale === test.locale),
    ) &&
    ["en", "zh-TW"].every(
      (locale) =>
        cases.filter((c) => c.locale === locale).length === 16 &&
        // Preserve the original 10/12 gate; new required cases cannot make up a core miss.
        cases.filter(
          (c) =>
            c.locale === locale &&
            c.passed &&
            ![
              "individual-client",
              "chinese-city",
              "residential-unlisted",
              "new-client-acceptance",
            ].some((suffix) => c.id.endsWith(suffix)),
        ).length >= 10,
    ) &&
    required.every((c) => c.passed) &&
    cases.every((c) => !c.unsupportedKept.length && c.calls === 1);
  return {
    round,
    scores,
    required: { passed: required.filter((c) => c.passed).length, total: required.length },
    passed,
    cases,
  };
}
export async function runJobDraftRounds(
  run: (test: JobDraftCase, round: number) => Promise<JobDraftEvaluationRow>,
) {
  const rounds: (ReturnType<typeof summarizeJobDraftRound> & {
    reportedCases: readonly JobDraftEvaluationRow[];
  })[] = [];
  for (let round = 1; round <= 3; round++) {
    const rows = [];
    for (const test of jobDraftCases) rows.push(await run(test, round));
    const reportedCases = [];
    for (const test of reportedJobDraftCases) reportedCases.push(await run(test, round));
    rounds.push({ ...summarizeJobDraftRound(round, rows), reportedCases });
  }
  return {
    passed: rounds.every((r) => r.passed),
    rounds,
    perCase: jobDraftCases.map((c) => ({
      id: c.id,
      locale: c.locale,
      passes: rounds.filter((r) => r.cases.find((row) => row.id === c.id)?.passed).length,
      rounds: 3,
    })),
    reportedPerCase: reportedJobDraftCases.map((c) => ({
      id: c.id,
      locale: c.locale,
      passes: rounds.filter((r) => r.reportedCases.find((row) => row.id === c.id)?.passed).length,
      rounds: 3,
    })),
  };
}
