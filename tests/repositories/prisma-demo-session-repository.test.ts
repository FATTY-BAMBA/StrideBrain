import { describe, expect, it, vi } from "vitest";

import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

describe("PrismaDemoSessionRepository", () => {
  it("loads current grants and assignments with the session", async () => {
    const findUnique = vi.fn().mockResolvedValue({
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
        active: true,
        role: "PROJECT_MANAGER_ESTIMATOR",
        person: { id: "person_horizon_mei", active: true },
        capabilityGrants: [
          { capability: "commercial:actual-read", effect: "ALLOW" },
          { capability: "unknown:capability", effect: "ALLOW" },
        ],
        assignments: [
          {
            projectId: "prj_xinyi_026",
            canReadActuals: true,
            canCreateAction: true,
          },
        ],
      },
    });
    const database = {
      demoSession: {
        findUnique,
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      membership: { findUnique: vi.fn() },
    } as unknown as PrismaDemoSessionDatabase;
    const repository = new PrismaDemoSessionRepository(database);

    const result = await repository.findByTokenHash("a".repeat(64));

    expect(findUnique).toHaveBeenCalledWith(
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
