import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { HistoricalEconomicsService } from "@/modules/economics/domain/historical-economics-service";
import { ClosedJobEconomicsService } from "@/modules/economics/domain/closed-job-economics-service";
import { basisSourceIds, prepareDraftPolicy } from "@/modules/quote-draft/domain/draft-policy";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  DraftPreparation,
  DraftPreparationCodec,
  QuoteDraftRepositoryPort,
} from "@/repositories/ports/quote-draft-repository";
export type PrepareDraftOutcome =
  | Readonly<{ kind: "PREPARED"; preparation: DraftPreparation; token: string }>
  | Readonly<{ kind: "UNAVAILABLE" | "NO_COMPARISON" | "OUT_OF_DATE" | "BASIS_UNAVAILABLE" }>;
export class PrepareQuoteDraft {
  constructor(
    private readonly repository: QuoteDraftRepositoryPort,
    private readonly codec: DraftPreparationCodec,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async execute(context: RuntimeContext, projectKey: string): Promise<PrepareDraftOutcome> {
    if (!context.capabilities.has("quote:draft") || !context.capabilities.has("quote:read"))
      return { kind: "UNAVAILABLE" };
    return this.repository.transaction(async (tx) => {
      const job = await tx.getJob(context, projectKey);
      if (
        !job ||
        job.organizationId !== context.organizationId ||
        !new AuthorizationService().canRunComparison(context, job.id).allowed
      )
        return { kind: "UNAVAILABLE" };
      const comparison = await tx.getComparison(context, job);
      if (!comparison) return { kind: "NO_COMPARISON" };
      if (comparison.kind !== "AVAILABLE") return { kind: comparison.kind };
      if (
        !comparison.comparison.activeContext.sourceFingerprint ||
        !comparison.comparison.activeContext.permissionFingerprint
      )
        return { kind: "OUT_OF_DATE" };
      const batch = await tx.loadBatch(context, comparison);
      if (!batch || batch.accessScope === "STRUCTURAL_ONLY" || batch.activeProjectId !== job.id)
        return { kind: "UNAVAILABLE" };
      const calculatedAt = this.now().toISOString();
      const suggestions = prepareDraftPolicy({
        job,
        calculatedAt,
        selectedProjectCount: batch.selectedProjectIds.length,
        baselines: new HistoricalEconomicsService().quotedHistoryBaselines(
          {
            stage4: comparison.comparison,
            batch,
            generatedAt: calculatedAt,
            snapshotDate: calculatedAt.slice(0, 10),
          },
          job.commercialCategoryIds,
        ),
        differences: new ClosedJobEconomicsService().selectedCategoryDifferences(
          batch,
          calculatedAt.slice(0, 10),
        ),
      });
      const ids = [...new Set(suggestions.flatMap((line) => basisSourceIds(line.basis)))];
      if (
        ids.length &&
        (await tx.getSources(context, comparison.comparison.run.id, ids)).kind !== "COMPLETE"
      )
        return { kind: "BASIS_UNAVAILABLE" };
      const saved = await tx.getSaved(context, job);
      const preparation: DraftPreparation = {
        organizationId: context.organizationId,
        membershipId: context.membershipId,
        projectId: job.id,
        baseVersionId: saved?.id ?? null,
        comparisonRunId: comparison.comparison.run.id,
        sourceFingerprint: comparison.comparison.activeContext.sourceFingerprint,
        permissionFingerprint: comparison.comparison.activeContext.permissionFingerprint,
        calculatedAt,
        suggestions,
      };
      return { kind: "PREPARED", preparation, token: this.codec.seal(preparation) };
    });
  }
}
