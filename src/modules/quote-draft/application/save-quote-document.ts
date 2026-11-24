import { createHash } from "node:crypto";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { quoteDocumentTotals } from "@/modules/finance/quote-totals";
import { validateQuoteDocument } from "../domain/document-input";
import { basisSourceIds } from "../domain/draft-policy";
import {
  bounded,
  only,
  record,
  validIdempotency,
  validKey,
} from "@/modules/quote-issue/domain/input";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  DraftPreparationCodec,
  QuoteDraftRepositoryPort,
} from "@/repositories/ports/quote-draft-repository";
import type { SaveDraftInput } from "../domain/save-input";
import type { SaveDraftOutcome } from "./save-quote-draft";

/** Version 2 saves author-entered work; comparison references never gate a save. */
export async function saveQuoteDocument(
  repository: QuoteDraftRepositoryPort,
  codec: DraftPreparationCodec,
  context: RuntimeContext,
  raw: unknown,
): Promise<SaveDraftOutcome> {
  const input = record(raw);
  const document = validateQuoteDocument(raw);
  if (
    !input ||
    !document ||
    !only(input, [
      "projectKey",
      "idempotencyKey",
      "baseVersionId",
      "preparationToken",
      "sections",
      "discount",
      "totals",
    ]) ||
    !validKey(input.projectKey) ||
    !validIdempotency(input.idempotencyKey) ||
    !(input.baseVersionId === null || bounded(input.baseVersionId, 128, true)) ||
    !(
      input.preparationToken === null ||
      input.preparationToken === undefined ||
      bounded(input.preparationToken, 100000, true)
    )
  )
    return { kind: "INVALID" };
  let calculated;
  try {
    calculated = quoteDocumentTotals(document);
  } catch (error) {
    return {
      kind:
        error instanceof Error && error.message === "DISCOUNT_EXCEEDS_SUBTOTAL"
          ? "DISCOUNT_EXCEEDS_SUBTOTAL"
          : "INVALID",
    };
  }
  const normalized: SaveDraftInput = {
    projectKey: input.projectKey,
    idempotencyKey: input.idempotencyKey,
    baseVersionId: input.baseVersionId,
    preparationToken: typeof input.preparationToken === "string" ? input.preparationToken : null,
    document,
    lines: [],
  };
  const fingerprint = createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
  return repository.transaction(async (tx) => {
    const job = await tx.getJob(context, normalized.projectKey);
    if (
      !job ||
      job.organizationId !== context.organizationId ||
      !new AuthorizationService().canReadCommercial(context, job.id, "QUOTE").allowed
    )
      return { kind: "UNAVAILABLE" };
    const replay = await tx.findReceipt(context, normalized.idempotencyKey);
    if (replay)
      return replay.actorMembershipId === context.membershipId &&
        replay.projectId === job.id &&
        replay.fingerprint === fingerprint
        ? replay.receipt
        : { kind: "CONFLICT" };
    const previous = await tx.getSaved(context, job);
    if (
      (previous?.id ?? null) !== normalized.baseVersionId ||
      (previous && previous.status !== "DRAFT")
    )
      return { kind: "CONFLICT" };
    const allowed = new Set([
      ...job.commercialCategoryIds,
      ...(previous?.document?.sections.flatMap((section) =>
        section.categoryId ? [section.categoryId] : [],
      ) ??
        previous?.lines.map((line) => line.categoryId) ??
        []),
    ]);
    if (
      document.sections.some(
        (section) =>
          section.categoryId !== null &&
          (!allowed.has(section.categoryId) ||
            !job.catalog.workCategories.some(
              (category) => category.key === section.categoryId && category.pricedUnderKey === null,
            )),
      )
    )
      return { kind: "INVALID" };
    const preparation = normalized.preparationToken
      ? codec.open(normalized.preparationToken)
      : null;
    if (
      normalized.preparationToken &&
      (!preparation ||
        preparation.organizationId !== context.organizationId ||
        preparation.membershipId !== context.membershipId ||
        preparation.projectId !== job.id)
    )
      return { kind: "INVALID" };
    // Optional signed references may be carried forward, even after this quote makes its comparison stale.
    // A revoked source removes a newly attached reference; it does not prevent saving typed amounts.
    const references = new Map<string, NonNullable<typeof preparation>["suggestions"][number]>();
    for (const suggestion of preparation?.suggestions ?? []) {
      const ids = basisSourceIds(suggestion.basis);
      if (
        !ids.length ||
        (await tx.getSources(context, preparation!.comparisonRunId, ids)).kind === "COMPLETE"
      )
        references.set(suggestion.categoryId, suggestion);
    }
    const lines = calculated.sections.flatMap((section) =>
      section.lines.flatMap((line) => {
        if (line.kind === "NOTE") return [];
        const old = previous?.lines.find(
          (item) => item.id === line.id && item.categoryId === section.categoryId,
        );
        const fresh = section.categoryId ? references.get(section.categoryId) : undefined;
        const recorded =
          fresh && preparation
            ? { basis: fresh.basis, comparisonRunId: preparation.comparisonRunId }
            : (old?.recorded ?? null);
        return [
          {
            categoryId: section.categoryId ?? "",
            description: line.description,
            amount: line.amount!,
            unit: line.kind === "ITEM" ? line.unit : "%",
            recorded,
            enteredBy: old?.enteredBy ?? context.membershipId,
          },
        ];
      }),
    );
    return tx.persist(context, job, normalized, {
      previous,
      fingerprint,
      lines,
      document: calculated,
      totals: {
        amountBeforeTax: calculated.amountBeforeTax,
        taxAmount: calculated.taxAmount,
        totalAmount: calculated.totalAmount,
      },
      changedCategories: [
        ...new Set(
          document.sections.flatMap((section) => (section.categoryId ? [section.categoryId] : [])),
        ),
      ],
      basisMode: preparation ? "REFRESHED" : "CARRIED_OVER",
    });
  });
}
