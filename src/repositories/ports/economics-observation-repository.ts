import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type { AuthorizedEconomicsBatch } from "@/modules/economics/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export interface EconomicsObservationRepositoryPort {
  /**
   * Load one bounded, organization-scoped economics snapshot for an already
   * authorized Stage 4 comparison run. Financial records that the current
   * RuntimeContext cannot read must be absent before domain aggregation.
   */
  loadAuthorizedBatch(
    context: RuntimeContext,
    comparisonRunId: string,
    stage4: Stage4ComparisonResult,
    selectedProjectKeys?: readonly string[],
  ): Promise<AuthorizedEconomicsBatch | null>;
}
