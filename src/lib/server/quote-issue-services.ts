import { getPrismaClient } from "./prisma";
import { getDemoSessionSecret } from "@/lib/env/demo-session-secret";
import { PrismaQuoteIssueRepository } from "@/repositories/prisma/prisma-quote-issue-repository";
import { SignedQuoteIssueCodec } from "@/modules/quote-issue/application/issue-codec";
import {
  GetFirmDetails,
  SaveFirmDetails,
  PrepareQuoteIssue,
  IssueQuote,
  ReviseIssuedQuote,
  RecordQuoteAcceptance,
  ResolveQuoteConflict,
  GetQuoteIssue,
  GetQuoteDocument,
} from "@/modules/quote-issue/application/issue-services";
export function createQuoteIssueServices() {
  const repository = new PrismaQuoteIssueRepository(getPrismaClient()),
    codec = new SignedQuoteIssueCodec(getDemoSessionSecret());
  return {
    firm: new GetFirmDetails(repository),
    saveFirm: new SaveFirmDetails(repository),
    prepare: new PrepareQuoteIssue(repository, codec),
    issue: new IssueQuote(repository, codec),
    revise: new ReviseIssuedQuote(repository),
    accept: new RecordQuoteAcceptance(repository),
    resolve: new ResolveQuoteConflict(repository),
    read: new GetQuoteIssue(repository),
    document: new GetQuoteDocument(repository),
  };
}
