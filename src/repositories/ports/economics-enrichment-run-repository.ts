import type {
  PersistStage5EconomicsInput,
  Stage5EconomicsResult,
} from "@/modules/economics/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export interface EconomicsEnrichmentRunRepositoryPort {
  /** Persist the enrichment snapshot, observation decisions, and claims atomically. */
  persistComplete(input: PersistStage5EconomicsInput): Promise<void>;

  /**
   * Reauthorize every reopen against the current RuntimeContext. Missing,
   * inaccessible, and cross-organization identifiers return null identically.
   */
  getAuthorizedResult(
    context: RuntimeContext,
    enrichmentRunId: string,
  ): Promise<Stage5EconomicsResult | null>;
}
