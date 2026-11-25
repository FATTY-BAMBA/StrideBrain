import type { FirmListEntry } from "@/modules/firm-lists/domain/contracts";
import { BUSINESS_KEY, IDEMPOTENCY_KEY } from "@/modules/projects/domain/job-input";

export const CLIENT_DETAIL_FIELDS = [
  "nameEn",
  "nameZhTw",
  "clientType",
  "contactPerson",
  "phone",
  "email",
  "address",
  "taxId",
  "note",
] as const;
export type ClientField = (typeof CLIENT_DETAIL_FIELDS)[number];
export type ClientDetails = Readonly<Record<ClientField, string>>;
export type ClientErrors = Partial<Record<ClientField, "required" | "invalid" | "tooLong">>;
export type UpdateClientInput = ClientDetails &
  Readonly<{
    businessKey: string;
    expectedUpdatedAt: string;
    idempotencyKey: string;
  }>;
export type ClientValidation =
  | Readonly<{ kind: "VALID"; input: UpdateClientInput }>
  | Readonly<{ kind: "INVALID"; errors: ClientErrors }>;

export function validateClientUpdate(
  raw: unknown,
  clientTypes: readonly FirmListEntry[],
): ClientValidation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { kind: "INVALID", errors: {} };
  const input = raw as Record<string, unknown>;
  if (
    Object.keys(input).some(
      (key) =>
        ![...CLIENT_DETAIL_FIELDS, "businessKey", "expectedUpdatedAt", "idempotencyKey"].includes(
          key,
        ),
    ) ||
    typeof input.businessKey !== "string" ||
    !BUSINESS_KEY.test(input.businessKey) ||
    typeof input.idempotencyKey !== "string" ||
    !IDEMPOTENCY_KEY.test(input.idempotencyKey) ||
    typeof input.expectedUpdatedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.expectedUpdatedAt) ||
    !Number.isFinite(Date.parse(input.expectedUpdatedAt))
  )
    return { kind: "INVALID", errors: {} };
  const errors: ClientErrors = {};
  const details = {} as Record<ClientField, string>;
  const limits: Record<ClientField, number> = {
    nameEn: 200,
    nameZhTw: 200,
    clientType: 128,
    contactPerson: 200,
    phone: 80,
    email: 254,
    address: 1000,
    taxId: 8,
    note: 4000,
  };
  for (const field of CLIENT_DETAIL_FIELDS) {
    if (typeof input[field] !== "string") {
      errors[field] = "invalid";
      continue;
    }
    const value = input[field].trim();
    details[field] = value;
    const required = ["nameEn", "nameZhTw", "clientType"].includes(field);
    if (required && !value) errors[field] = "required";
    else if (value.length > limits[field]) errors[field] = "tooLong";
    else if (
      (field === "address" || field === "note"
        ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
        : /[\u0000-\u001f\u007f]/
      ).test(value)
    )
      errors[field] = "invalid";
  }
  if (details.clientType && !clientTypes.some((type) => type.key === details.clientType))
    errors.clientType = "invalid";
  if (details.taxId && !/^[0-9]{8}$/.test(details.taxId)) errors.taxId = "invalid";
  if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) errors.email = "invalid";
  return Object.keys(errors).length
    ? { kind: "INVALID", errors }
    : {
        kind: "VALID",
        input: {
          ...details,
          businessKey: input.businessKey,
          expectedUpdatedAt: input.expectedUpdatedAt,
          idempotencyKey: input.idempotencyKey,
        },
      };
}

export function validateClientSearch(
  raw: unknown,
): Readonly<{ search: string; page: number }> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  if (
    Object.keys(input).some((key) => !["search", "page"].includes(key)) ||
    typeof input.search !== "string" ||
    input.search.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(input.search) ||
    typeof input.page !== "number" ||
    !Number.isInteger(input.page) ||
    input.page < 1 ||
    input.page > 10000
  )
    return null;
  return { search: input.search.trim(), page: input.page };
}
