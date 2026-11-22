import { COMMERCIAL_CATEGORIES } from "@/modules/projects/domain/job-input";

/** Work order for drafts and new snapshots. Never apply to an issued snapshot. */
export function orderQuoteLines<T extends { readonly categoryId: string }>(
  lines: readonly T[],
): T[] {
  const position = (id: string) => {
    const index = COMMERCIAL_CATEGORIES.findIndex((category) => category === id);
    return index < 0 ? COMMERCIAL_CATEGORIES.length : index;
  };
  // Unknown legacy categories retain their relative order after the known categories.
  return [...lines].sort((a, b) => position(a.categoryId) - position(b.categoryId));
}
