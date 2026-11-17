import { sha256 } from "./fingerprints";
import { changedComparisonSources, savedSources } from "./comparison-source-changes";
import { RunComparableProjectAnalysis } from "./run-comparable-project-analysis";
import type { Stage4ComparisonResult } from "../domain/contracts";
import type {
  ChangedComparisonSource,
  ComparisonFreshness,
  ComparisonFreshnessReader,
} from "../domain/freshness";
import { RunHistoricalEconomicsEnrichment } from "@/modules/economics/application/run-historical-economics-enrichment";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparableProjectRepositoryPort } from "@/repositories/ports/comparable-project-repository";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";
import type { EconomicsObservationRepositoryPort } from "@/repositories/ports/economics-observation-repository";
import type { EvidencePanelRepositoryPort } from "@/repositories/ports/evidence-panel-repository";
import type { ProjectRepositoryPort } from "@/repositories/ports/project-repository";

/** Replays the existing deterministic calculations into non-writing ports.
 * Stored results stay immutable. This is presentation evidence, never authorization
 * for a write: preparation and confirmation still independently recheck material.
 */
export class GetComparisonFreshness implements ComparisonFreshnessReader {
  constructor(
    private readonly projects: ProjectRepositoryPort,
    private readonly candidates: ComparableProjectRepositoryPort,
    private readonly comparisons: ComparisonRunRepositoryPort,
    private readonly observations: EconomicsObservationRepositoryPort,
    private readonly economics: EconomicsEnrichmentRunRepositoryPort,
    private readonly evidence: EvidencePanelRepositoryPort,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async check(
    runtime: RuntimeContext,
    comparison: Stage4ComparisonResult,
    economics: Stage5EconomicsResult | null,
  ): Promise<ComparisonFreshness> {
    const outcome = (
      state: ComparisonFreshness["state"],
      changedSources: readonly ChangedComparisonSource[] = [],
    ): ComparisonFreshness => ({
      comparisonRunId: comparison.run.id,
      ...(economics ? { enrichmentRunId: economics.run.id } : {}),
      state,
      changedSources,
    });
    try {
      if (economics && economics.run.comparisonRunId !== comparison.run.id)
        return outcome("UNVERIFIED");
      // Use original generation times/IDs so elapsed time alone cannot alter the
      // immutable ranking. Explicit source expiry is checked against today's clock.
      const currentComparison = await new RunComparableProjectAnalysis(
        this.projects,
        this.candidates,
        {
          persistComplete: async () => undefined,
          getAuthorizedResult: (context, id) => this.comparisons.getAuthorizedResult(context, id),
        },
        undefined,
        () => new Date(comparison.run.generatedAt),
        (prefix) => (prefix === "cmprun" ? comparison.run.id : "freshness_read_only"),
      ).execute(runtime, comparison.activeContext.projectKey);
      if (currentComparison.kind === "FAILED" || currentComparison.kind === "UNAVAILABLE")
        return outcome("UNVERIFIED");
      let stale =
        currentComparison.kind !== "COMPLETE" ||
        sha256(currentComparison.result) !== sha256(comparison);
      if (!economics) return outcome(stale ? "STALE" : "CURRENT");

      const currentEconomics = await new RunHistoricalEconomicsEnrichment(
        this.comparisons,
        this.observations,
        {
          persistComplete: async () => undefined,
          getAuthorizedResult: (context, id) => this.economics.getAuthorizedResult(context, id),
        },
        undefined,
        () => new Date(economics.run.generatedAt),
        () => economics.run.id,
      ).execute(runtime, comparison.run.id, economics.selectedProjectKeys);
      if (!("result" in currentEconomics)) return outcome("UNVERIFIED");
      stale ||= sha256(currentEconomics.result) !== sha256(economics);

      const previousSources = savedSources(economics);
      const resolved = await this.evidence.getAuthorizedSources(runtime, comparison.run.id, [
        ...previousSources.keys(),
      ]);
      // No old source names/details survive a denied current read.
      if (resolved.kind !== "COMPLETE") return outcome("UNVERIFIED");
      if (resolved.sources.length !== previousSources.size) return outcome("UNVERIFIED");
      const changed = changedComparisonSources(
        comparison.run.id,
        economics,
        currentEconomics.result,
        resolved.sources,
        this.clock(),
      );
      stale ||= changed.length > 0;
      return outcome(stale ? "STALE" : "CURRENT", changed);
    } catch {
      return outcome("UNVERIFIED");
    }
  }
}
