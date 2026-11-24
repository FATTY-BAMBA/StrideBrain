import { randomUUID } from "node:crypto";
import { expect } from "vitest";
import { getPrismaClient } from "@/lib/server/prisma";
import { CreateProject } from "@/modules/projects/application/create-project";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import { SaveQuoteDraft } from "@/modules/quote-draft/application/save-quote-draft";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { PrismaQuoteIssueRepository } from "@/repositories/prisma/prisma-quote-issue-repository";
import { SignedQuoteIssueCodec } from "@/modules/quote-issue/application/issue-codec";
import {
  PrepareQuoteIssue,
  IssueQuote,
  ReviseIssuedQuote,
} from "@/modules/quote-issue/application/issue-services";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  QuoteDocumentLine,
  QuoteDocumentSection,
} from "@/modules/quote-draft/domain/document-input";
import { jobInput } from "../projects/job-fixture";
export const priceItem = (
  description = "天花板",
  unitPrice = "3500",
  unit = "坪",
): QuoteDocumentLine => ({ kind: "ITEM", description, unitPrice, unit, quantity: "1", remark: "" });
const secret = "synthetic-price-list-test-secret-more-than-32-bytes";
export async function priceJob(context: RuntimeContext, clientKey?: string) {
  const input = {
    ...jobInput(),
    ...(clientKey
      ? {
          clientMode: "existing" as const,
          clientBusinessKey: clientKey,
          clientName: "",
          clientType: "",
        }
      : {}),
  };
  expect(
    (
      await new CreateProject(new PrismaProjectWriteRepository(getPrismaClient())).execute(
        { ...context, requestId: randomUUID() },
        input,
      )
    ).kind,
  ).toBe("CREATED");
  const row = await getPrismaClient().project.findFirstOrThrow({
    where: { businessKey: input.businessKey, organizationId: context.organizationId },
    select: { id: true, clientId: true },
  });
  return {
    projectKey: input.businessKey,
    projectId: row.id,
    clientId: row.clientId,
    clientKey: input.clientBusinessKey,
  };
}
export function priceServices(now = new Date("2026-11-26T00:00:00.000Z")) {
  const repo = new PrismaQuoteIssueRepository(getPrismaClient());
  const codec = new SignedQuoteIssueCodec(secret, () => now);
  return {
    save: new SaveQuoteDraft(
      new PrismaQuoteDraftRepository(getPrismaClient()),
      new SignedDraftPreparationCodec(secret),
    ),
    prepare: new PrepareQuoteIssue(repo, codec, () => now),
    issue: new IssueQuote(repo, codec, () => now),
    revise: new ReviseIssuedQuote(repo),
  };
}
export async function issuedPrice(
  context: RuntimeContext,
  job: Awaited<ReturnType<typeof priceJob>>,
  lines: readonly QuoteDocumentLine[],
  now?: Date,
  baseVersionId: string | null = null,
  sections?: readonly QuoteDocumentSection[],
) {
  const app = priceServices(now);
  const saved = await app.save.execute(
    { ...context, requestId: randomUUID() },
    {
      projectKey: job.projectKey,
      baseVersionId,
      preparationToken: null,
      idempotencyKey: randomUUID(),
      sections: sections ?? [{ title: "Synthetic prices", categoryId: null, lines }],
      discount: { label: "", amount: "0" },
    },
  );
  if (saved.kind !== "SAVED") throw Error(`SAVE_${saved.kind}`);
  const prepared = await app.prepare.execute(context, {
    projectKey: job.projectKey,
    versionId: saved.versionId,
    options: { language: "zh-TW", attention: "" },
  });
  if (prepared.kind !== "PREPARED") throw Error(`PREPARE_${prepared.kind}`);
  expect(prepared.preparation.blockers).toEqual([]);
  const issued = await app.issue.execute(
    { ...context, requestId: randomUUID() },
    { projectKey: job.projectKey, token: prepared.token, idempotencyKey: randomUUID() },
  );
  if (issued.kind !== "ISSUED") throw Error(`ISSUE_${issued.kind}`);
  return { versionId: saved.versionId, documentNumber: issued.documentNumber! };
}
