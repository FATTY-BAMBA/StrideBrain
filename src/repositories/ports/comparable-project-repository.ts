import type {
  ComparisonProjectProfile,
  DataClassification,
} from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export type ActiveComparisonProfileRecord = Readonly<{
  profile: ComparisonProjectProfile;
  activeQuoteVersionId?: string | undefined;
  activeQuoteVersionKey?: string | undefined;
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

/**
 * Classifications that may be compared across the organization without a
 * project assignment. `TENANT_APPROVED` means the organization explicitly
 * published the record into its comparison library. Demo fixtures use the
 * same seam without becoming private customer data.
 */
export function organizationComparisonLibraryClassifications(): readonly DataClassification[] {
  return Object.freeze(["DEMO_SYNTHETIC", "PUBLIC_REFERENCE", "TENANT_APPROVED"]);
}

/** Admin and Financial Reviewer may receive organization-private history by policy. */
export function hasOrganizationWidePrivateHistory(context: RuntimeContext): boolean {
  return context.role === "ORGANIZATION_ADMIN" || context.role === "FINANCIAL_REVIEWER";
}

/**
 * The active project has already passed `canRunComparison`; its private
 * metadata may therefore be loaded for the current workspace. Restricted
 * records remain outside v0.1.
 */
export function allowedActiveProjectClassifications(): readonly DataClassification[] {
  return Object.freeze(["DEMO_SYNTHETIC", "PUBLIC_REFERENCE", "TENANT_PRIVATE", "TENANT_APPROVED"]);
}
