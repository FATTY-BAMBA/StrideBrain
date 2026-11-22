import { getPrismaClient } from "./prisma";
import { getDemoSessionSecret } from "@/lib/env/demo-session-secret";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { PrepareQuoteDraft } from "@/modules/quote-draft/application/prepare-quote-draft";
import { SaveQuoteDraft } from "@/modules/quote-draft/application/save-quote-draft";
import { GetQuoteDraft } from "@/modules/quote-draft/application/get-quote-draft";
import { GetQuoteDraftEvidence } from "@/modules/quote-draft/application/get-quote-draft-evidence";
import { PreviewQuoteTotals } from "@/modules/quote-draft/application/preview-quote-totals";
export function createQuoteDraftServices() {
  const repository = new PrismaQuoteDraftRepository(getPrismaClient());
  // The configured server signing secret is reused with a separate MAC domain.
  const codec = new SignedDraftPreparationCodec(getDemoSessionSecret());
  return {
    prepare: new PrepareQuoteDraft(repository, codec),
    save: new SaveQuoteDraft(repository, codec),
    read: new GetQuoteDraft(repository),
    evidence: new GetQuoteDraftEvidence(repository, codec),
    totals: new PreviewQuoteTotals(repository),
  };
}
