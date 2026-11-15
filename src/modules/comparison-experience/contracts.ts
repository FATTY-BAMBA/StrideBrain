import type { MatchBand, SimilarityFactorKey } from "@/modules/comparisons/domain/contracts";
import type { Locale } from "@/modules/localization/config";

export const COMPARISON_EXPERIENCE_VERSION = "comparison-experience.v1" as const;

export type ComparisonCellState =
  | "VALUE"
  | "INSUFFICIENT"
  | "RESTRICTED"
  | "UNAVAILABLE"
  | "STALE"
  | "CONFLICTED"
  | "NOT_APPLICABLE";

export type ComparisonNoticeTone = "NEUTRAL" | "POSITIVE" | "CAUTION" | "CRITICAL";

export type ComparisonFactorView = Readonly<{
  factorKey: SimilarityFactorKey;
  label: string;
  state: "KNOWN" | "UNKNOWN";
  valueLabel: string;
  contributionLabel?: string | undefined;
}>;

export type ComparableProjectCardView = Readonly<{
  projectKey: string;
  name: string;
  rank: number;
  scoreLabel: string;
  band: MatchBand;
  bandLabel: string;
  evidenceCoverageLabel: string;
  locationLabel: string;
  areaLabel: string;
  completionLabel: string;
  strongestFactors: readonly ComparisonFactorView[];
  differences: readonly ComparisonFactorView[];
  unknowns: readonly ComparisonFactorView[];
  quotedHistoryAvailable: boolean;
  actualHistoryAvailable: boolean;
  warningLabels: readonly string[];
}>;

export type ComparisonTableCellView = Readonly<{
  state: ComparisonCellState;
  primary: string;
  secondary?: string | undefined;
  claimKey?: string | undefined;
  tone: ComparisonNoticeTone;
}>;

export type ComparisonTableColumnView = Readonly<{
  key: string;
  label: string;
  kind: "ACTIVE" | "COMPARABLE";
}>;

export type ComparisonTableRowView = Readonly<{
  key: string;
  label: string;
  cells: Readonly<Record<string, ComparisonTableCellView>>;
}>;

export type ComparisonTableSectionView = Readonly<{
  key: string;
  label: string;
  rows: readonly ComparisonTableRowView[];
}>;

export type ComparisonSynthesisItemView = Readonly<{
  key: string;
  title: string;
  body: string;
  tone: ComparisonNoticeTone;
  claimKey?: string | undefined;
}>;

export type ComparisonExperienceView = Readonly<{
  version: typeof COMPARISON_EXPERIENCE_VERSION;
  locale: Locale;
  route: Readonly<{
    projectKey: string;
    comparisonRunId: string;
    economicsRunId?: string | undefined;
    selectedProjectKeys: readonly string[];
  }>;
  heading: Readonly<{
    eyebrow: string;
    title: string;
    description: string;
  }>;
  summary: Readonly<{
    generatedAtLabel: string;
    policyLabel: string;
    authorizedMatchCountLabel: string;
    selectedCountLabel: string;
    economicsStateLabel: string;
    syntheticDataLabel: string;
  }>;
  activeProject: Readonly<{
    projectKey: string;
    name: string;
    subtypeLabel: string;
    areaLabel: string;
    locationLabel: string;
    quoteVersionLabel?: string | undefined;
  }>;
  cards: readonly ComparableProjectCardView[];
  initialSelectedProjectKeys: readonly string[];
  maximumSelectedProjects: 3;
  table: Readonly<{
    columns: readonly ComparisonTableColumnView[];
    sections: readonly ComparisonTableSectionView[];
  }>;
  synthesis: Readonly<{
    history: readonly ComparisonSynthesisItemView[];
    differences: readonly ComparisonSynthesisItemView[];
    gaps: readonly ComparisonSynthesisItemView[];
    recommendation: ComparisonSynthesisItemView;
  }>;
  notices: readonly ComparisonSynthesisItemView[];
}>;

export type ComparisonExperienceOutcome =
  | Readonly<{ kind: "READY"; view: ComparisonExperienceView }>
  | Readonly<{
      kind: "SESSION_REQUIRED";
      requestId?: string | undefined;
    }>
  | Readonly<{
      kind: "START";
      projectKey: string;
    }>
  | Readonly<{
      kind: "CONTEXT_INCOMPLETE";
      requestId: string;
      missingFields: readonly string[];
    }>
  | Readonly<{
      kind: "NO_ELIGIBLE_HISTORY";
      requestId: string;
    }>
  | Readonly<{
      kind: "UNAVAILABLE";
      requestId: string;
    }>
  | Readonly<{
      kind: "FAILED";
      requestId: string;
    }>;
