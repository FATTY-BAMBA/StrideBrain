import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";

export class GetHistoricalEconomicsEnrichment {
  constructor(private readonly runs: EconomicsEnrichmentRunRepositoryPort) {}

  execute(context: RuntimeContext, enrichmentRunId: string): Promise<Stage5EconomicsResult | null> {
    return this.runs.getAuthorizedResult(context, enrichmentRunId);
  }
}
