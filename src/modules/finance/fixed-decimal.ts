export type RoundingMode = "HALF_UP" | "DOWN" | "UP";

export type FixedDecimal = Readonly<{
  atoms: bigint;
  scale: number;
}>;

const POWERS_OF_TEN = new Map<number, bigint>([[0, 1n]]);

function powerOfTen(scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0 || scale > 18) {
    throw new RangeError(`Unsupported decimal scale: ${scale}`);
  }

  const existing = POWERS_OF_TEN.get(scale);
  if (existing !== undefined) return existing;

  const value = 10n ** BigInt(scale);
  POWERS_OF_TEN.set(scale, value);
  return value;
}

function assertSameScale(left: FixedDecimal, right: FixedDecimal): void {
  if (left.scale !== right.scale) {
    throw new Error(`Decimal scale mismatch: ${left.scale} !== ${right.scale}`);
  }
}

function roundDivision(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint {
  if (denominator === 0n) throw new RangeError("Division by zero");

  const negative = numerator < 0n !== denominator < 0n;
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const absoluteDenominator = denominator < 0n ? -denominator : denominator;
  const quotient = absoluteNumerator / absoluteDenominator;
  const remainder = absoluteNumerator % absoluteDenominator;

  let rounded = quotient;
  if (remainder !== 0n) {
    if (mode === "UP") rounded += 1n;
    if (mode === "HALF_UP" && remainder * 2n >= absoluteDenominator) rounded += 1n;
  }

  return negative ? -rounded : rounded;
}

export function decimalFromAtoms(atoms: bigint, scale: number): FixedDecimal {
  powerOfTen(scale);
  return Object.freeze({ atoms, scale });
}

export function decimalFromString(value: string, scale: number): FixedDecimal {
  powerOfTen(scale);
  const normalized = value.trim();
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(normalized);
  if (!match) throw new TypeError(`Invalid decimal string: ${value}`);

  const sign = match[1] === "-" ? -1n : 1n;
  const integer = match[2] ?? "0";
  const fraction = match[3] ?? "";
  if (fraction.length > scale) {
    throw new RangeError(
      `Value ${value} has ${fraction.length} fractional digits; maximum is ${scale}`,
    );
  }

  const paddedFraction = fraction.padEnd(scale, "0");
  const atoms = BigInt(integer) * powerOfTen(scale) + BigInt(paddedFraction || "0");
  return decimalFromAtoms(atoms * sign, scale);
}

export function decimalToString(value: FixedDecimal): string {
  const base = powerOfTen(value.scale);
  const negative = value.atoms < 0n;
  const absolute = negative ? -value.atoms : value.atoms;
  const integer = absolute / base;
  const fraction = absolute % base;

  if (value.scale === 0) return `${negative ? "-" : ""}${integer}`;

  return `${negative ? "-" : ""}${integer}.${fraction.toString().padStart(value.scale, "0")}`;
}

export function rescale(
  value: FixedDecimal,
  scale: number,
  mode: RoundingMode = "HALF_UP",
): FixedDecimal {
  powerOfTen(scale);
  if (value.scale === scale) return value;
  if (value.scale < scale) {
    return decimalFromAtoms(value.atoms * powerOfTen(scale - value.scale), scale);
  }

  return decimalFromAtoms(roundDivision(value.atoms, powerOfTen(value.scale - scale), mode), scale);
}

export function add(left: FixedDecimal, right: FixedDecimal): FixedDecimal {
  assertSameScale(left, right);
  return decimalFromAtoms(left.atoms + right.atoms, left.scale);
}

export function subtract(left: FixedDecimal, right: FixedDecimal): FixedDecimal {
  assertSameScale(left, right);
  return decimalFromAtoms(left.atoms - right.atoms, left.scale);
}

export function multiply(
  left: FixedDecimal,
  right: FixedDecimal,
  outputScale: number,
  mode: RoundingMode = "HALF_UP",
): FixedDecimal {
  const raw = decimalFromAtoms(left.atoms * right.atoms, left.scale + right.scale);
  return rescale(raw, outputScale, mode);
}

export function divide(
  numerator: FixedDecimal,
  denominator: FixedDecimal,
  outputScale: number,
  mode: RoundingMode = "HALF_UP",
): FixedDecimal {
  if (denominator.atoms === 0n) throw new RangeError("Division by zero");

  const scaledNumerator = numerator.atoms * powerOfTen(denominator.scale + outputScale);
  const scaledDenominator = denominator.atoms * powerOfTen(numerator.scale);
  return decimalFromAtoms(roundDivision(scaledNumerator, scaledDenominator, mode), outputScale);
}

export function compare(left: FixedDecimal, right: FixedDecimal): number {
  const scale = Math.max(left.scale, right.scale);
  const leftAtoms = rescale(left, scale, "DOWN").atoms;
  const rightAtoms = rescale(right, scale, "DOWN").atoms;
  return leftAtoms < rightAtoms ? -1 : leftAtoms > rightAtoms ? 1 : 0;
}

export function absolute(value: FixedDecimal): FixedDecimal {
  return value.atoms < 0n ? decimalFromAtoms(-value.atoms, value.scale) : value;
}

export function sum(values: readonly FixedDecimal[], scale: number): FixedDecimal {
  return values.reduce(
    (total, value) => add(total, rescale(value, scale)),
    decimalFromAtoms(0n, scale),
  );
}

export function median(values: readonly FixedDecimal[], outputScale: number): FixedDecimal | null {
  if (values.length === 0) return null;
  const ordered = values
    .map((value) => rescale(value, outputScale))
    .sort((left, right) => compare(left, right));
  const middle = Math.floor(ordered.length / 2);
  const upper = ordered[middle];
  if (!upper) return null;
  if (ordered.length % 2 === 1) return upper;

  const lower = ordered[middle - 1];
  if (!lower) return upper;
  return decimalFromAtoms(roundDivision(lower.atoms + upper.atoms, 2n, "HALF_UP"), outputScale);
}

export function variancePercent(
  current: FixedDecimal,
  baseline: FixedDecimal,
  outputScale = 4,
): FixedDecimal {
  if (baseline.atoms === 0n) throw new RangeError("Variance baseline cannot be zero");
  const difference = subtract(
    rescale(current, Math.max(current.scale, baseline.scale)),
    rescale(baseline, Math.max(current.scale, baseline.scale)),
  );
  const ratio = divide(difference, baseline, outputScale + 2);
  return multiply(ratio, decimalFromString("100", 0), outputScale);
}

export function withinTolerance(
  left: FixedDecimal,
  right: FixedDecimal,
  tolerance: FixedDecimal,
): boolean {
  const scale = Math.max(left.scale, right.scale, tolerance.scale);
  const difference = absolute(subtract(rescale(left, scale), rescale(right, scale)));
  return compare(difference, rescale(tolerance, scale)) <= 0;
}

export const MONEY_SCALE = 2;
export const QUANTITY_SCALE = 3;
export const UNIT_RATE_SCALE = 6;
export const PERCENT_SCALE = 4;

export const money = (value: string): FixedDecimal => decimalFromString(value, MONEY_SCALE);
export const quantity = (value: string): FixedDecimal => decimalFromString(value, QUANTITY_SCALE);
export const unitRate = (value: string): FixedDecimal => decimalFromString(value, UNIT_RATE_SCALE);
export const percent = (value: string): FixedDecimal => decimalFromString(value, PERCENT_SCALE);

export function calculateLineAmount(
  lineQuantity: FixedDecimal,
  lineUnitRate: FixedDecimal,
): FixedDecimal {
  return multiply(lineQuantity, lineUnitRate, MONEY_SCALE);
}

export function lineReconciles(
  lineQuantity: FixedDecimal,
  lineUnitRate: FixedDecimal,
  statedAmount: FixedDecimal,
  tolerance = money("0.01"),
): boolean {
  return withinTolerance(calculateLineAmount(lineQuantity, lineUnitRate), statedAmount, tolerance);
}
