import { randomInt } from "node:crypto";

// Exclude 0/O and 1/I/L. References are editable suggestions, not unique IDs.
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateReference(prefix: "J" | "C", now: Date): string {
  // Use UTC so the month does not depend on the deployment's timezone.
  const year = String(now.getUTCFullYear() % 100).padStart(2, "0");
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const suffix = Array.from(
    { length: 4 },
    () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)],
  ).join("");
  return `${prefix}-${year}${month}-${suffix}`;
}

export function generateJobReference(now = new Date()): string {
  return generateReference("J", now);
}

export function generateClientReference(now = new Date()): string {
  return generateReference("C", now);
}
