import { AuthorizationService } from "@/modules/authorization/authorization-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type { LatestProjectComparisonRepositoryPort } from "@/repositories/ports/latest-project-comparison-repository";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";
export type HomeComparison = Readonly<{
  comparison: Stage4ComparisonResult;
  economics?: Stage5EconomicsResult | undefined;
}>;
/** Reopen the same stored results as comparison; never run ranking/calculations for a Home read. */
export class GetHomeComparison {
  constructor(
    private readonly latest: LatestProjectComparisonRepositoryPort,
    private readonly comparisons: ComparisonRunRepositoryPort,
    private readonly economics: EconomicsEnrichmentRunRepositoryPort,
  ) {}
  async execute(context: RuntimeContext, projectId: string): Promise<HomeComparison | null> {
    if (!new AuthorizationService().canRunComparison(context, projectId).allowed) return null;
    const ids = await this.latest.findLatest(context, projectId);
    if (!ids) return null;
    const comparison = await this.comparisons.getAuthorizedResult(context, ids.comparisonRunId);
    if (!comparison) return null;
    const economics = ids.enrichmentRunId
      ? await this.economics.getAuthorizedResult(context, ids.enrichmentRunId)
      : null;
    return {
      comparison,
      ...(economics?.run.comparisonRunId === comparison.run.id ? { economics } : {}),
    };
  }
}
