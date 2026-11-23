import {
  decimalFromString,
  decimalToString,
  divide,
  rescale,
} from "@/modules/finance/fixed-decimal";

export const AREA_UNITS = ["m2", "ping"] as const;
export type AreaDisplayUnit = (typeof AREA_UNITS)[number];
export const areaUnitLabel = (unit: AreaDisplayUnit): string => (unit === "ping" ? "坪" : "m²");

/** The canonical storage scale stays three decimals. No floating-point conversion. */
export function areaToSquareMetres(digits: string, unit: AreaDisplayUnit): string | null {
  if (!/^\d{1,15}(?:\.\d{1,3})?$/.test(digits) || !/[1-9]/.test(digits)) return null;
  const amount = decimalFromString(digits, 3);
  const value =
    unit === "m2"
      ? amount
      : divide(
          { ...amount, atoms: amount.atoms * 400n },
          decimalFromString("121", 0),
          3,
          "HALF_UP",
        );
  const result = decimalToString(value);
  return /^\d{1,15}\.\d{3}$/.test(result) && value.atoms > 0n ? result : null;
}

/** Display and form values use at most two decimals, omitting insignificant zeroes. */
export function areaInFirmUnit(squareMetres: string, unit: AreaDisplayUnit): string {
  const amount = decimalFromString(squareMetres, 3);
  const displayed =
    unit === "m2"
      ? rescale(amount, 2, "HALF_UP")
      : divide(
          { ...amount, atoms: amount.atoms * 121n },
          decimalFromString("400", 0),
          2,
          "HALF_UP",
        );
  return decimalToString(displayed).replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, "");
}
