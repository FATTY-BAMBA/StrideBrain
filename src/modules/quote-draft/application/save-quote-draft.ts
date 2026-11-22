import { createHash } from "node:crypto";
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
        | "BASIS_UNAVAILABLE";
    }>;
export class SaveQuoteDraft {
  constructor(
    private readonly repository: QuoteDraftRepositoryPort,
    private readonly codec: DraftPreparationCodec,
  ) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<SaveDraftOutcome> {
    if (!context.capabilities.has("quote:draft") || !context.capabilities.has("quote:read"))
      return { kind: "UNAVAILABLE" };
    const input = validateSaveDraft(raw);
    if (!input) return { kind: "INVALID" };
    const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
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
      const previous = await tx.getSaved(context, job);
      if (
        (previous?.id ?? null) !== input.baseVersionId ||
        (previous && (previous.status !== "DRAFT" || !isCategoryDraft(previous.lines)))
      )
        return { kind: "CONFLICT" };
      const requiredCategories = [
        ...new Set([
          ...job.scopeCategoryIds,
          ...(previous?.lines.map((line) => line.categoryId) ?? []),
        ]),
      ].sort();
      if (
        JSON.stringify(requiredCategories) !==
        JSON.stringify(input.lines.map((line) => line.categoryId))
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
      if (!previous && !preparation) return { kind: "NO_COMPARISON" };
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
            line.description !==
              (old?.description ?? categoryLabel(context.locale, line.categoryId))
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
