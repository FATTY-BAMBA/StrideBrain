import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type { EvidenceConflictRecord } from "./evidence-panel-repository";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  DraftBasis,
  DraftJob,
  DraftSuggestion,
} from "@/modules/quote-draft/domain/draft-policy";
import type { DraftLineInput, SaveDraftInput } from "@/modules/quote-draft/domain/save-input";
import type { QuoteTotals } from "@/modules/finance/quote-totals";
import type { AuthorizedEconomicsBatch } from "@/modules/economics/domain/contracts";
import type { HomeComparisonOutcome } from "@/modules/home-intelligence/application/get-home-comparison";
import type { AuthorizedEvidenceSourcesResult } from "@/repositories/ports/evidence-panel-repository";

export type QuoteDraftJob = DraftJob &
  Readonly<{
    id: string;
    organizationId: string;
    businessKey: string;
    name: string;
    stage: string;
  }>;
export type RecordedDraftBasis = Readonly<{ basis: DraftBasis; comparisonRunId: string }>;
export type SavedDraftLine = DraftLineInput &
  Readonly<{ id: string; recorded: RecordedDraftBasis | null; enteredBy: string | null }>;
export type SavedDraft = Readonly<{
  id: string;
  quoteId: string;
  versionNumber: number;
  status: string;
  currency: string;
  lines: readonly SavedDraftLine[];
  totals: QuoteTotals;
}>;
export type DraftReceipt = Readonly<{
  kind: "SAVED";
  versionId: string;
  versionNumber: number;
  totals: QuoteTotals;
  firstSave: boolean;
}>;
export type DraftAuditReceipt = Readonly<{
  actorMembershipId: string | null;
  fingerprint: string;
  projectId: string;
  receipt: DraftReceipt;
}>;
export type DraftPreparation = Readonly<{
  organizationId: string;
  membershipId: string;
  projectId: string;
  baseVersionId: string | null;
  comparisonRunId: string;
  sourceFingerprint: string;
  permissionFingerprint: string;
  calculatedAt: string;
  suggestions: readonly DraftSuggestion[];
}>;
export interface DraftPreparationCodec {
  seal(value: DraftPreparation): string;
  open(token: string): DraftPreparation | null;
}
export interface QuoteDraftSessionPort {
  getJob(context: RuntimeContext, projectKey: string): Promise<QuoteDraftJob | null>;
  getStoredComparison(
    context: RuntimeContext,
    runId: string,
  ): Promise<Stage4ComparisonResult | null>;
  getConflict(
    context: RuntimeContext,
    runId: string,
    key: string,
  ): Promise<EvidenceConflictRecord | null>;
  getComparison(context: RuntimeContext, job: QuoteDraftJob): Promise<HomeComparisonOutcome | null>;
  loadBatch(
    context: RuntimeContext,
    comparison: Extract<HomeComparisonOutcome, { kind: "AVAILABLE" }>,
  ): Promise<AuthorizedEconomicsBatch | null>;
  getSaved(context: RuntimeContext, job: QuoteDraftJob): Promise<SavedDraft | null>;
  getSources(
    context: RuntimeContext,
    comparisonRunId: string,
    ids: readonly string[],
  ): Promise<AuthorizedEvidenceSourcesResult>;
  findReceipt(context: RuntimeContext, idempotencyKey: string): Promise<DraftAuditReceipt | null>;
  persist(
    context: RuntimeContext,
    job: QuoteDraftJob,
    input: SaveDraftInput,
    data: Readonly<{
      previous: SavedDraft | null;
      totals: QuoteTotals;
      fingerprint: string;
      lines: readonly (DraftLineInput & {
        recorded: RecordedDraftBasis | null;
        enteredBy: string | null;
      })[];
      changedCategories: readonly string[];
      basisMode: "CARRIED_OVER" | "REFRESHED";
    }>,
  ): Promise<DraftReceipt>;
}
export interface QuoteDraftRepositoryPort {
  transaction<T>(work: (session: QuoteDraftSessionPort) => Promise<T>): Promise<T>;
}
