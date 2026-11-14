import { describe, expect, it, vi } from "vitest";

import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

function resolvedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    organizationId: "org_horizon",
    membershipId: "membership_horizon_mei",
    tokenHash: "a".repeat(64),
    preferredLocale: "zh-TW",
    issuedAt: new Date("2026-11-14T17:00:00Z"),
    expiresAt: new Date("2026-11-14T22:00:00Z"),
    revokedAt: null,
    organization: {
      dataClassification: "DEMO_SYNTHETIC",
      primaryLocale: "zh-TW",
    },
    membership: {
      id: "membership_horizon_mei",
      organizationId: "org_horizon",
      active: true,
      role: "PROJECT_MANAGER_ESTIMATOR",
      person: {
        id: "person_horizon_mei",
        organizationId: "org_horizon",
        active: true,
      },
      capabilityGrants: [
        {
          organizationId: "org_horizon",
          capability: "commercial:actual-read",
          effect: "ALLOW",
        },
      ],
      assignments: [
        {
          organizationId: "org_horizon",
          projectId: "prj_xinyi_026",
          canReadActuals: true,
          canCreateAction: true,
        },
      ],
    },
    ...overrides,
  };
}

function databaseWithSession(value: unknown): PrismaDemoSessionDatabase {
  return {
    demoSession: {
      findUnique: vi.fn().mockResolvedValue(value),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    membership: { findUnique: vi.fn() },
  } as unknown as PrismaDemoSessionDatabase;
}

describe("PrismaDemoSessionRepository", () => {
  it("loads current organization-consistent grants and assignments", async () => {
    const database = databaseWithSession(resolvedRow());
    const repository = new PrismaDemoSessionRepository(database);

    const result = await repository.findByTokenHash("a".repeat(64));

    expect(database.demoSession.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: "a".repeat(64) } }),
    );
    expect(result?.grants).toEqual([
      { capability: "commercial:actual-read", effect: "ALLOW" },
    ]);
    expect(result?.assignments).toEqual([
      {
        projectId: "prj_xinyi_026",
        canReadActuals: true,
        canCreateAction: true,
      },
    ]);
  });

  it.each([
    [
      "membership ID mismatch",
      resolvedRow({
        membership: {
          ...resolvedRow().membership,
          id: "membership_other",
        },
      }),
    ],
    [
      "membership organization mismatch",
      resolvedRow({
        membership: {
          ...resolvedRow().membership,
          organizationId: "org_northern",
        },
      }),
    ],
    [
      "person organization mismatch",
      resolvedRow({
        membership: {
          ...resolvedRow().membership,
          person: {
            ...resolvedRow().membership.person,
            organizationId: "org_northern",
          },
        },
      }),
    ],
    [
      "grant organization mismatch",
      resolvedRow({
        membership: {
          ...resolvedRow().membership,
          capabilityGrants: [
            {
              organizationId: "org_northern",
              capability: "commercial:actual-read",
              effect: "ALLOW",
            },
          ],
        },
      }),
    ],
    [
      "assignment organization mismatch",
      resolvedRow({
        membership: {
          ...resolvedRow().membership,
          assignments: [
            {
              organizationId: "org_northern",
              projectId: "prj_xinyi_026",
              canReadActuals: true,
              canCreateAction: true,
            },
          ],
        },
      }),
    ],
    [
      "unknown grant capability",
      resolvedRow({
        membership: {
          ...resolvedRow().membership,
          capabilityGrants: [
            {
              organizationId: "org_horizon",
              capability: "browser:choose-role",
              effect: "ALLOW",
            },
          ],
        },
      }),
    ],
  ])("fails closed for %s", async (_label, row) => {
    const repository = new PrismaDemoSessionRepository(databaseWithSession(row));
    expect(await repository.findByTokenHash("a".repeat(64))).toBeNull();
  });

  it("refuses issuance when membership and person organizations disagree", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "membership_horizon_mei",
      organizationId: "org_horizon",
      active: true,
      organization: { dataClassification: "DEMO_SYNTHETIC" },
      person: {
        id: "person_horizon_mei",
        organizationId: "org_northern",
        active: true,
      },
    });
    const database = {
      demoSession: {
        findUnique: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      membership: { findUnique },
    } as unknown as PrismaDemoSessionDatabase;
    const repository = new PrismaDemoSessionRepository(database);

    expect(
      await repository.getIssuableMembership("membership_horizon_mei"),
    ).toBeNull();
  });

  it("persists a SHA-256 hash and never accepts a raw token field", async () => {
    const create = vi.fn().mockResolvedValue({});
    const database = {
      demoSession: {
        findUnique: vi.fn(),
        create,
        updateMany: vi.fn(),
      },
      membership: { findUnique: vi.fn() },
    } as unknown as PrismaDemoSessionDatabase;
    const repository = new PrismaDemoSessionRepository(database);

    await repository.createSession({
      sessionId: "session-1",
      organizationId: "org_horizon",
      membershipId: "membership_horizon_mei",
      tokenHash: "a".repeat(64),
      preferredLocale: "zh-TW",
      issuedAt: new Date("2026-11-14T17:00:00Z"),
      expiresAt: new Date("2026-11-14T22:00:00Z"),
    });

    const data = create.mock.calls[0]?.[0]?.data;
    expect(data.tokenHash).toBe("a".repeat(64));
    expect(data).not.toHaveProperty("token");
    expect(data).not.toHaveProperty("secret");
  });

  it("revokes only an active matching session", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const database = {
      demoSession: {
        findUnique: vi.fn(),
        create: vi.fn(),
        updateMany,
      },
      membership: { findUnique: vi.fn() },
    } as unknown as PrismaDemoSessionDatabase;
    const repository = new PrismaDemoSessionRepository(database);
    const revokedAt = new Date("2026-11-14T18:00:00Z");

    expect(await repository.revokeSession("session-1", revokedAt)).toBe(true);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "session-1", revokedAt: null },
      data: { revokedAt },
    });
  });
});
