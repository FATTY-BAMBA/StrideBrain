import { decimalFromString, decimalToString, divide } from "@/modules/finance/fixed-decimal";

/** The model supplies written digits/unit only. This is the sole 坪 conversion. */
export function draftArea(digits: string, unit: string): string | null {
  const value = digits.normalize("NFKC");
  const normalizedUnit = unit.normalize("NFKC").trim().toLowerCase();
  if (!/^\d{1,15}(?:\.\d{1,3})?$/.test(value) || !/[1-9]/.test(value)) return null;
  if (["m2", "㎡", "平方公尺", "平方米", "square metres", "square meters"].includes(normalizedUnit))
    return value;
  if (normalizedUnit !== "坪") return null;
  const amount = decimalFromString(value, 3);
  const result = decimalToString(
    divide({ ...amount, atoms: amount.atoms * 400n }, decimalFromString("121", 0), 3, "HALF_UP"),
  );
  return /^\d{1,15}\.\d{3}$/.test(result) && /[1-9]/.test(result) ? result : null;
}
