import { describe, expect, it, vi } from "vitest";

import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import type { DemoSessionRepositoryPort } from "@/modules/runtime-context/session-repository";

const SECRET = "stage2-issuer-secret-with-at-least-thirty-two-bytes";
const NOW = new Date("2026-11-14T18:00:00Z");

function repository(
  classification: "DEMO_SYNTHETIC" | "TENANT_PRIVATE" = "DEMO_SYNTHETIC",
): DemoSessionRepositoryPort {
  return {
    findByTokenHash: vi.fn(),
    getIssuableMembership: vi.fn().mockResolvedValue({
      organizationId: "org_horizon",
      organizationDataClassification: classification,
      membershipId: "membership_horizon_mei",
      membershipActive: true,
      personId: "person_horizon_mei",
      personActive: true,
    }),
    createSession: vi.fn().mockResolvedValue(undefined),
    revokeSession: vi.fn().mockResolvedValue(true),
  };
}

describe("DemoSessionService", () => {
  it("stores only a token hash and returns the raw credential only in a secure cookie", async () => {
    const repo = repository();
    const service = new DemoSessionService(repo, SECRET, () => NOW);

    const result = await service.issueForMembership("membership_horizon_mei", {
      locale: "en",
      ttlSeconds: 3600,
    });

    expect(result).not.toBeNull();
    expect(result?.expiresAt.toISOString()).toBe("2026-11-14T19:00:00.000Z");
    expect(result?.setCookie).toContain("__Host-stridebrain_demo_session=");
    expect(result?.setCookie).toContain("HttpOnly");
    expect(result?.setCookie).toContain("Secure");
    expect(result?.setCookie).toContain("SameSite=Lax");

    const persisted = vi.mocked(repo.createSession).mock.calls[0]?.[0];
    expect(persisted?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(persisted).not.toHaveProperty("token");
    expect(result?.setCookie).not.toContain(persisted?.tokenHash ?? "missing");
  });

  it("refuses inactive or non-synthetic memberships", async () => {
    const privateRepo = repository("TENANT_PRIVATE");
    const inactiveRepo = repository();
    vi.mocked(inactiveRepo.getIssuableMembership).mockResolvedValue({
      organizationId: "org_horizon",
      organizationDataClassification: "DEMO_SYNTHETIC",
      membershipId: "membership_horizon_mei",
      membershipActive: false,
      personId: "person_horizon_mei",
      personActive: true,
    });

    expect(
      await new DemoSessionService(privateRepo, SECRET, () => NOW).issueForMembership(
        "membership_horizon_mei",
      ),
    ).toBeNull();
    expect(
      await new DemoSessionService(inactiveRepo, SECRET, () => NOW).issueForMembership(
        "membership_horizon_mei",
      ),
    ).toBeNull();
    expect(privateRepo.createSession).not.toHaveBeenCalled();
    expect(inactiveRepo.createSession).not.toHaveBeenCalled();
  });

  it("caps session lifetime and revokes by opaque session ID", async () => {
    const repo = repository();
    const service = new DemoSessionService(repo, SECRET, () => NOW);
    const issued = await service.issueForMembership("membership_horizon_mei", {
      ttlSeconds: 60 * 60 * 72,
    });

    expect(issued?.expiresAt.toISOString()).toBe("2026-11-15T18:00:00.000Z");
    expect(await service.revoke("session-id")).toBe(true);
    expect(repo.revokeSession).toHaveBeenCalledWith("session-id", NOW);
  });
});
