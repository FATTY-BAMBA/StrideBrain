import type {
  Capability,
  CapabilityGrantEffect,
  ProjectAssignmentGrant,
  Role,
} from "@/modules/runtime-context/contracts";

export type SessionCapabilityGrantRecord = Readonly<{
  capability: Capability;
  effect: CapabilityGrantEffect;
}>;

export type ResolvedDemoSessionRecord = Readonly<{
  sessionId: string;
  tokenHash: string;
  organizationId: string;
  organizationDataClassification:
    | "DEMO_SYNTHETIC"
    | "PUBLIC_REFERENCE"
    | "TENANT_PRIVATE"
    | "TENANT_RESTRICTED"
    | "TENANT_APPROVED";
  organizationPrimaryLocale: string;
  membershipId: string;
  membershipActive: boolean;
  role: Role;
  personId: string;
  personActive: boolean;
  preferredLocale: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  grants: readonly SessionCapabilityGrantRecord[];
  assignments: readonly ProjectAssignmentGrant[];
}>;

export type IssuableMembershipRecord = Readonly<{
  organizationId: string;
  organizationDataClassification:
    | "DEMO_SYNTHETIC"
    | "PUBLIC_REFERENCE"
    | "TENANT_PRIVATE"
    | "TENANT_RESTRICTED"
    | "TENANT_APPROVED";
  membershipId: string;
  membershipActive: boolean;
  personId: string;
  personActive: boolean;
}>;

export type CreateDemoSessionRecord = Readonly<{
  sessionId: string;
  organizationId: string;
  membershipId: string;
  tokenHash: string;
  preferredLocale: "zh-TW" | "en";
  issuedAt: Date;
  expiresAt: Date;
}>;

export interface DemoSessionRepositoryPort {
  findByTokenHash(tokenHash: string): Promise<ResolvedDemoSessionRecord | null>;
  getIssuableMembership(
    membershipId: string,
  ): Promise<IssuableMembershipRecord | null>;
  createSession(input: CreateDemoSessionRecord): Promise<void>;
  revokeSession(sessionId: string, revokedAt: Date): Promise<boolean>;
}
