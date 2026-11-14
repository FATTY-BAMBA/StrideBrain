import type {
  PersistCompleteComparisonInput,
  Stage4ComparisonResult,
} from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export interface ComparisonRunRepositoryPort {
  /** Persist the IntelligenceRun, ComparisonRun, candidates and factors atomically. */
  persistComplete(input: PersistCompleteComparisonInput): Promise<void>;

  /**
   * Reauthorize every read against the current RuntimeContext. Missing,
   * inaccessible and cross-organization run IDs return null identically.
   */
  getAuthorizedResult(
    context: RuntimeContext,
    comparisonRunId: string,
  ): Promise<Stage4ComparisonResult | null>;
}
