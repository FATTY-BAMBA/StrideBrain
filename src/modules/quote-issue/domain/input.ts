import { BUSINESS_KEY, IDEMPOTENCY_KEY } from "@/modules/projects/domain/job-input";
import { isDate } from "./issue-policy";
import type { FirmDetails, IssueOptions } from "./contracts";
export function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
export function only(input: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(input).every((key) => keys.includes(key));
}
export function bounded(value: unknown, max: number, required = false): value is string {
  return (
    typeof value === "string" &&
    value.length <= max &&
    (!required || !!value.trim()) &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  );
}
export function validKey(value: unknown): value is string {
  return typeof value === "string" && BUSINESS_KEY.test(value);
}
export function validId(value: unknown): value is string {
  return bounded(value, 128, true);
}
export function validIdempotency(value: unknown): value is string {
  return typeof value === "string" && IDEMPOTENCY_KEY.test(value);
}
export function issueOptions(value: unknown): IssueOptions | null {
  const data = record(value);
  if (
    !data ||
    !only(data, ["language", "validUntil", "attention", "terms"]) ||
    !["en", "zh-TW"].includes(String(data.language)) ||
    !bounded(data.attention, 200) ||
    (data.validUntil !== undefined && !isDate(data.validUntil)) ||
    (data.terms !== undefined && !bounded(data.terms, 10000))
  )
    return null;
  return {
    language: data.language as IssueOptions["language"],
    attention: data.attention.trim(),
    ...(typeof data.validUntil === "string" ? { validUntil: data.validUntil } : {}),
    ...(typeof data.terms === "string" ? { terms: data.terms.trim() } : {}),
  };
}
export function firmDetails(value: unknown): FirmDetails | null {
  const data = record(value);
  const limits = {
    legalNameEn: 200,
    legalNameZhTw: 200,
    taxId: 8,
    addressEn: 500,
    addressZhTw: 500,
    phone: 80,
    email: 254,
    termsEn: 10000,
    termsZhTw: 10000,
  };
  if (
    !data ||
    !only(data, [...Object.keys(limits), "defaultValidityDays"]) ||
    Object.entries(limits).some(([key, max]) => !bounded(data[key], max)) ||
    !Number.isInteger(data.defaultValidityDays) ||
    Number(data.defaultValidityDays) < 1 ||
    Number(data.defaultValidityDays) > 365
  )
    return null;
  const result = { ...data } as unknown as FirmDetails;
  if (
    (result.taxId && !/^\d{8}$/.test(result.taxId)) ||
    (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))
  )
    return null;
  return Object.fromEntries(
    Object.entries(result).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]),
  ) as FirmDetails;
}
