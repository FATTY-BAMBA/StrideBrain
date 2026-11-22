import { createHash } from "node:crypto";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import {
  stageAfterAcceptance,
  organizationDate,
  prepareIssuePolicy,
  isDate,
} from "../domain/issue-policy";
import {
  bounded,
  firmDetails,
  issueOptions,
  only,
  record,
  validId,
  validIdempotency,
  validKey,
} from "../domain/input";
import {
  emptyFirmDetails,
  type IssueState,
  type IssueOptions,
  type IssuePreparation,
  type IssueOutcome,
  type IssueFailure,
} from "../domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  QuoteIssueCodec,
  QuoteIssueRepositoryPort,
  QuoteIssueSessionPort,
} from "@/repositories/ports/quote-issue-repository";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const unavailable: IssueFailure = { kind: "UNAVAILABLE" };
function preparationFingerprint(state: IssueState, result: ReturnType<typeof prepareIssuePolicy>) {
  return hash({
    result,
    current: state.current,
    firm: state.firm,
    job: state.job,
    issuedId: state.issued?.id,
    conflicts: state.conflicts,
    sourceAccess: state.sourceAccess,
  });
}
async function access(tx: QuoteIssueSessionPort, context: RuntimeContext, key: string) {
  const job = await tx.getJob(context, key);
  return !!job && new AuthorizationService().canReadCommercial(context, job.id, "QUOTE").allowed;
}
async function replay(
  tx: QuoteIssueSessionPort,
  context: RuntimeContext,
  key: string,
  fingerprint: string,
): Promise<IssueOutcome | null> {
  const result = await tx.receipt(context, key);
  return result
    ? result.actor === context.membershipId && result.fingerprint === fingerprint
      ? result.receipt
      : { kind: "CONFLICT" }
    : null;
}
export class GetFirmDetails {
  constructor(private readonly repository: QuoteIssueRepositoryPort) {}
  execute(context: RuntimeContext) {
    return this.repository.transaction(async (tx) =>
      context.capabilities.has("quote:read") || context.capabilities.has("settings:manage")
        ? {
            kind: "AVAILABLE" as const,
            details: (await tx.readFirm(context)) ?? emptyFirmDetails,
            canManage: context.capabilities.has("settings:manage"),
          }
        : unavailable,
    );
  }
}
export class SaveFirmDetails {
  constructor(private readonly repository: QuoteIssueRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<IssueOutcome> {
    if (!context.capabilities.has("settings:manage")) return unavailable;
    const input = record(raw),
      details = firmDetails(input?.details);
    if (
      !input ||
      !only(input, ["details", "idempotencyKey"]) ||
      !details ||
      !validIdempotency(input.idempotencyKey)
    )
      return { kind: "INVALID" };
    const key = input.idempotencyKey,
      fingerprint = hash({ operation: "SETTINGS", details });
    return this.repository.transaction(async (tx) => {
      const existing = await replay(tx, context, key, fingerprint);
      if (existing) return existing;
      await tx.saveFirm(context, details);
      const receipt = { kind: "SETTINGS_SAVED" as const };
      await tx.audit(context, key, fingerprint, receipt, { fields: Object.keys(details) });
      return receipt;
    });
  }
}
export class PrepareQuoteIssue {
  constructor(
    private readonly repository: QuoteIssueRepositoryPort,
    private readonly codec: QuoteIssueCodec,
    private readonly clock = () => new Date(),
  ) {}
  async execute(context: RuntimeContext, raw: unknown) {
    if (!context.capabilities.has("quote:issue") || !context.capabilities.has("quote:read"))
      return unavailable;
    const input = record(raw),
      options = issueOptions(input?.options);
    if (
      !input ||
      !only(input, ["projectKey", "versionId", "options"]) ||
      !validKey(input.projectKey) ||
      !validId(input.versionId) ||
      !options
    )
      return { kind: "INVALID" as const };
    const key = input.projectKey,
      versionId = input.versionId;
    return this.repository.transaction(async (tx) => {
      const state = await tx.loadIssueState(context, key);
      if (!state || !state.sourceAccess) return unavailable;
      const now = this.clock(),
        result = prepareIssuePolicy(state, versionId, options, now);
      if (result.snapshot.validUntil < result.snapshot.issueDate)
        return { kind: "INVALID" as const };
      const preparation: IssuePreparation = {
        organizationId: context.organizationId,
        membershipId: context.membershipId,
        projectId: state.job.id,
        projectKey: key,
        versionId,
        options,
        preparedAt: now.toISOString(),
        fingerprint: preparationFingerprint(state, result),
        ...result,
      };
      return { kind: "PREPARED" as const, preparation, token: this.codec.seal(preparation) };
    });
  }
}
export class IssueQuote {
  constructor(
    private readonly repository: QuoteIssueRepositoryPort,
    private readonly codec: QuoteIssueCodec,
    private readonly clock = () => new Date(),
  ) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<IssueOutcome> {
    if (!context.capabilities.has("quote:issue") || !context.capabilities.has("quote:read"))
      return unavailable;
    const input = record(raw);
    if (
      !input ||
      !only(input, ["projectKey", "token", "idempotencyKey"]) ||
      !validKey(input.projectKey) ||
      !bounded(input.token, 500000, true) ||
      !validIdempotency(input.idempotencyKey)
    )
      return { kind: "INVALID" };
    const key = input.projectKey,
      token = input.token,
      idempotency = input.idempotencyKey,
      fingerprint = hash({ operation: "ISSUE", projectKey: key, token });
    return this.repository.transaction(async (tx) => {
      if (!(await access(tx, context, key))) return unavailable;
      const existing = await replay(tx, context, idempotency, fingerprint);
      if (existing) return existing;
      const preparation = this.codec.open(token);
      if (
        !preparation ||
        preparation.organizationId !== context.organizationId ||
        preparation.membershipId !== context.membershipId ||
        preparation.projectKey !== key
      )
        return { kind: "INVALID" };
      const state = await tx.loadIssueState(context, key);
      if (!state || !state.sourceAccess || state.job.id !== preparation.projectId)
        return unavailable;
      const now = this.clock(),
        current = prepareIssuePolicy(state, preparation.versionId, preparation.options, now);
      if (current.blockers.length)
        return {
          kind: "CHANGED",
          blockers: current.blockers,
          missingFirmFields: current.missingFirmFields,
        };
      if (preparationFingerprint(state, current) !== preparation.fingerprint)
        return { kind: "CHANGED" };
      const receipt = await tx.issue(context, state, preparation, now);
      await tx.audit(context, idempotency, fingerprint, receipt, {
        projectId: state.job.id,
        versionId: preparation.versionId,
        documentNumber: preparation.snapshot.documentNumber,
        warnings: preparation.warnings,
        snapshotFingerprint: hash(preparation.snapshot),
      });
      return receipt;
    });
  }
}
export class ReviseIssuedQuote {
  constructor(private readonly repository: QuoteIssueRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<IssueOutcome> {
    if (!context.capabilities.has("quote:draft") || !context.capabilities.has("quote:read"))
      return unavailable;
    const input = record(raw);
    if (
      !input ||
      !only(input, ["projectKey", "versionId", "idempotencyKey"]) ||
      !validKey(input.projectKey) ||
      !validId(input.versionId) ||
      !validIdempotency(input.idempotencyKey)
    )
      return { kind: "INVALID" };
    const key = input.projectKey,
      versionId = input.versionId,
      idempotency = input.idempotencyKey,
      fingerprint = hash({ operation: "REVISE", key, versionId });
    return this.repository.transaction(async (tx) => {
      if (!(await access(tx, context, key))) return unavailable;
      const existing = await replay(tx, context, idempotency, fingerprint);
      if (existing) return existing;
      const state = await tx.loadIssueState(context, key);
      if (
        !state ||
        state.current?.id !== versionId ||
        state.issued?.id !== versionId ||
        state.issued.status !== "ISSUED"
      )
        return { kind: "CHANGED" };
      const receipt = await tx.revise(context, state, versionId);
      await tx.audit(context, idempotency, fingerprint, receipt, {
        projectId: state.job.id,
        sourceVersionId: versionId,
        basisMode: "CARRIED_OVER",
      });
      return receipt;
    });
  }
}
export class RecordQuoteAcceptance {
  constructor(
    private readonly repository: QuoteIssueRepositoryPort,
    private readonly clock = () => new Date(),
  ) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<IssueOutcome> {
    if (!context.capabilities.has("project:update") || !context.capabilities.has("quote:read"))
      return unavailable;
    const input = record(raw);
    if (
      !input ||
      !only(input, ["projectKey", "versionId", "date", "note", "idempotencyKey"]) ||
      !validKey(input.projectKey) ||
      !validId(input.versionId) ||
      !isDate(input.date) ||
      !bounded(input.note, 2000) ||
      !validIdempotency(input.idempotencyKey)
    )
      return { kind: "INVALID" };
    const key = input.projectKey,
      versionId = input.versionId,
      date = input.date,
      note = input.note.trim(),
      idempotency = input.idempotencyKey,
      fingerprint = hash({ operation: "ACCEPT", key, versionId, date, note });
    return this.repository.transaction(async (tx) => {
      if (!(await access(tx, context, key))) return unavailable;
      const existing = await replay(tx, context, idempotency, fingerprint);
      if (existing) return existing;
      const state = await tx.loadIssueState(context, key);
      if (!state || state.issued?.id !== versionId || state.issued.status !== "ISSUED")
        return { kind: "CHANGED" };
      if (date > organizationDate(this.clock(), state.timezone)) return { kind: "INVALID" };
      const receipt = await tx.accept(context, state, versionId, date, note);
      await tx.audit(context, idempotency, fingerprint, receipt, {
        projectId: state.job.id,
        acceptedOn: date,
        note,
        previousStage: state.job.stage,
        newStage: stageAfterAcceptance(state.job.stage),
      });
      return receipt;
    });
  }
}
export class ResolveQuoteConflict {
  constructor(
    private readonly repository: QuoteIssueRepositoryPort,
    private readonly clock = () => new Date(),
  ) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<IssueOutcome> {
    if (
      !context.capabilities.has("authority:financial-conflict:resolve") ||
      !context.capabilities.has("quote:read") ||
      !context.capabilities.has("evidence:read")
    )
      return unavailable;
    const input = record(raw);
    if (
      !input ||
      !only(input, ["projectKey", "conflictKey", "status", "note", "idempotencyKey"]) ||
      !validKey(input.projectKey) ||
      !bounded(input.conflictKey, 256, true) ||
      !["RESOLVED", "DISMISSED"].includes(String(input.status)) ||
      !bounded(input.note, 2000, true) ||
      !validIdempotency(input.idempotencyKey)
    )
      return { kind: "INVALID" };
    const key = input.projectKey,
      conflictKey = input.conflictKey,
      status = input.status as "RESOLVED" | "DISMISSED",
      note = input.note.trim(),
      idempotency = input.idempotencyKey,
      fingerprint = hash({ operation: "RESOLVE", key, conflictKey, status, note });
    return this.repository.transaction(async (tx) => {
      if (!(await access(tx, context, key))) return unavailable;
      const existing = await replay(tx, context, idempotency, fingerprint);
      if (existing) return existing;
      const state = await tx.loadIssueState(context, key);
      if (
        !state ||
        !state.sourceAccess ||
        !state.conflicts.some((conflict) => conflict.conflictKey === conflictKey)
      )
        return unavailable;
      const receipt = await tx.resolveConflict(
        context,
        state,
        conflictKey,
        status,
        note,
        this.clock(),
      );
      await tx.audit(context, idempotency, fingerprint, receipt, {
        projectId: state.job.id,
        conflictKey,
        status,
        note,
      });
      return receipt;
    });
  }
}
export class GetQuoteIssue {
  constructor(
    private readonly repository: QuoteIssueRepositoryPort,
    private readonly clock = () => new Date(),
  ) {}
  execute(context: RuntimeContext, key: string) {
    if (!validKey(key) || !context.capabilities.has("quote:read"))
      return Promise.resolve(unavailable);
    return this.repository.transaction(async (tx) => {
      const state = await tx.loadIssueState(context, key);
      if (!state) return unavailable;
      const defaults = prepareIssuePolicy(
        state,
        state.current?.id ?? "",
        { language: "zh-TW", attention: "" },
        this.clock(),
      );
      const latestIssued = state.latestIssued ?? state.issued;
      return {
        kind: "AVAILABLE" as const,
        projectKey: key,
        latestIssued: latestIssued
          ? {
              documentNumber: latestIssued!.documentNumber,
              status: latestIssued!.status,
              validUntil: latestIssued!.validUntil,
              acceptedOn: latestIssued!.acceptedOn,
            }
          : null,
        amounts: state.current
          ? { basis: "CURRENT" as const, currency: state.current.currency, ...state.current.totals }
          : null,
        versionId: state.current?.id ?? null,
        status: state.current?.status ?? null,
        today: organizationDate(this.clock(), state.timezone),
        issued: state.issued
          ? {
              id: state.issued.id,
              status: state.issued.status,
              documentNumber: state.issued.documentNumber,
              validUntil: state.issued.validUntil,
              acceptedOn: state.issued.acceptedOn,
            }
          : null,
        canIssue: context.capabilities.has("quote:issue"),
        canRevise: context.capabilities.has("quote:draft"),
        canAccept: context.capabilities.has("project:update"),
        canResolve: context.capabilities.has("authority:financial-conflict:resolve"),
        conflicts: state.conflicts,
        findings: state.findings,
        warnings: defaults.warnings,
        defaults: {
          language: "zh-TW" as const,
          validUntil: defaults.snapshot.validUntil,
          attention: "",
          terms: defaults.snapshot.terms,
        },
        termsEn: state.firm?.termsEn ?? "",
        termsZhTw: state.firm?.termsZhTw ?? "",
      };
    });
  }
}
export class GetQuoteDocument {
  constructor(
    private readonly repository: QuoteIssueRepositoryPort,
    private readonly clock = () => new Date(),
  ) {}
  execute(context: RuntimeContext, versionId: string, previewOptions?: unknown) {
    if (!validId(versionId) || !context.capabilities.has("quote:read"))
      return Promise.resolve(unavailable);
    const options: IssueOptions | null =
      previewOptions === undefined ? null : issueOptions(previewOptions);
    if (previewOptions !== undefined && !options)
      return Promise.resolve({ kind: "INVALID" as const });
    return this.repository.transaction(async (tx) => {
      const document = await tx.document(context, versionId);
      if (!document) return unavailable;
      if (document.snapshot)
        return { kind: "DOCUMENT" as const, snapshot: document.snapshot, draft: false };
      if (!options || document.status !== "DRAFT") return unavailable;
      const state = await tx.loadIssueState(context, document.projectKey);
      if (!state || state.current?.id !== versionId) return unavailable;
      return {
        kind: "DOCUMENT" as const,
        snapshot: prepareIssuePolicy(state, versionId, options, this.clock()).snapshot,
        draft: true,
      };
    });
  }
}
