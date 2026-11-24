import type { FirmWorkCategory } from "@/modules/firm-lists/domain/contracts";
import { orderQuoteLines } from "@/modules/quote-draft/domain/quote-line-order";
import { IDEMPOTENCY_KEY } from "@/modules/projects/domain/job-input";
import { decimalToString, money } from "@/modules/finance/fixed-decimal";
import type { QuoteDocumentDraft } from "./document-input";
export type DraftLineInput = Readonly<{
  categoryId: string;
  description: string;
  amount: string;
  unit?: string;
}>;
export type SaveDraftInput = Readonly<{
  document?: QuoteDocumentDraft;
  projectKey: string;
  idempotencyKey: string;
  baseVersionId: string | null;
  preparationToken: string | null;
  lines: readonly DraftLineInput[];
}>;
// A category line is quantity 1 lot. Its amount must also fit unitPrice Decimal(20,6).
export const DRAFT_AMOUNT = /^(?:0|[1-9]\d{0,13})(?:\.\d{1,2})?$/;
export function validateSaveDraft(
  value: unknown,
  categories: readonly FirmWorkCategory[],
): SaveDraftInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).some(
      (key) =>
        !["projectKey", "idempotencyKey", "baseVersionId", "preparationToken", "lines"].includes(
          key,
        ),
    ) ||
    typeof input.projectKey !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(input.projectKey) ||
    typeof input.idempotencyKey !== "string" ||
    !IDEMPOTENCY_KEY.test(input.idempotencyKey) ||
    !(
      input.baseVersionId === null ||
      (typeof input.baseVersionId === "string" && input.baseVersionId.length <= 128)
    ) ||
    !(
      input.preparationToken === null ||
      (typeof input.preparationToken === "string" && input.preparationToken.length <= 100_000)
    ) ||
    !Array.isArray(input.lines) ||
    !input.lines.length ||
    input.lines.length > Math.min(500, categories.length)
  )
    return null;
  const lines: DraftLineInput[] = [];
  for (const row of input.lines) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const line = row as Record<string, unknown>;
    if (
      Object.keys(line).some(
        (key) => !["categoryId", "description", "amount", "unit"].includes(key),
      ) ||
      typeof line.categoryId !== "string" ||
      !categories.some((entry) => entry.key === line.categoryId && entry.pricedUnderKey === null) ||
      lines.some((existing) => existing.categoryId === line.categoryId) ||
      (line.unit !== undefined &&
        (typeof line.unit !== "string" || !line.unit.length || line.unit.length > 128)) ||
      typeof line.description !== "string" ||
      !line.description.trim() ||
      line.description.trim().length > 500 ||
      typeof line.amount !== "string" ||
      !DRAFT_AMOUNT.test(line.amount)
    )
      return null;
    lines.push({
      categoryId: line.categoryId,
      ...(line.unit !== undefined ? { unit: line.unit as string } : {}),
      description: line.description.trim(),
      amount: decimalToString(money(line.amount)),
    });
  }
  return {
    projectKey: input.projectKey,
    idempotencyKey: input.idempotencyKey,
    baseVersionId: input.baseVersionId,
    preparationToken: input.preparationToken,
    lines: orderQuoteLines(lines, categories),
  };
}

/** The category editor cannot merge or split pre-existing detailed lines. */
export function isCategoryDraft(
  lines: readonly { categoryId: string }[],
  categories: readonly FirmWorkCategory[],
): boolean {
  return (
    lines.length > 0 &&
    new Set(lines.map((line) => line.categoryId)).size === lines.length &&
    lines.every((line) =>
      categories.some(
        (category) => category.key === line.categoryId && category.pricedUnderKey === null,
      ),
    )
  );
}
