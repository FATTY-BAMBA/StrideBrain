import type { RuntimeContext } from "@/modules/runtime-context/contracts";
export type LatestProjectComparison = Readonly<{
  comparisonRunId: string;
  enrichmentRunId?: string | undefined;
}>;
export interface LatestProjectComparisonRepositoryPort {
  findLatest(context: RuntimeContext, projectId: string): Promise<LatestProjectComparison | null>;
}
