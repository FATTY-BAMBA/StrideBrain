import type { Role, RuntimeContext } from "@/modules/runtime-context/contracts";
import { normalizeSignInEmail } from "@/modules/sign-in/domain/policy";
export const PEOPLE_ROLES: readonly Role[] = [
  "ORGANIZATION_ADMIN",
  "PROJECT_MANAGER_ESTIMATOR",
  "FINANCIAL_REVIEWER",
  "VIEWER",
];
export type PeopleChange = {
  operation:
    "invite" | "resend" | "cancel" | "role" | "deactivate" | "reactivate" | "access" | "update";
  membershipId?: string;
  name?: string;
  email?: string;
  role?: Role;
  assignments?: { projectId: string; canReadActuals: boolean; canCreateAction: boolean }[];
  idempotencyKey: string;
};
export function canManagePeople(context: RuntimeContext) {
  return context.role === "ORGANIZATION_ADMIN" && context.capabilities.has("settings:manage");
}
export function parsePeopleChange(value: unknown): PeopleChange | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (
    Object.keys(data).some(
      (k) =>
        ![
          "operation",
          "membershipId",
          "name",
          "email",
          "role",
          "assignments",
          "idempotencyKey",
        ].includes(k),
    )
  )
    return null;
  if (typeof data.idempotencyKey !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(data.idempotencyKey))
    return null;
  if (
    ![
      "invite",
      "resend",
      "cancel",
      "role",
      "deactivate",
      "reactivate",
      "access",
      "update",
    ].includes(String(data.operation))
  )
    return null;
  if (
    data.operation !== "invite" &&
    (typeof data.membershipId !== "string" || data.membershipId.length > 128)
  )
    return null;
  if (
    ["invite", "role", "update"].includes(String(data.operation)) &&
    !PEOPLE_ROLES.includes(data.role as Role)
  )
    return null;
  if (
    ["invite", "update"].includes(String(data.operation)) &&
    (typeof data.name !== "string" ||
      !data.name.trim() ||
      data.name.length > 160 ||
      (data.operation === "invite" && !normalizeSignInEmail(data.email)))
  )
    return null;
  if (
    data.assignments !== undefined &&
    (!Array.isArray(data.assignments) ||
      data.assignments.length > 500 ||
      data.assignments.some(
        (a) =>
          !a ||
          typeof a.projectId !== "string" ||
          a.projectId.length > 128 ||
          typeof a.canReadActuals !== "boolean" ||
          typeof a.canCreateAction !== "boolean" ||
          Object.keys(a).some(
            (k) => !["projectId", "canReadActuals", "canCreateAction"].includes(k),
          ),
      ))
  )
    return null;
  if (
    ["invite", "access", "update"].includes(String(data.operation)) &&
    !Array.isArray(data.assignments)
  )
    return null;
  return {
    ...data,
    ...(data.email ? { email: normalizeSignInEmail(data.email)! } : {}),
  } as PeopleChange;
}
