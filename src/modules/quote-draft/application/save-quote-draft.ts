import { createHash } from "node:crypto";
import { saveQuoteDocument } from "./save-quote-document";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { quoteTotals } from "@/modules/finance/quote-totals";
import { categoryLabel } from "@/modules/localization/jobs";
import { basisSourceIds } from "@/modules/quote-draft/domain/draft-policy";
import { validateSaveDraft, isCategoryDraft } from "@/modules/quote-draft/domain/save-input";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  DraftPreparationCodec,
  DraftReceipt,
  QuoteDraftRepositoryPort,
} from "@/repositories/ports/quote-draft-repository";
export type SaveDraftOutcome =
  | DraftReceipt
  | Readonly<{
      kind:
        | "UNAVAILABLE"
        | "INVALID"
        | "CONFLICT"
        | "OUT_OF_DATE"
        | "NO_COMPARISON"
        | "BASIS_UNAVAILABLE"
        | "DISCOUNT_EXCEEDS_SUBTOTAL";
    }>;
export class SaveQuoteDraft {
  constructor(
    private readonly repository: QuoteDraftRepositoryPort,
    private readonly codec: DraftPreparationCodec,
  ) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<SaveDraftOutcome> {
    if (!context.capabilities.has("quote:draft") || !context.capabilities.has("quote:read"))
      return { kind: "UNAVAILABLE" };
    if (!context.firmLists) return { kind: "UNAVAILABLE" };
    if (raw && typeof raw === "object" && "sections" in raw)
      return saveQuoteDocument(this.repository, this.codec, context, raw);
    const input = validateSaveDraft(raw, context.firmLists.workCategories);
    if (!input) return { kind: "INVALID" };
    // Receipt fingerprints keep the pre-work-order canonical form for existing retries.
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          ...input,
          lines: [...input.lines].sort((a, b) => a.categoryId.localeCompare(b.categoryId)),
        }),
      )
      .digest("hex");
    return this.repository.transaction(async (tx): Promise<SaveDraftOutcome> => {
      const job = await tx.getJob(context, input.projectKey);
      if (
        !job ||
        job.organizationId !== context.organizationId ||
        !new AuthorizationService().canReadCommercial(context, job.id, "QUOTE").allowed
      )
        return { kind: "UNAVAILABLE" };
      const replay = await tx.findReceipt(context, input.idempotencyKey);
      if (replay)
        return replay.actorMembershipId === context.membershipId &&
          replay.projectId === job.id &&
          replay.fingerprint === fingerprint
          ? replay.receipt
          : { kind: "CONFLICT" };
      if (!isCategoryDraft(input.lines, job.catalog.workCategories)) return { kind: "INVALID" };
      const previous = await tx.getSaved(context, job);
      if (
        (previous?.id ?? null) !== input.baseVersionId ||
        (previous &&
          (previous.status !== "DRAFT" ||
            !isCategoryDraft(previous.lines, job.catalog.workCategories)))
      )
        return { kind: "CONFLICT" };
      const requiredCategories = [
        ...new Set([
          ...job.commercialCategoryIds,
          ...(previous?.lines.map((line) => line.categoryId) ?? []),
        ]),
      ].sort();
      if (
        JSON.stringify(requiredCategories) !==
        JSON.stringify(input.lines.map((line) => line.categoryId).sort())
      )
        return { kind: "INVALID" };
      const defaultUnit = job.catalog.quoteUnits.find((unit) => unit.active)?.key;
      if (
        input.lines.some((line) => {
          const old = previous?.lines.find((item) => item.categoryId === line.categoryId);
          const unit = line.unit ?? old?.unit ?? defaultUnit;
          return (
            !unit ||
            !job.catalog.quoteUnits.some(
              (entry) => entry.key === unit && (entry.active || old?.unit === unit),
            )
          );
        })
      )
        return { kind: "INVALID" };
      const preparation = input.preparationToken ? this.codec.open(input.preparationToken) : null;
      if (
        input.preparationToken &&
        (!preparation ||
          preparation.organizationId !== context.organizationId ||
          preparation.membershipId !== context.membershipId ||
          preparation.projectId !== job.id ||
          preparation.baseVersionId !== input.baseVersionId)
      )
        return { kind: "INVALID" };
      if (preparation) {
        const current = await tx.getComparison(context, job);
        if (!current) return { kind: "NO_COMPARISON" };
        if (current.kind !== "AVAILABLE") return { kind: current.kind };
        if (
          current.comparison.run.id !== preparation.comparisonRunId ||
          current.comparison.activeContext.sourceFingerprint !== preparation.sourceFingerprint ||
          current.comparison.activeContext.permissionFingerprint !==
            preparation.permissionFingerprint
        )
          return { kind: "OUT_OF_DATE" };
        const ids = [
          ...new Set(preparation.suggestions.flatMap((line) => basisSourceIds(line.basis))),
        ];
        if (
          ids.length &&
          (await tx.getSources(context, preparation.comparisonRunId, ids)).kind !== "COMPLETE"
        )
          return { kind: "BASIS_UNAVAILABLE" };
      }
      const lines = input.lines.map((line) => {
        const old = previous?.lines.find((entry) => entry.categoryId === line.categoryId);
        const fresh = preparation?.suggestions.find(
          (entry) => entry.categoryId === line.categoryId,
        );
        const recorded =
          fresh && preparation
            ? { basis: fresh.basis, comparisonRunId: preparation.comparisonRunId }
            : (old?.recorded ?? null);
        return {
          ...line,
          unit: line.unit ?? old?.unit ?? defaultUnit!,
          recorded,
          enteredBy:
            old?.enteredBy ??
            (recorded?.basis.suggestedAmount === undefined ? context.membershipId : null),
        };
      });
      const changedCategories = lines
        .filter((line) => {
          const old = previous?.lines.find((entry) => entry.categoryId === line.categoryId);
          return (
            line.amount !== (old?.amount ?? line.recorded?.basis.suggestedAmount) ||
            line.unit !== (old?.unit ?? defaultUnit) ||
            line.description !==
              (old?.description ??
                categoryLabel(context.locale, line.categoryId, job.catalog.workCategories))
          );
        })
        .map((line) => line.categoryId);
      return tx.persist(context, job, input, {
        previous,
        lines,
        totals: quoteTotals(lines.map((line) => line.amount)),
        fingerprint,
        changedCategories,
        basisMode: preparation ? "REFRESHED" : "CARRIED_OVER",
      });
    });
  }
}
