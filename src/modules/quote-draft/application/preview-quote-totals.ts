import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { QuoteDraftRepositoryPort } from "@/repositories/ports/quote-draft-repository";
import { validateSaveDraft } from "@/modules/quote-draft/domain/save-input";
import {
  type QuoteTotals,
  type QuoteDocumentAmounts,
  quoteDocumentTotals,
  quoteCategoryTotals,
  quoteTotals,
} from "@/modules/finance/quote-totals";
import { validateQuoteDocument } from "../domain/document-input";
import { validKey } from "@/modules/quote-issue/domain/input";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
export type QuoteTotalsPreview =
  | (QuoteTotals & { sections?: never; categoryTotals?: never })
  | (QuoteDocumentAmounts & { categoryTotals: ReturnType<typeof quoteCategoryTotals> });
export class PreviewQuoteTotals {
  constructor(private readonly repository: QuoteDraftRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<QuoteTotalsPreview | null> {
    if (!context.capabilities.has("quote:draft") || !context.capabilities.has("quote:read"))
      return null;
    if (!context.firmLists) return null;
    if (raw && typeof raw === "object" && "sections" in raw) {
      const document = validateQuoteDocument(raw, context.locale);
      const key = "projectKey" in raw ? raw.projectKey : null;
      if (!document || !validKey(key)) return null;
      return this.repository.transaction(async (tx) => {
        const job = await tx.getJob(context, key);
        if (
          !job ||
          job.organizationId !== context.organizationId ||
          !new AuthorizationService().canReadCommercial(context, job.id, "QUOTE").allowed
        )
          return null;
        try {
          const totals = quoteDocumentTotals(document);
          return { ...totals, categoryTotals: quoteCategoryTotals(totals) };
        } catch {
          return null;
        }
      });
    }
    const input = validateSaveDraft(raw, context.firmLists.workCategories);
    if (!input) return null;
    return this.repository.transaction(async (tx) => {
      const job = await tx.getJob(context, input.projectKey);
      return job && job.organizationId === context.organizationId
        ? quoteTotals(input.lines.map((line) => line.amount))
        : null;
    });
  }
}
