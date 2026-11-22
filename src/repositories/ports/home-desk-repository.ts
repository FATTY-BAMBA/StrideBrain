import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ClosedJobFinancials } from "@/modules/economics/domain/closed-job-economics-service";
import type { ProjectListRecord, ProjectListRepositoryPort } from "./project-list-repository";

export type HomeDecisionSource =
  | Readonly<{
      kind: "PREPARED_REVIEW";
      organizationId: string;
      projectId: string;
      membershipId: string;
      key: string;
      comparisonRunId: string;
      enrichmentRunId: string;
      expiresAt: string;
    }>
  | Readonly<{ kind: "DRAFT_QUOTE"; organizationId: string; projectId: string; key: string }>;
export type ClosedJobRecord = ProjectListRecord &
  Readonly<{
    completedAt: string;
    financials?: ClosedJobFinancials | undefined;
  }>;
export interface HomeDeskRepositoryPort extends ProjectListRepositoryPort {
  /** Single extension point for decision sources from shipped workflows only. */
  listDecisionSources(
    context: RuntimeContext,
    projectIds: readonly string[],
    now: Date,
  ): Promise<readonly HomeDecisionSource[]>;
  listComparedProjectIds(
    context: RuntimeContext,
    projectIds: readonly string[],
  ): Promise<readonly string[]>;
  listClosedJobs(
    context: RuntimeContext,
    projectIds: readonly string[],
  ): Promise<readonly ClosedJobRecord[]>;
}
