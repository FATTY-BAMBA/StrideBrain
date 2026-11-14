import { describe, expect, it, vi } from "vitest";

import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import { DEMO_SESSION_COOKIE_NAME } from "@/modules/runtime-context/session-cookie";
import type {
  DemoSessionRepositoryPort,
  ResolvedDemoSessionRecord,
} from "@/modules/runtime-context/session-repository";
import { issueSignedSessionToken } from "@/modules/runtime-context/session-token";

const SECRET = "stage2-context-secret-with-at-least-thirty-two-bytes";
const NOW = new Date("2026-11-14T18:00:00Z");

function record(
  tokenHash: string,
  sessionId: string,
  overrides: Partial<ResolvedDemoSessionRecord> = {},
): ResolvedDemoSessionRecord {
  return {
    sessionId,
    tokenHash,
    organizationId: "org_horizon",
    organizationDataClassification: "DEMO_SYNTHETIC",
    organizationPrimaryLocale: "zh-TW",
    membershipId: "membership_horizon_mei",
    membershipActive: true,
    role: "PROJECT_MANAGER_ESTIMATOR",
    personId: "person_horizon_mei",
    personActive: true,
    preferredLocale: "zh-TW",
    issuedAt: new Date("2026-11-14T17:00:00Z"),
    expiresAt: new Date("2026-11-14T22:00:00Z"),
    revokedAt: null,
    grants: [{ capability: "commercial:actual-read", effect: "ALLOW" }],
    assignments: [
      {
        projectId: "prj_xinyi_026",
        canReadActuals: true,
        canCreateAction: true,
      },
    ],
    ...overrides,
  };
}

function repositoryReturning(value: ResolvedDemoSessionRecord | null): DemoSessionRepositoryPort {
  return {
    findByTokenHash: vi.fn().mockResolvedValue(value),
    getIssuableMembership: vi.fn(),
    createSession: vi.fn(),
    revokeSession: vi.fn(),
  };
}

function requestFor(token: string, extraHeaders: Record<string, string> = {}) {
  return new Request("https://demo.primestrideai.com/zh-TW/projects/PRJ-XINYI-026", {
    headers: {
      cookie: `${DEMO_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
      ...extraHeaders,
    },
  });
}

function changeLastCharacter(value: string): string {
  const last = value.at(-1);
  return `${value.slice(0, -1)}${last === "A" ? "B" : "A"}`;
}

describe("SignedDemoIdentityContext", () => {
  it("resolves organization, role, grants, and assignments only from server records", async () => {
    const issued = issueSignedSessionToken(SECRET);
    const repository = repositoryReturning(record(issued.tokenHash, issued.sessionId));
    const resolver = new SignedDemoIdentityContext(repository, SECRET, () => NOW);

    const context = await resolver.resolve(
      requestFor(issued.token, {
        "x-organization-id": "org_attacker",
        "x-role": "ORGANIZATION_ADMIN",
        "x-capability": "settings:manage",
      }),
    );

    expect(context).not.toBeNull();
    expect(context?.organizationId).toBe("org_horizon");
    expect(context?.role).toBe("PROJECT_MANAGER_ESTIMATOR");
    expect(context?.capabilities.has("commercial:actual-read")).toBe(true);
    expect(context?.capabilities.has("settings:manage")).toBe(false);
    expect(context?.assignedProjectIds).toEqual(new Set(["prj_xinyi_026"]));
    expect(context?.projectAssignments?.get("prj_xinyi_026")).toEqual({
      projectId: "prj_xinyi_026",
      canReadActuals: true,
      canCreateAction: true,
    });
    expect(context?.dataMode).toBe("DEMO_SYNTHETIC");
  });

  it.each([
    ["missing", null],
    ["unknown", "unknown"],
    ["expired", "expired"],
    ["revoked", "revoked"],
    ["inactive membership", "membership"],
    ["inactive person", "person"],
    ["non-synthetic organization", "classification"],
  ])("fails closed for %s sessions", async (_label, state) => {
    const issued = issueSignedSessionToken(SECRET);
    let value: ResolvedDemoSessionRecord | null = record(issued.tokenHash, issued.sessionId);
    if (state === "unknown") value = null;
    if (state === "expired") {
      value = record(issued.tokenHash, issued.sessionId, {
        expiresAt: new Date("2026-11-14T17:59:59Z"),
      });
    }
    if (state === "revoked") {
      value = record(issued.tokenHash, issued.sessionId, { revokedAt: NOW });
    }
    if (state === "membership") {
      value = record(issued.tokenHash, issued.sessionId, {
        membershipActive: false,
      });
    }
    if (state === "person") {
      value = record(issued.tokenHash, issued.sessionId, { personActive: false });
    }
    if (state === "classification") {
      value = record(issued.tokenHash, issued.sessionId, {
        organizationDataClassification: "TENANT_PRIVATE",
      });
    }

    const resolver = new SignedDemoIdentityContext(repositoryReturning(value), SECRET, () => NOW);
    const request =
      state === null ? new Request("https://demo.primestrideai.com/") : requestFor(issued.token);
    expect(await resolver.resolve(request)).toBeNull();
  });

  it("rejects tampered credentials before repository lookup", async () => {
    const issued = issueSignedSessionToken(SECRET);
    const repository = repositoryReturning(record(issued.tokenHash, issued.sessionId));
    const resolver = new SignedDemoIdentityContext(repository, SECRET, () => NOW);
    const tampered = changeLastCharacter(issued.token);

    expect(await resolver.resolve(requestFor(tampered))).toBeNull();
    expect(repository.findByTokenHash).not.toHaveBeenCalled();
  });

  it("re-resolves grant changes on every request", async () => {
    const issued = issueSignedSessionToken(SECRET);
    const first = record(issued.tokenHash, issued.sessionId, {
      grants: [{ capability: "commercial:actual-read", effect: "ALLOW" }],
    });
    const second = record(issued.tokenHash, issued.sessionId, {
      grants: [{ capability: "commercial:actual-read", effect: "DENY" }],
    });
    const repository = repositoryReturning(first);
    vi.mocked(repository.findByTokenHash)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    const resolver = new SignedDemoIdentityContext(repository, SECRET, () => NOW);

    const firstContext = await resolver.resolve(requestFor(issued.token));
    const secondContext = await resolver.resolve(requestFor(issued.token));

    expect(firstContext?.capabilities.has("commercial:actual-read")).toBe(true);
    expect(secondContext?.capabilities.has("commercial:actual-read")).toBe(false);
    expect(repository.findByTokenHash).toHaveBeenCalledTimes(2);
  });
});
