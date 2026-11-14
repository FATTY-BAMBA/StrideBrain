import type {
  ComparisonProjectProfile,
  DataClassification,
} from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export type ActiveComparisonProfileRecord = Readonly<{
  profile: ComparisonProjectProfile;
  activeQuoteVersionId?: string | undefined;
}>;

export type HistoricalCandidateQueryDiagnostics = Readonly<{
  databaseQueries: number;
  authorizedRowsReturned: number;
  maximumRows: number;
}>;

export type HistoricalCandidateBatch = Readonly<{
  profiles: readonly ComparisonProjectProfile[];
  diagnostics: HistoricalCandidateQueryDiagnostics;
}>;

export interface ComparableProjectRepositoryPort {
  /**
   * Load the already-authorized active project context. The repository still
   * applies the trusted organization boundary and returns no financial values.
   */
  getActiveComparisonProfile(
    context: RuntimeContext,
    projectId: string,
  ): Promise<ActiveComparisonProfileRecord | null>;

  /**
   * Return only historical project metadata authorized for comparison under
   * the current organization policy. Unauthorized/cross-organization records
   * must be absent before this batch reaches the scoring service.
   */
  listAuthorizedHistoricalProfiles(
    context: RuntimeContext,
    activeProjectId: string,
  ): Promise<HistoricalCandidateBatch>;
}

export function allowedHistoricalClassifications(
  context: RuntimeContext,
): readonly DataClassification[] {
  if (context.role === "VIEWER") {
    return Object.freeze(["DEMO_SYNTHETIC", "PUBLIC_REFERENCE", "TENANT_APPROVED"]);
  }
  return Object.freeze([
    "DEMO_SYNTHETIC",
    "PUBLIC_REFERENCE",
    "TENANT_PRIVATE",
    "TENANT_APPROVED",
  ]);
}
