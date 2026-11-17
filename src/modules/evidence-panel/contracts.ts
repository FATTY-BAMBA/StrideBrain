import type { ComparisonFreshness } from "@/modules/comparisons/domain/freshness";
import type { SimilarityFactorKey } from "@/modules/comparisons/domain/contracts";
import type { AuthorityState, ObservationType } from "@/modules/projects/domain/project-workspace";
import type { Locale } from "@/modules/localization/config";

export const EVIDENCE_PANEL_VERSION = "evidence-panel.v1" as const;

export type EvidencePanelMode = "CLAIM" | "FACTOR" | "SOURCE" | "CONFLICT";

export type EvidencePanelSelection =
  | Readonly<{
      mode: "CLAIM";
      comparisonRunId: string;
      enrichmentRunId: string;
      claimKey: string;
    }>
  | Readonly<{
      mode: "FACTOR";
      comparisonRunId: string;
      candidateProjectKey: string;
      factorKey: SimilarityFactorKey;
    }>
  | Readonly<{
      mode: "SOURCE";
      comparisonRunId: string;
      enrichmentRunId?: string | undefined;
      sourceKey: string;
      claimKey?: string | undefined;
      candidateProjectKey?: string | undefined;
      factorKey?: SimilarityFactorKey | undefined;
    }>
  | Readonly<{
      mode: "CONFLICT";
      comparisonRunId: string;
      enrichmentRunId?: string | undefined;
      conflictKey: string;
      sourceKey?: string | undefined;
      claimKey?: string | undefined;
      candidateProjectKey?: string | undefined;
      factorKey?: SimilarityFactorKey | undefined;
    }>;

export type EvidencePanelCondition =
  "CURRENT" | "HISTORICAL" | "STALE" | "SUPERSEDED" | "CONFLICTED" | "INSUFFICIENT" | "RESTRICTED";

export type EvidencePreviewView =
  | Readonly<{
      state: "STRUCTURED";
      fields: readonly Readonly<{ label: string; value: string }>[];
    }>
  | Readonly<{
      state: "UNSUPPORTED" | "UNAVAILABLE" | "RESTRICTED";
      message: string;
    }>;

export type EvidencePanelSourceView = Readonly<{
  sourceKey: string;
  title: string;
  objectTypeLabel: string;
  versionLabel?: string | undefined;
  projectLabel?: string | undefined;
  effectiveDateLabel?: string | undefined;
  locatorLabel: string;
  authorityState: AuthorityState;
  authorityLabel: string;
  observationType?: ObservationType | undefined;
  observationTypeLabel?: string | undefined;
  dataClassificationLabel: string;
  supportedValueLabel?: string | undefined;
  conditions: readonly EvidencePanelCondition[];
  conditionLabels: readonly string[];
  conflictKeys: readonly string[];
  preview: EvidencePreviewView;
  sourceSelection: EvidencePanelSelection;
}>;

export type EvidenceFinancialTraceView = Readonly<{
  kind: "FINANCIAL";
  operation: string;
  operationLabel: string;
  aggregationLabel: string;
  roundingLabel: string;
  policyDescription: string;
  calculationVersion: string;
  aggregation: string;
  rounding: string;
  generatedAtLabel: string;
  inputs: readonly Readonly<{
    projectKey: string;
    projectLabel: string;
    sourceCountLabel: string;
    observationType?: ObservationType | undefined;
    observationLabel?: string | undefined;
    normalizedValueLabel: string;
    sourceCount: number;
  }>[];
  resultFields: readonly Readonly<{ label: string; value: string }>[];
}>;

export type EvidenceFactorTraceView = Readonly<{
  kind: "FACTOR";
  policyVersion: string;
  policyDescription: string;
  factorKey: SimilarityFactorKey;
  factorLabel: string;
  state: "KNOWN" | "UNKNOWN" | "NOT_APPLICABLE";
  stateLabel: string;
  normalizedValueLabel?: string | undefined;
  weightLabel: string;
  contributionLabel?: string | undefined;
  totalScoreLabel: string;
  evidenceCoverageLabel: string;
  explanationLabel: string;
}>;

export type EvidencePanelTraceView = EvidenceFinancialTraceView | EvidenceFactorTraceView;

export type EvidencePanelConflictView = Readonly<{
  conflictKey: string;
  statusLabel: string;
  impactLabel: string;
  records: readonly EvidencePanelSourceView[];
}>;

export type EvidencePanelView = Readonly<{
  version: typeof EVIDENCE_PANEL_VERSION;
  locale: Locale;
  mode: EvidencePanelMode;
  context: Readonly<{
    projectKey: string;
    projectName: string;
    comparisonRunId: string;
    enrichmentRunId?: string | undefined;
    snapshotLabel: string;
    stale: boolean;
    freshness: ComparisonFreshness;
  }>;
  heading: Readonly<{
    eyebrow: string;
    title: string;
    description: string;
  }>;
  claim?: Readonly<{
    claimKey: string;
    kindLabel: string;
    valueLabel?: string | undefined;
    observationTypeLabel?: string | undefined;
    authorityLabel?: string | undefined;
    sufficiencyLabel?: string | undefined;
    warningLabels: readonly string[];
  }>;
  factor?: Readonly<{
    candidateProjectKey: string;
    candidateProjectName: string;
  }>;
  selectedSourceKey?: string | undefined;
  relatedClaims?:
    readonly Readonly<{ claimKey: string; title: string; kindLabel: string }>[] | undefined;
  sources: readonly EvidencePanelSourceView[];
  trace?: EvidencePanelTraceView | undefined;
  conflict?: EvidencePanelConflictView | undefined;
  notices: readonly Readonly<{ tone: "NEUTRAL" | "CAUTION" | "CRITICAL"; text: string }>[];
  backSelection?: EvidencePanelSelection | undefined;
}>;

export type EvidencePanelOutcome =
  | Readonly<{ kind: "READY"; view: EvidencePanelView }>
  | Readonly<{ kind: "RESTRICTED"; requestId: string }>
  | Readonly<{ kind: "ACCESS_CHANGED"; requestId: string }>
  | Readonly<{ kind: "UNAVAILABLE"; requestId: string }>
  | Readonly<{ kind: "FAILED"; requestId: string }>;
