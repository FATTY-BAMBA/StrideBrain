import type { ProjectRepositoryPort } from "@/repositories/ports/project-repository";
import type { ActiveProjectContextService } from "@/modules/comparisons/application/active-project-context-service";
import { permissionFingerprint } from "@/modules/comparisons/application/fingerprints";
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
export type HomeComparisonOutcome =
  | (HomeComparison & Readonly<{ kind: "AVAILABLE" }>)
  | Readonly<{ kind: "OUT_OF_DATE" | "UNAVAILABLE" }>;
/** Reopen the same stored results as comparison; never run ranking/calculations for a Home read. */
export class GetHomeComparison {
  constructor(
    private readonly projects: ProjectRepositoryPort,
    private readonly latest: LatestProjectComparisonRepositoryPort,
    private readonly comparisons: ComparisonRunRepositoryPort,
    private readonly economics: EconomicsEnrichmentRunRepositoryPort,
    private readonly activeContext: Pick<ActiveProjectContextService, "resolve">,
  ) {}
  async execute(
    context: RuntimeContext,
    projectKey: string,
  ): Promise<HomeComparisonOutcome | null> {
    if (!context.capabilities.has("project:compare")) return null;
    const project = await this.projects.getAuthorizedByBusinessKey(context, projectKey);
    if (
      !project ||
      project.organizationId !== context.organizationId ||
      !new AuthorizationService().canRunComparison(context, project.id).allowed
    )
      return null;
    const projectId = project.id;
    const ids = await this.latest.findLatest(context, projectId);
    if (!ids) return null;
    const comparison = await this.comparisons.getAuthorizedResult(context, ids.comparisonRunId);
    if (!comparison) return null;
    if (
      comparison.activeContext.projectKey !== projectKey ||
      comparison.activeContext.permissionFingerprint !== permissionFingerprint(context, projectId)
    )
      return { kind: "OUT_OF_DATE" };
    const current = await this.activeContext.resolve(context, projectId);
    if (!current) return { kind: "UNAVAILABLE" };
    if (
      comparison.activeContext.sourceFingerprint !== current.context.sourceFingerprint ||
      comparison.activeContext.relatedTypeFingerprint !== current.context.relatedTypeFingerprint
    )
      return { kind: "OUT_OF_DATE" };
    const economics = ids.enrichmentRunId
      ? await this.economics.getAuthorizedResult(context, ids.enrichmentRunId)
      : null;
    return {
      kind: "AVAILABLE",
      comparison,
      ...(economics?.run.comparisonRunId === comparison.run.id ? { economics } : {}),
    };
  }
}
