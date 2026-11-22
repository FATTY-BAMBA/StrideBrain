import type { Locale } from "@/modules/localization/config";
import type { QuoteTotals } from "@/modules/finance/quote-totals";
import type { DraftBasis, DraftJob } from "@/modules/quote-draft/domain/draft-policy";
import type { DraftLineInput } from "@/modules/quote-draft/domain/save-input";
type QuoteDraftJob = DraftJob &
  Readonly<{
    id: string;
    organizationId: string;
    businessKey: string;
    name: string;
    stage: string;
  }>;
type SavedDraft = Readonly<{
  id: string;
  quoteId: string;
  versionNumber: number;
  status: string;
  currency: string;
  totals: QuoteTotals;
  lines: readonly (DraftLineInput &
    Readonly<{
      id: string;
      recorded: { basis: DraftBasis; comparisonRunId: string } | null;
      enteredBy: string | null;
    }>)[];
}>;
import type { StructuredEconomicsClaimDTO } from "@/modules/economics/domain/contracts";

export type FirmDetails = Readonly<{
  legalNameEn: string;
  legalNameZhTw: string;
  taxId: string;
  addressEn: string;
  addressZhTw: string;
  phone: string;
  email: string;
  defaultValidityDays: number;
  termsEn: string;
  termsZhTw: string;
}>;
export type RequiredFirmField =
  "legalNameEn" | "legalNameZhTw" | "taxId" | "addressEn" | "addressZhTw" | "phone";
export const emptyFirmDetails: FirmDetails = Object.freeze({
  legalNameEn: "",
  legalNameZhTw: "",
  taxId: "",
  addressEn: "",
  addressZhTw: "",
  phone: "",
  email: "",
  defaultValidityDays: 30,
  termsEn: "",
  termsZhTw: "",
});
export type IssueOptions = Readonly<{
  language: Locale;
  validUntil?: string;
  attention: string;
  terms?: string;
}>;
export type QuoteDocumentSnapshot = Readonly<{
  schemaVersion: "QUOTE-DOCUMENT-1.0";
  language: Locale;
  firm: Readonly<{
    legalName: string;
    taxId: string;
    address: string;
    phone: string;
    email: string;
  }>;
  clientName: string;
  attention: string;
  projectName: string;
  projectKey: string;
  documentNumber: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  lines: readonly Readonly<{ categoryId: string; description: string; amount: string }>[];
  totals: QuoteTotals;
  terms: string;
}>;
export type IssueBlocker = "OPEN_CONFLICT" | "ZERO_LINE" | "FIRM_INCOMPLETE" | "DRAFT_NOT_CURRENT";
export type IssueWarning = "BASIS_OUT_OF_DATE" | "COMPARISON_OUT_OF_DATE" | "UNREVIEWED_FINDINGS";
export type LineConflict = Readonly<{
  categoryId: string;
  conflictKey: string;
  comparisonRunId: string;
}>;
export type IssueState = Readonly<{
  job: QuoteDraftJob;
  timezone: string;
  clientNameEn: string;
  clientNameZhTw: string;
  projectNameEn: string;
  projectNameZhTw: string;
  firm: FirmDetails | null;
  current: SavedDraft | null;
  descriptions: readonly Readonly<{ id: string; en: string; zh: string }>[];
  issuedCount: number;
  issued: Readonly<{
    id: string;
    status: string;
    documentNumber: string;
    validUntil: string;
    acceptedOn: string | null;
    snapshot: QuoteDocumentSnapshot;
  }> | null;
  sourceAccess: boolean;
  conflicts: readonly LineConflict[];
  basisOutOfDate: boolean;
  comparisonOutOfDate: boolean;
  findings: readonly StructuredEconomicsClaimDTO[];
  unreviewedFindings: boolean;
}>;
export type IssuePreparation = Readonly<{
  organizationId: string;
  membershipId: string;
  projectId: string;
  projectKey: string;
  versionId: string;
  fingerprint: string;
  preparedAt: string;
  options: IssueOptions;
  snapshot: QuoteDocumentSnapshot;
  blockers: readonly IssueBlocker[];
  missingFirmFields: readonly RequiredFirmField[];
  warnings: readonly IssueWarning[];
}>;
export type IssueReceipt = Readonly<{
  kind: "ISSUED" | "REVISED" | "ACCEPTED" | "RESOLVED" | "SETTINGS_SAVED";
  versionId?: string;
  documentNumber?: string;
}>;
export type IssueFailure = Readonly<{
  kind: "UNAVAILABLE" | "INVALID" | "CHANGED" | "CONFLICT";
  blockers?: readonly IssueBlocker[];
  missingFirmFields?: readonly RequiredFirmField[];
}>;
export type IssueOutcome = IssueReceipt | IssueFailure;
