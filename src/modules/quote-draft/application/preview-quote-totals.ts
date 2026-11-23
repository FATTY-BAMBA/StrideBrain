import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { QuoteDraftRepositoryPort } from "@/repositories/ports/quote-draft-repository";
import { validateSaveDraft } from "@/modules/quote-draft/domain/save-input";
import { quoteTotals } from "@/modules/finance/quote-totals";
export class PreviewQuoteTotals {
  constructor(private readonly repository: QuoteDraftRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown) {
    if (!context.capabilities.has("quote:draft") || !context.capabilities.has("quote:read"))
      return null;
    if (!context.firmLists) return null;
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
