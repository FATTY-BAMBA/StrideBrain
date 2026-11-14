import type {
  Capability,
  CapabilityGrantEffect,
  ProjectAssignmentGrant,
  Role,
} from "@/modules/runtime-context/contracts";
import { isCapability } from "@/modules/runtime-context/capabilities";
import type {
  CreateDemoSessionRecord,
  DemoSessionRepositoryPort,
  IssuableMembershipRecord,
  ResolvedDemoSessionRecord,
} from "@/modules/runtime-context/session-repository";

type PrismaGrantRow = {
  capability: string;
  effect: CapabilityGrantEffect;
};

type PrismaAssignmentRow = {
  projectId: string;
  canReadActuals: boolean;
  canCreateAction: boolean;
};

type PrismaResolvedSessionRow = {
  id: string;
  organizationId: string;
  membershipId: string;
  tokenHash: string;
  preferredLocale: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  organization: {
    dataClassification: ResolvedDemoSessionRecord["organizationDataClassification"];
    primaryLocale: string;
  };
  membership: {
    id: string;
    active: boolean;
    role: Role;
    person: {
      id: string;
      active: boolean;
    };
    capabilityGrants: PrismaGrantRow[];
    assignments: PrismaAssignmentRow[];
  };
};

type PrismaIssuableMembershipRow = {
  id: string;
  organizationId: string;
  active: boolean;
  organization: {
    dataClassification: IssuableMembershipRecord["organizationDataClassification"];
  };
  person: {
    id: string;
    active: boolean;
  };
};

export type PrismaDemoSessionDatabase = {
  demoSession: {
    findUnique(args: unknown): Promise<PrismaResolvedSessionRow | null>;
    create(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  membership: {
    findUnique(args: unknown): Promise<PrismaIssuableMembershipRow | null>;
  };
};

function validGrants(rows: readonly PrismaGrantRow[]) {
  return rows.flatMap((row) =>
    isCapability(row.capability)
      ? [{ capability: row.capability as Capability, effect: row.effect }]
      : [],
  );
}

function assignments(rows: readonly PrismaAssignmentRow[]): ProjectAssignmentGrant[] {
  return rows.map((row) => ({
    projectId: row.projectId,
    canReadActuals: row.canReadActuals,
    canCreateAction: row.canCreateAction,
  }));
}

export class PrismaDemoSessionRepository implements DemoSessionRepositoryPort {
  constructor(private readonly database: PrismaDemoSessionDatabase) {}

  async findByTokenHash(
    tokenHash: string,
  ): Promise<ResolvedDemoSessionRecord | null> {
    const row = await this.database.demoSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        organizationId: true,
        membershipId: true,
        tokenHash: true,
        preferredLocale: true,
        issuedAt: true,
        expiresAt: true,
        revokedAt: true,
        organization: {
          select: {
            dataClassification: true,
            primaryLocale: true,
          },
        },
        membership: {
          select: {
            id: true,
            active: true,
            role: true,
            person: { select: { id: true, active: true } },
            capabilityGrants: {
              select: { capability: true, effect: true },
            },
            assignments: {
              select: {
                projectId: true,
                canReadActuals: true,
                canCreateAction: true,
              },
            },
          },
        },
      },
    });

    if (!row) return null;
    return {
      sessionId: row.id,
      tokenHash: row.tokenHash,
      organizationId: row.organizationId,
      organizationDataClassification: row.organization.dataClassification,
      organizationPrimaryLocale: row.organization.primaryLocale,
      membershipId: row.membership.id,
      membershipActive: row.membership.active,
      role: row.membership.role,
      personId: row.membership.person.id,
      personActive: row.membership.person.active,
      preferredLocale: row.preferredLocale,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      grants: validGrants(row.membership.capabilityGrants),
      assignments: assignments(row.membership.assignments),
    };
  }

  async getIssuableMembership(
    membershipId: string,
  ): Promise<IssuableMembershipRecord | null> {
    const row = await this.database.membership.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        organizationId: true,
        active: true,
        organization: { select: { dataClassification: true } },
        person: { select: { id: true, active: true } },
      },
    });
    if (!row) return null;
    return {
      organizationId: row.organizationId,
      organizationDataClassification: row.organization.dataClassification,
      membershipId: row.id,
      membershipActive: row.active,
      personId: row.person.id,
      personActive: row.person.active,
    };
  }

  async createSession(input: CreateDemoSessionRecord): Promise<void> {
    await this.database.demoSession.create({
      data: {
        id: input.sessionId,
        organizationId: input.organizationId,
        membershipId: input.membershipId,
        tokenHash: input.tokenHash,
        preferredLocale: input.preferredLocale,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
      },
    });
  }

  async revokeSession(sessionId: string, revokedAt: Date): Promise<boolean> {
    const result = await this.database.demoSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt },
    });
    return result.count === 1;
  }
}
