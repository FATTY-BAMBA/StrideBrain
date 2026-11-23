import type { FirmWorkCategory } from "./contracts";

/** Resolve explicit pricing relationships. A malformed or cyclic setting has no valid target. */
export function pricingCategoryKey(
  categories: readonly FirmWorkCategory[],
  scopeKey: string,
): string | null {
  let key = scopeKey;
  const visited = new Set<string>();
  while (!visited.has(key)) {
    visited.add(key);
    const category = categories.find((entry) => entry.key === key);
    if (!category) return null;
    if (!category.pricedUnderKey) return key;
    key = category.pricedUnderKey;
  }
  return null;
}
export function pricingCategoriesForScopes(
  categories: readonly FirmWorkCategory[],
  scopeKeys: readonly string[],
): readonly string[] {
  return [
    ...new Set(
      scopeKeys
        .map((key) => pricingCategoryKey(categories, key))
        .filter((key): key is string => key !== null),
    ),
  ].sort();
}
export function categoryScopes(
  categories: readonly FirmWorkCategory[],
  pricingKey: string,
): readonly string[] {
  return categories
    .filter(
      (entry) => entry.scopeSelectable && pricingCategoryKey(categories, entry.key) === pricingKey,
    )
    .map((entry) => entry.key);
}
export function validPricingRelationship(
  categories: readonly FirmWorkCategory[],
  key: string | null,
  pricedUnderKey: string | null,
): boolean {
  if (pricedUnderKey === null) return true;
  const previous = categories.find((entry) => entry.key === key);
  const parent = categories.find((entry) => entry.key === pricedUnderKey);
  if (!parent || (!parent.active && previous?.pricedUnderKey !== parent.key)) return false;
  const visited = new Set(key ? [key] : []);
  let next: string | null = parent.key;
  while (next !== null) {
    if (visited.has(next)) return false;
    visited.add(next);
    const entry = categories.find((item) => item.key === next);
    if (!entry) return false;
    next = entry.pricedUnderKey;
  }
  return true;
}
