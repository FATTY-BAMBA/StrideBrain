import folding from "./case-folding.json";
const cases: Readonly<Record<string, string>> = folding;
/** Exact item identity, shared with sb_price_identity in the derived SQL view. */
export function priceIdentity(text: string): string {
  return [...text.normalize("NFKC").trim()]
    .map((character) => cases[character] ?? character)
    .join("");
}
const key = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const text = (value: unknown, max: number): value is string =>
  typeof value === "string" &&
  value.length <= max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) &&
  !/\p{Surrogate}/u.test(value);
export type PriceQuery = Readonly<{
  mode: "SUGGEST" | "HISTORY" | "LIST";
  search: string;
  unit: string;
  page: number;
  projectKey: string | null;
}>;
export function priceQuery(raw: unknown): PriceQuery | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  if (
    Object.keys(v).some((k) => !["mode", "search", "unit", "page", "projectKey"].includes(k)) ||
    !["SUGGEST", "HISTORY", "LIST"].includes(String(v.mode)) ||
    !text(v.search, 500) ||
    !text(v.unit, 32) ||
    !Number.isInteger(v.page) ||
    Number(v.page) < 1 ||
    Number(v.page) > 10000 ||
    !(v.projectKey === null || (typeof v.projectKey === "string" && key.test(v.projectKey))) ||
    (v.mode === "SUGGEST" &&
      (!v.projectKey || [...v.search.normalize("NFKC").trim()].length < 2)) ||
    (v.mode === "HISTORY" && (!priceIdentity(v.search) || !priceIdentity(v.unit))) ||
    (v.mode !== "LIST" && v.page !== 1)
  )
    return null;
  return {
    mode: v.mode as PriceQuery["mode"],
    search: v.search,
    unit: v.unit,
    page: v.page as number,
    projectKey: v.projectKey as string | null,
  };
}
