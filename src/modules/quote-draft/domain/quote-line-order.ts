import { orderFirmEntries, type FirmWorkCategory } from "@/modules/firm-lists/domain/contracts";

/** Work order for drafts and new snapshots. Never apply to an issued snapshot. */
export function orderQuoteLines<T extends { readonly categoryId: string }>(
  lines: readonly T[],
  categories: readonly FirmWorkCategory[],
): T[] {
  const ordered = orderFirmEntries(categories);
  const position = (id: string) => {
    const index = ordered.findIndex((category) => category.key === id);
    return index < 0 ? ordered.length : index;
  };
  // Unknown legacy categories retain their relative order after the known categories.
  return [...lines].sort((a, b) => position(a.categoryId) - position(b.categoryId));
}
