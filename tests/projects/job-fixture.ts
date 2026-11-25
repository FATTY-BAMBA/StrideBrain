import { randomUUID } from "node:crypto";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { SCOPE_CATEGORIES, COMMERCIAL_CATEGORIES, seededFirmLists } from "@/fixtures/firm-lists";

export function jobInput() {
  return {
    businessKey: `JOB-${randomUUID()}`,
    name: "Synthetic retail job / 合成零售專案",
    comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
    subtype: "RETAIL_FLAGSHIP",
    areaQuantity: "640.000",
    areaUnit: "m2",
    currency: "TWD",
    locationCity: "TAIPEI_CITY",
    locationDistrict: "Xinyi District",
    scopeCategoryIds: [...SCOPE_CATEGORIES],
    commercialCategoryIds: [...COMMERCIAL_CATEGORIES],
    clientMode: "new" as const,
    clientBusinessKey: `CLIENT-${randomUUID()}`,
    clientName: "Synthetic client",
    clientType: "RETAIL",
    idempotencyKey: randomUUID(),
  };
}
export function jobContext(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: randomUUID(),
    userId: "person_horizon_mei",
    membershipId: "membership_horizon_mei",
    organizationId: "org_horizon",
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: roleBundle("PROJECT_MANAGER_ESTIMATOR"),
    locale: "en",
    dataMode: "DEMO_SYNTHETIC",
    firmLists: seededFirmLists,
    ...overrides,
  };
}
