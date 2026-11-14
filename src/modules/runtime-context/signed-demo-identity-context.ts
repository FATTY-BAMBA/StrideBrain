import { randomUUID } from "node:crypto";

import type { Locale } from "@/modules/localization/config";
import { resolveCapabilities } from "@/modules/runtime-context/capabilities";
import type {
  DataMode,
  IdentityContextPort,
  ProjectAssignmentGrant,
  RuntimeContext,
} from "@/modules/runtime-context/contracts";
import { readCookieValue } from "@/modules/runtime-context/session-cookie";
import type { DemoSessionRepositoryPort } from "@/modules/runtime-context/session-repository";
import { verifySignedSessionToken } from "@/modules/runtime-context/session-token";

function safeLocale(value: string): Locale {
  return value === "en" ? "en" : "zh-TW";
}

function dataModeFor(
  classification: string,
): DataMode {
  return classification === "DEMO_SYNTHETIC"
    ? "DEMO_SYNTHETIC"
    : "TENANT_PRIVATE";
}

function assignmentMap(
  assignments: readonly ProjectAssignmentGrant[],
): ReadonlyMap<string, ProjectAssignmentGrant> {
  return new Map(assignments.map((assignment) => [assignment.projectId, assignment]));
}

/**
 * The browser supplies only an opaque signed cookie. Organization, membership,
 * role, grants, and assignments are loaded from current server-side records on
 * every resolution.
 */
export class SignedDemoIdentityContext implements IdentityContextPort {
  constructor(
    private readonly repository: DemoSessionRepositoryPort,
    private readonly signingSecret: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async resolve(request: Request): Promise<RuntimeContext | null> {
    const token = readCookieValue(request);
    if (!token) return null;

    const verified = verifySignedSessionToken(this.signingSecret, token);
    if (!verified) return null;

    const record = await this.repository.findByTokenHash(verified.tokenHash);
    if (!record) return null;
    if (record.sessionId !== verified.sessionId) return null;
    if (record.tokenHash !== verified.tokenHash) return null;

    const now = this.now();
    if (record.revokedAt) return null;
    if (record.expiresAt.getTime() <= now.getTime()) return null;
    if (!record.membershipActive || !record.personActive) return null;
    if (record.organizationDataClassification !== "DEMO_SYNTHETIC") return null;

    const capabilities = resolveCapabilities(record.role, record.grants);
    const projects = assignmentMap(record.assignments);

    return Object.freeze({
      requestId: randomUUID(),
      userId: record.personId,
      membershipId: record.membershipId,
      organizationId: record.organizationId,
      role: record.role,
      capabilities,
      assignedProjectIds: new Set(projects.keys()),
      projectAssignments: projects,
      locale: safeLocale(record.preferredLocale || record.organizationPrimaryLocale),
      dataMode: dataModeFor(record.organizationDataClassification),
    });
  }
}
