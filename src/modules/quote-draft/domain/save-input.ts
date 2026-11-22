import { IDEMPOTENCY_KEY, SCOPE_CATEGORIES } from "@/modules/projects/domain/job-input";
import { decimalToString, money } from "@/modules/finance/fixed-decimal";
export type DraftLineInput = Readonly<{ categoryId: string; description: string; amount: string }>;
export type SaveDraftInput = Readonly<{
  projectKey: string;
  idempotencyKey: string;
  baseVersionId: string | null;
  preparationToken: string | null;
  lines: readonly DraftLineInput[];
}>;
// A category line is quantity 1 lot. Its amount must also fit unitPrice Decimal(20,6).
export const DRAFT_AMOUNT = /^(?:0|[1-9]\d{0,13})(?:\.\d{1,2})?$/;
export function validateSaveDraft(value: unknown): SaveDraftInput | null {
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
    input.lines.length > SCOPE_CATEGORIES.length
  )
    return null;
  const lines: DraftLineInput[] = [];
  for (const row of input.lines) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const line = row as Record<string, unknown>;
    if (
      Object.keys(line).some((key) => !["categoryId", "description", "amount"].includes(key)) ||
      typeof line.categoryId !== "string" ||
      !SCOPE_CATEGORIES.some((id) => id === line.categoryId) ||
      lines.some((existing) => existing.categoryId === line.categoryId) ||
      typeof line.description !== "string" ||
      !line.description.trim() ||
      line.description.trim().length > 500 ||
      typeof line.amount !== "string" ||
      !DRAFT_AMOUNT.test(line.amount)
    )
      return null;
    lines.push({
      categoryId: line.categoryId,
      description: line.description.trim(),
      amount: decimalToString(money(line.amount)),
    });
  }
  return {
    projectKey: input.projectKey,
    idempotencyKey: input.idempotencyKey,
    baseVersionId: input.baseVersionId,
    preparationToken: input.preparationToken,
    lines: lines.sort((a, b) => a.categoryId.localeCompare(b.categoryId)),
  };
}

/** The category editor cannot merge or split pre-existing detailed/commercial lines. */
export function isCategoryDraft(lines: readonly { categoryId: string }[]): boolean {
  return (
    lines.length > 0 &&
    new Set(lines.map((line) => line.categoryId)).size === lines.length &&
    lines.every((line) => SCOPE_CATEGORIES.some((category) => category === line.categoryId))
  );
}
