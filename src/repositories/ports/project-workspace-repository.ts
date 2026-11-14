import type {
  AuthorityState,
  ObservationType,
} from "@/modules/projects/domain/project-workspace";

export type EvidenceAccessLevel = "NON_SENSITIVE" | "AUTHORIZED";

export type ProjectWorkspaceBaseRecord = Readonly<{
  id: string;
  organizationId: string;
  businessKey: string;
  nameEn: string;
  nameZhTw: string;
  status: string;
  stage: string;
  comparisonClass: string;
  subtype: string;
  locationCity: string;
  locationDistrict: string | null;
  areaQuantity: string;
  areaUnit: string;
  currency: string;
  programmeWeeks: string | null;
  targetCompletionAt: Date | null;
  metadataAuthority: AuthorityState;
  dataClassification: string;
  client: Readonly<{
    businessKey: string;
    nameEn: string;
    nameZhTw: string;
  }>;
  manager: Readonly<{
    businessKey: string;
    nameEn: string;
    nameZhTw: string;
  }> | null;
  scopes: ReadonlyArray<
    Readonly<{
      categoryId: string;
      labelEn: string;
      labelZhTw: string;
      authorityState: AuthorityState;
    }>
  >;
  suppliers: ReadonlyArray<
    Readonly<{
      businessKey: string;
      nameEn: string;
      nameZhTw: string;
      categoryId: string;
      relationship: string;
    }>
  >;
  materials: ReadonlyArray<
    Readonly<{
      businessKey: string;
      nameEn: string;
      nameZhTw: string;
      categoryId: string;
      relationship: string;
    }>
  >;
}>;

export type CurrentQuoteRecord = Readonly<{
  quoteBusinessKey: string;
  versionId: string;
  versionNumber: number;
  status: string;
  observationType: "QUOTED_PRICE";
  authorityState: AuthorityState;
  currency: string;
  amountBeforeTax: string;
  validUntil: Date | null;
  approvedAt: Date | null;
}>;

export type CurrentForecastRecord = Readonly<{
  versionId: string;
  versionNumber: number;
  observationType: "FORECAST_DIRECT_COST";
  authorityState: AuthorityState;
  currency: string;
  totalDirectCost: string;
  effectiveAt: Date;
}>;

export type CurrentActualRecord = Readonly<{
  versionId: string;
  versionNumber: number;
  observationType: "RECONCILED_ACTUAL_COST";
  authorityState: AuthorityState;
  currency: string;
  totalDirectCost: string;
  reconciledAt: Date | null;
}>;

export type ProjectEvidenceRecord = Readonly<{
  evidenceReferenceId: string;
  subjectType: string;
  subjectId: string;
  claimKey: string;
  authorityState: AuthorityState;
  observationType: ObservationType | null;
  dataClassification: string;
  effectiveAt: Date | null;
  staleAt: Date | null;
  document: Readonly<{
    businessKey: string;
    titleEn: string;
    titleZhTw: string;
    documentType: string;
    versionLabel: string;
    versionAuthorityState: AuthorityState;
  }> | null;
}>;

export type ProjectEvidenceConflictRecord = Readonly<{
  conflictKey: string;
  primaryEvidenceId: string;
  conflictingEvidenceId: string;
}>;

export type ProjectSupplierOfferRecord = Readonly<{
  businessKey: string;
  authorityState: AuthorityState;
  observationType: "SUPPLIER_OFFER";
  currency: string;
  amountBeforeTax: string;
  offeredAt: Date;
  validUntil: Date | null;
  supplier: Readonly<{
    businessKey: string;
    nameEn: string;
    nameZhTw: string;
  }>;
}>;

export type ProjectActionRecord = Readonly<{
  id: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate: Date | null;
}>;

export interface ProjectWorkspaceRepositoryPort {
  getProjectContext(
    organizationId: string,
    projectId: string,
  ): Promise<ProjectWorkspaceBaseRecord | null>;

  getCurrentQuote(
    organizationId: string,
    projectId: string,
  ): Promise<CurrentQuoteRecord | null>;

  getCurrentForecast(
    organizationId: string,
    projectId: string,
  ): Promise<CurrentForecastRecord | null>;

  getCurrentActual(
    organizationId: string,
    projectId: string,
  ): Promise<CurrentActualRecord | null>;

  listEvidence(
    organizationId: string,
    projectId: string,
    access: EvidenceAccessLevel,
  ): Promise<readonly ProjectEvidenceRecord[]>;

  listOpenEvidenceConflicts(
    organizationId: string,
    evidenceReferenceIds: readonly string[],
  ): Promise<readonly ProjectEvidenceConflictRecord[]>;

  listSupplierOffers(
    organizationId: string,
    projectId: string,
  ): Promise<readonly ProjectSupplierOfferRecord[]>;

  listOpenActions(
    organizationId: string,
    projectId: string,
  ): Promise<readonly ProjectActionRecord[]>;
}
