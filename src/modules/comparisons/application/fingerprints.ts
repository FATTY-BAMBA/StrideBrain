import { createHash } from "node:crypto";

import type { ComparisonProjectProfile } from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function sha256(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function profileFingerprint(profile: ComparisonProjectProfile): string {
  return sha256({
    organizationId: profile.organizationId,
    businessKey: profile.businessKey,
    comparisonClass: profile.comparisonClass,
    subtype: profile.subtype,
    status: profile.status,
    location: profile.location,
    areaValue: profile.areaValue,
    areaUnit: profile.areaUnit,
    currency: profile.currency,
    completedAt: profile.completedAt ?? null,
    metadataAuthority: profile.metadataAuthority,
    dataClassification: profile.dataClassification,
    scopeCategoryIds: [...profile.scopeCategoryIds].sort(),
    commercialCategoryIds: [...profile.commercialCategoryIds].sort(),
    materialIds: [...profile.materialIds].sort(),
    supplierIds: [...profile.supplierIds].sort(),
    recordVersion: profile.recordVersion,
  });
}

export function permissionFingerprint(
  context: RuntimeContext,
  activeProjectId: string,
): string {
  const assignment = context.projectAssignments.get(activeProjectId);
  return sha256({
    organizationId: context.organizationId,
    membershipId: context.membershipId,
    role: context.role,
    capabilities: [...context.capabilities].sort(),
    activeProjectAssigned: context.assignedProjectIds.has(activeProjectId),
    assignment: assignment
      ? {
          projectId: assignment.projectId,
          canReadActuals: assignment.canReadActuals,
          canCreateAction: assignment.canCreateAction,
        }
      : null,
    dataMode: context.dataMode,
  });
}
