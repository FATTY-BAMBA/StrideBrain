import { orderQuoteLines } from "@/modules/quote-draft/domain/quote-line-order";
import { isCategoryDraft } from "@/modules/quote-draft/domain/save-input";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { basisOutOfDate, basisSourceIds } from "@/modules/quote-draft/domain/draft-policy";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  QuoteDraftJob,
  QuoteDraftRepositoryPort,
  SavedDraft,
  SavedDraftLine,
} from "@/repositories/ports/quote-draft-repository";
export type VisibleDraftLine = SavedDraftLine &
  Readonly<{ basisUnavailable: boolean; basisOutOfDate: boolean; openConflict: boolean }>;
export type QuoteDraftView =
  | Readonly<{
      kind: "AVAILABLE";
      job: QuoteDraftJob;
      canDraft: boolean;
      canReadAmounts: boolean;
      saved: (Omit<SavedDraft, "lines"> & { lines: readonly VisibleDraftLine[] }) | null;
    }>
  | Readonly<{ kind: "UNAVAILABLE" }>;
export class GetQuoteDraft {
  constructor(private readonly repository: QuoteDraftRepositoryPort) {}
  execute(context: RuntimeContext, projectKey: string): Promise<QuoteDraftView> {
    return this.repository.transaction(async (tx) => {
      const job = await tx.getJob(context, projectKey);
      const auth = new AuthorizationService();
      if (
        !job ||
        job.organizationId !== context.organizationId ||
        !auth.canReadProject(context, job.id).allowed
      )
        return { kind: "UNAVAILABLE" };
      const canReadAmounts = auth.canReadCommercial(context, job.id, "QUOTE").allowed;
      const saved = canReadAmounts ? await tx.getSaved(context, job) : null;
      const lines = await Promise.all(
        (saved?.lines ?? []).map(async (line): Promise<VisibleDraftLine> => {
          const ids = line.recorded ? basisSourceIds(line.recorded.basis) : [];
          const actualAllowed =
            !line.recorded?.basis.actualExceeded ||
            auth.canReadCommercial(context, job.id, "ACTUAL").allowed;
          const sources =
            actualAllowed && line.recorded && ids.length
              ? await tx.getSources(context, line.recorded.comparisonRunId, ids)
              : null;
          const available =
            actualAllowed && (!line.recorded || !ids.length || sources?.kind === "COMPLETE");
          return {
            ...line,
            recorded: available ? line.recorded : null,
            enteredBy: null,
            openConflict:
              sources?.kind === "COMPLETE" &&
              sources.sources.some((source) => source.conflictKeys.length > 0),
            basisUnavailable: !!line.recorded && !available,
            basisOutOfDate:
              available &&
              !!line.recorded &&
              basisOutOfDate(line.recorded.basis, job, line.categoryId),
          };
        }),
      );
      return {
        kind: "AVAILABLE",
        job,
        canReadAmounts,
        canDraft:
          canReadAmounts &&
          context.capabilities.has("quote:draft") &&
          (!saved || isCategoryDraft(saved.lines)),
        saved: saved
          ? { ...saved, lines: saved.status === "DRAFT" ? orderQuoteLines(lines) : lines }
          : null,
      };
    });
  }
}
