import type { Capability, CapabilityGrantEffect, Role } from "@/modules/runtime-context/contracts";

export const ALL_CAPABILITIES = Object.freeze([
  "project:read",
  "project:create",
  "project:update",
  "project:compare",
  "quote:read",
  "quote:draft",
  "commercial:forecast-read",
  "commercial:actual-read",
  "evidence:read",
  "action:internal-review:propose",
  "action:internal-review:create",
  "action:assign",
  "authority:financial-conflict:resolve",
  "settings:manage",
] as const satisfies readonly Capability[]);

const CAPABILITY_SET = new Set<string>(ALL_CAPABILITIES);

export type CapabilityGrant = Readonly<{
  capability: Capability;
  effect: CapabilityGrantEffect;
}>;

const ROLE_BUNDLES: Readonly<Record<Role, ReadonlySet<Capability>>> = Object.freeze({
  ORGANIZATION_ADMIN: new Set(ALL_CAPABILITIES),
  PROJECT_MANAGER_ESTIMATOR: new Set<Capability>([
    "project:read",
    "project:create",
    "project:update",
    "project:compare",
    "quote:read",
    "quote:draft",
    "commercial:forecast-read",
    "evidence:read",
    "action:internal-review:propose",
    "action:internal-review:create",
    "action:assign",
  ]),
  FINANCIAL_REVIEWER: new Set<Capability>([
    "project:read",
    "project:compare",
    "quote:read",
    "commercial:forecast-read",
    "commercial:actual-read",
    "evidence:read",
    "action:internal-review:propose",
    "action:internal-review:create",
    "action:assign",
  ]),
  VIEWER: new Set<Capability>(["project:read", "project:compare", "evidence:read"]),
});

export function isCapability(value: string): value is Capability {
  return CAPABILITY_SET.has(value);
}

export function roleBundle(role: Role): ReadonlySet<Capability> {
  return new Set(ROLE_BUNDLES[role]);
}

/**
 * Resolve capabilities from a reviewed role bundle plus explicit membership
 * grants. DENY always wins, independent of record ordering.
 */
export function resolveCapabilities(
  role: Role,
  grants: readonly CapabilityGrant[],
): ReadonlySet<Capability> {
  const effective = new Set(roleBundle(role));
  const denied = new Set<Capability>();

  for (const grant of grants) {
    if (grant.effect === "DENY") denied.add(grant.capability);
  }

  for (const grant of grants) {
    if (grant.effect === "ALLOW" && !denied.has(grant.capability)) {
      effective.add(grant.capability);
    }
  }

  for (const capability of denied) effective.delete(capability);
  return effective;
}

export type PresentationCapabilityView = Readonly<{
  canReadProjects: boolean;
  canCompareProjects: boolean;
  canReadQuotes: boolean;
  canReadForecastCosts: boolean;
  canReadActualCosts: boolean;
  canInspectEvidence: boolean;
  canProposeInternalReview: boolean;
  canCreateInternalReview: boolean;
  canAssignInternalReview: boolean;
  canManageSettings: boolean;
}>;

/**
 * Bounded presentation hints only. Every server read/write must authorize again
 * against a fresh RuntimeContext.
 */
export function toPresentationCapabilityView(
  capabilities: ReadonlySet<Capability>,
): PresentationCapabilityView {
  return Object.freeze({
    canReadProjects: capabilities.has("project:read"),
    canCompareProjects: capabilities.has("project:compare"),
    canReadQuotes: capabilities.has("quote:read"),
    canReadForecastCosts: capabilities.has("commercial:forecast-read"),
    canReadActualCosts: capabilities.has("commercial:actual-read"),
    canInspectEvidence: capabilities.has("evidence:read"),
    canProposeInternalReview: capabilities.has("action:internal-review:propose"),
    canCreateInternalReview: capabilities.has("action:internal-review:create"),
    canAssignInternalReview: capabilities.has("action:assign"),
    canManageSettings: capabilities.has("settings:manage"),
  });
}
