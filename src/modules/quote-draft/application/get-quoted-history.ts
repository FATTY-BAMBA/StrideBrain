import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { HistoricalEconomicsService } from "@/modules/economics/domain/historical-economics-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { QuoteDraftRepositoryPort } from "@/repositories/ports/quote-draft-repository";
/** Read the same price basis as Prepare, without a draft capability, signing or mutation. */
export class GetQuotedHistory {
  constructor(
    private readonly repository: QuoteDraftRepositoryPort,
    private readonly clock = () => new Date(),
  ) {}
  async execute(context: RuntimeContext, key: string) {
    if (!context.capabilities.has("quote:read") || !context.capabilities.has("evidence:read"))
      return { kind: "UNAVAILABLE" as const };
    return this.repository.transaction(async (tx) => {
      const job = await tx.getJob(context, key);
      if (!job || !new AuthorizationService().canRunComparison(context, job.id).allowed)
        return { kind: "UNAVAILABLE" as const };
      const saved = await tx.getComparison(context, job);
      if (!saved) return { kind: "NO_RECORDS" as const };
      if (saved.kind !== "AVAILABLE") return saved;
      const batch = await tx.loadBatch(context, saved);
      if (!batch || batch.activeProjectId !== job.id || batch.accessScope === "STRUCTURAL_ONLY")
        return { kind: "UNAVAILABLE" as const };
      const now = this.clock().toISOString();
      const baselines = new HistoricalEconomicsService().quotedHistoryBaselines(
        { stage4: saved.comparison, batch, generatedAt: now, snapshotDate: now.slice(0, 10) },
        job.commercialCategoryIds,
      );
      const ids = [...new Set(baselines.flatMap((b) => b.history.evidenceReferenceIds ?? []))];
      if (
        ids.length &&
        (await tx.getSources(context, saved.comparison.run.id, ids)).kind !== "COMPLETE"
      )
        return { kind: "UNAVAILABLE" as const };
      return {
        kind: "AVAILABLE" as const,
        job,
        baselines,
        comparisonRunId: saved.comparison.run.id,
        projectKeys: batch.projects
          .filter((p) => batch.selectedProjectIds.includes(p.internalId))
          .map((p) => p.businessKey),
      };
    });
  }
}
