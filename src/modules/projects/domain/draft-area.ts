import { areaToSquareMetres } from "@/modules/firm-lists/domain/area-unit";

/** The model supplies written digits/unit only; the server converts the written area. */
export function draftArea(digits: string, unit: string): string | null {
  const value = digits.normalize("NFKC");
  const normalizedUnit = unit.normalize("NFKC").trim().toLowerCase();
  if (!/^\d{1,15}(?:\.\d{1,3})?$/.test(value) || !/[1-9]/.test(value)) return null;
  if (["m2", "㎡", "平方公尺", "平方米", "square metres", "square meters"].includes(normalizedUnit))
    return value;
  if (normalizedUnit !== "坪") return null;
  return areaToSquareMetres(value, "ping");
}
