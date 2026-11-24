import { BUSINESS_KEY, IDEMPOTENCY_KEY } from "./job-input";
export type SiteAddressInput = Readonly<{
  businessKey: string;
  siteAddress: string;
  expectedSiteAddress: string;
  idempotencyKey: string;
}>;
export function validateSiteAddress(value: unknown): SiteAddressInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const address = (value: unknown): value is string =>
    typeof value === "string" && value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value);
  if (
    Object.keys(input).some(
      (key) =>
        !["businessKey", "siteAddress", "expectedSiteAddress", "idempotencyKey"].includes(key),
    ) ||
    typeof input.businessKey !== "string" ||
    !BUSINESS_KEY.test(input.businessKey) ||
    typeof input.idempotencyKey !== "string" ||
    !IDEMPOTENCY_KEY.test(input.idempotencyKey) ||
    !address(input.siteAddress) ||
    !address(input.expectedSiteAddress)
  )
    return null;
  return {
    businessKey: input.businessKey,
    siteAddress: input.siteAddress.trim(),
    expectedSiteAddress: input.expectedSiteAddress,
    idempotencyKey: input.idempotencyKey,
  };
}
