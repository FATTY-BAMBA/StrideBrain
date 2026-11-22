import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  FirmDetails,
  IssueState,
  IssuePreparation,
  IssueReceipt,
  QuoteDocumentSnapshot,
} from "@/modules/quote-issue/domain/contracts";
import type { QuoteDraftSessionPort } from "./quote-draft-repository";
export interface QuoteIssueCodec {
  seal(value: IssuePreparation): string;
  open(token: string): IssuePreparation | null;
}
export interface QuoteIssueSessionPort extends QuoteDraftSessionPort {
  readFirm(context: RuntimeContext): Promise<FirmDetails | null>;
  loadIssueState(context: RuntimeContext, projectKey: string): Promise<IssueState | null>;
  document(
    context: RuntimeContext,
    versionId: string,
  ): Promise<{ projectKey: string; status: string; snapshot: QuoteDocumentSnapshot | null } | null>;
  receipt(
    context: RuntimeContext,
    key: string,
  ): Promise<{ actor: string | null; fingerprint: string; receipt: IssueReceipt } | null>;
  saveFirm(context: RuntimeContext, details: FirmDetails): Promise<void>;
  issue(
    context: RuntimeContext,
    state: IssueState,
    preparation: IssuePreparation,
    now: Date,
  ): Promise<IssueReceipt>;
  revise(context: RuntimeContext, state: IssueState, versionId: string): Promise<IssueReceipt>;
  accept(
    context: RuntimeContext,
    state: IssueState,
    versionId: string,
    date: string,
    note: string,
  ): Promise<IssueReceipt>;
  resolveConflict(
    context: RuntimeContext,
    state: IssueState,
    conflictKey: string,
    status: "RESOLVED" | "DISMISSED",
    note: string,
    now: Date,
  ): Promise<IssueReceipt>;
  audit(
    context: RuntimeContext,
    key: string,
    fingerprint: string,
    receipt: IssueReceipt,
    details: Readonly<Record<string, unknown>>,
  ): Promise<void>;
}
export interface QuoteIssueRepositoryPort {
  transaction<T>(work: (tx: QuoteIssueSessionPort) => Promise<T>): Promise<T>;
}
