import type { Stage4ComparisonResult } from "./contracts";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type { AuthorityState } from "@/modules/projects/domain/project-workspace";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export type SourceChangeReason =
  "AUTHORITY" | "SOURCE_DETAILS" | "SUPPORT" | "FRESHNESS" | "SUPERSEDED" | "UNAVAILABLE";

/** Names come only from a currently authorized source read, never a rejected snapshot. */
export type ChangedComparisonSource = Readonly<{
  sourceKey: string;
  titleEn: string;
  titleZhTw: string;
  projectNameEn: string;
  projectNameZhTw: string;
  previousAuthority: AuthorityState;
  currentAuthority: AuthorityState;
  reasons: readonly SourceChangeReason[];
}>;

export type ComparisonFreshness = Readonly<{
  comparisonRunId: string;
  enrichmentRunId?: string | undefined;
  state: "CURRENT" | "STALE" | "UNVERIFIED";
  changedSources: readonly ChangedComparisonSource[];
}>;

export interface ComparisonFreshnessReader {
  /** Inputs must already have passed the current authorized run readers. No persistence. */
  check(
    runtime: RuntimeContext,
    comparison: Stage4ComparisonResult,
    economics: Stage5EconomicsResult | null,
  ): Promise<ComparisonFreshness>;
}
