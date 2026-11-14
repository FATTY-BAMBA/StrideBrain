import type { DataMode, Role } from "@/modules/runtime-context/contracts";

export type ProjectWorkspaceState =
  | "READY"
  | "PARTIAL"
  | "UNAVAILABLE"
  | "PERMISSION_RESTRICTED"
  | "CONFLICTED"
  | "STALE";

export type ProjectWorkspaceWarningCode =
  | "PROJECT_CONTEXT_PARTIAL"
  | "PROJECT_MANAGER_UNRECORDED"
  | "QUOTE_UNAVAILABLE"
  | "FORECAST_UNAVAILABLE"
  | "ACTUAL_UNAVAILABLE"
  | "QUOTE_RESTRICTED"
  | "FORECAST_RESTRICTED"
  | "ACTUAL_RESTRICTED"
  | "EVIDENCE_RESTRICTED"
  | "EVIDENCE_PARTIAL"
  | "EVIDENCE_STALE"
  | "EVIDENCE_CONFLICT"
  | "SUPPLIER_OFFER_STALE";

export type ObservationType =
  | "QUOTED_PRICE"
  | "SUPPLIER_OFFER"
  | "FORECAST_DIRECT_COST"
  | "RECONCILED_ACTUAL_COST";

export type AuthorityState =
  | "OBSERVED"
  | "HUMAN_REVIEWED"
  | "APPROVED_COMMERCIAL"
  | "RECONCILED_ACTUAL"
  | "SUPERSEDED"
  | "CONFLICTED";

export type LocalizedNameDTO = Readonly<{
  en: string;
  zhTw: string;
  display: string;
}>;

export type MoneyDTO = Readonly<{
  amount: string;
  currency: string;
}>;

export type QuantityDTO = Readonly<{
  value: string;
  unit: string;
}>;

export type CommercialObservationDTO =
  | Readonly<{
      state: "VALUE";
      recordKey: string;
      versionNumber: number;
      observationType: ObservationType;
      authorityState: AuthorityState;
      money: MoneyDTO;
      effectiveAt?: string | undefined;
      validUntil?: string | undefined;
      freshness: "CURRENT" | "HISTORICAL" | "STALE";
      warningCodes: readonly ProjectWorkspaceWarningCode[];
    }>
  | Readonly<{
      state: "CONFLICTED";
      recordKey: string;
      versionNumber: number;
      observationType: ObservationType;
      authorityState: "CONFLICTED";
      warningCodes: readonly ["EVIDENCE_CONFLICT"];
    }>
  | Readonly<{
      state: "RESTRICTED";
      observationType: ObservationType;
      warningCodes: readonly ProjectWorkspaceWarningCode[];
    }>
  | Readonly<{
      state: "UNAVAILABLE";
      observationType: ObservationType;
      warningCodes: readonly ProjectWorkspaceWarningCode[];
    }>;

export type EvidenceHealthDTO = Readonly<{
  state: "GOOD" | "PARTIAL" | "INSUFFICIENT" | "CONFLICTED" | "RESTRICTED";
  accessibleReferenceCount?: number | undefined;
  accessibleDocumentCount?: number | undefined;
  staleCount?: number | undefined;
  openConflictCount?: number | undefined;
  labelKey: string;
}>;

export type EvidenceSummaryDTO = Readonly<{
  referenceKey: string;
  claimKey: string;
  sourceType: string;
  sourceKey?: string | undefined;
  sourceVersion?: string | undefined;
  sourceName?: LocalizedNameDTO | undefined;
  authorityState: AuthorityState;
  observationType?: ObservationType | undefined;
  effectiveAt?: string | undefined;
  staleAt?: string | undefined;
  condition: "CURRENT" | "STALE" | "CONFLICTED";
}>;

export type RelatedSupplierDTO = Readonly<{
  businessKey: string;
  name: LocalizedNameDTO;
  categoryId: string;
  relationship: string;
}>;

export type RelatedMaterialDTO = Readonly<{
  businessKey: string;
  name: LocalizedNameDTO;
  categoryId: string;
  relationship: string;
}>;

export type SupplierOfferSummaryDTO = Readonly<{
  recordKey: string;
  supplier: LocalizedNameDTO;
  authorityState: AuthorityState;
  offeredAt: string;
  validUntil?: string | undefined;
  freshness: "CURRENT" | "HISTORICAL" | "STALE";
  money: MoneyDTO;
}>;

export type ActionSummaryDTO = Readonly<{
  actionKey: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate?: string | undefined;
}>;

export type ProjectWorkspacePermissionDTO = Readonly<{
  role: Role;
  canRunComparison: boolean;
  canReadQuote: boolean;
  canReadForecast: boolean;
  canReadActual: boolean;
  canReadEvidence: boolean;
  canProposeInternalReview: boolean;
  canCreateInternalReview: boolean;
  canAssignInternalReview: boolean;
}>;

export type SuggestedQuestionDTO = Readonly<{
  id: string;
  labelKey: string;
  promptEn: string;
  promptZhTw: string;
}>;

export type ProjectWorkspaceDTO = Readonly<{
  version: "project-workspace.v1";
  state: Exclude<ProjectWorkspaceState, "UNAVAILABLE">;
  warnings: readonly ProjectWorkspaceWarningCode[];
  dataMode: DataMode;
  project: Readonly<{
    id: string;
    businessKey: string;
    name: LocalizedNameDTO;
    clientName: LocalizedNameDTO;
    status: string;
    stage: string;
    comparisonClass: string;
    subtype: string;
    location: Readonly<{
      country: "TW";
      city: string;
      district?: string | undefined;
      display: string;
    }>;
    area: QuantityDTO;
    programmeWeeks?: string | undefined;
    targetHandover?: string | undefined;
    manager?: LocalizedNameDTO | undefined;
    scopeCategories: ReadonlyArray<
      Readonly<{
        categoryId: string;
        name: LocalizedNameDTO;
        authorityState: AuthorityState;
      }>
    >;
    demoData: boolean;
    dataClassification: string;
  }>;
  commercial: Readonly<{
    activeQuote: CommercialObservationDTO;
    activeForecast: CommercialObservationDTO;
    reconciledActual: CommercialObservationDTO;
    supplierOffers: readonly SupplierOfferSummaryDTO[];
  }>;
  evidenceHealth: EvidenceHealthDTO;
  evidence: readonly EvidenceSummaryDTO[];
  suppliers: readonly RelatedSupplierDTO[];
  materials: readonly RelatedMaterialDTO[];
  openActions: readonly ActionSummaryDTO[];
  permissions: ProjectWorkspacePermissionDTO;
  suggestedQuestions: readonly SuggestedQuestionDTO[];
}>;

export type ProjectWorkspaceOutcome =
  | Readonly<{
      kind: "AVAILABLE";
      workspace: ProjectWorkspaceDTO;
    }>
  | Readonly<{
      kind: "UNAVAILABLE";
      errorCode: "PROJECT_UNAVAILABLE";
      requestId: string;
    }>;

export type ProjectWorkspaceStateSignals = Readonly<{
  hasConflict: boolean;
  hasStaleEvidence: boolean;
  hasPartialData: boolean;
  hasRestrictedSections: boolean;
}>;

/**
 * Precedence is intentionally deterministic and based only on information the
 * caller is authorized to receive.
 */
export function determineProjectWorkspaceState(
  signals: ProjectWorkspaceStateSignals,
): Exclude<ProjectWorkspaceState, "UNAVAILABLE"> {
  if (signals.hasConflict) return "CONFLICTED";
  if (signals.hasStaleEvidence) return "STALE";
  if (signals.hasPartialData) return "PARTIAL";
  if (signals.hasRestrictedSections) return "PERMISSION_RESTRICTED";
  return "READY";
}
