import { describe, expect, it } from "vitest";

import { AuthorizationService, toPublicAuthorizationResult } from "@/modules/authorization/authorization-service";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: "request-1",
    userId: "user-1",
    membershipId: "membership-1",
    organizationId: "org_horizon",
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: new Set([
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
    assignedProjectIds: new Set(["prj_xinyi_026"]),
    projectAssignments: new Map([
      [
        "prj_xinyi_026",
        {
          projectId: "prj_xinyi_026",
          canReadActuals: true,
          canCreateAction: true,
        },
      ],
    ]),
    locale: "zh-TW",
    dataMode: "DEMO_SYNTHETIC",
    ...overrides,
  };
}

const service = new AuthorizationService();

describe("AuthorizationService", () => {
  it("allows Mei's assigned hero project with full actual and evidence scope", () => {
    expect(service.canReadProject(context(), "prj_xinyi_026")).toEqual({
      allowed: true,
      internalReason: "ALLOWED",
      commercialScope: "FULL_ACTUAL",
      evidenceScope: "AUTHORIZED",
    });
    expect(service.canRunComparison(context(), "prj_xinyi_026").allowed).toBe(
      true,
    );
  });

  it("fails closed for an unassigned project", () => {
    const decision = service.canReadProject(context(), "prj_neihu_021");
    expect(decision.allowed).toBe(false);
    expect(decision.internalReason).toBe("MISSING_ASSIGNMENT");
    expect(toPublicAuthorizationResult(decision)).toEqual({
      allowed: false,
      error: "PROJECT_UNAVAILABLE",
    });
  });

  it("gives unauthorized and nonexistent projects the same public result", () => {
    const unauthorized = service.canReadProject(context(), "prj_northern_restricted");
    const nonexistent = service.canReadProject(context(), "does_not_exist");
    expect(toPublicAuthorizationResult(unauthorized)).toEqual(
      toPublicAuthorizationResult(nonexistent),
    );
    expect(toPublicAuthorizationResult(unauthorized)).not.toHaveProperty(
      "projectId",
    );
  });

  it("redacts Viewer economics and denies every internal-review write", () => {
    const viewer = context({
      role: "VIEWER",
      capabilities: new Set(["project:read", "project:compare", "evidence:read"]),
      projectAssignments: new Map([
        [
          "prj_xinyi_026",
          {
            projectId: "prj_xinyi_026",
            canReadActuals: false,
            canCreateAction: false,
          },
        ],
      ]),
    });

    expect(service.canReadProject(viewer, "prj_xinyi_026")).toMatchObject({
      allowed: true,
      commercialScope: "NONE",
      evidenceScope: "NON_SENSITIVE",
    });
    expect(
      service.canReadCommercial(viewer, "prj_xinyi_026", "ACTUAL"),
    ).toMatchObject({ allowed: false, internalReason: "ACTUAL_READ_DENIED" });
    expect(service.canProposeInternalReview(viewer, "prj_xinyi_026")).toEqual({
      allowed: false,
      publicError: "ACTION_NOT_AUTHORIZED",
      internalReason: "ACTION_ASSIGNMENT_DENIED",
    });
    expect(service.canCreateInternalReview(viewer, "prj_xinyi_026").allowed).toBe(
      false,
    );
    expect(service.canAssignInternalReview(viewer, "prj_xinyi_026").allowed).toBe(
      false,
    );
  });

  it("requires both assignment permission and action capabilities", () => {
    const assignmentDenied = context({
      projectAssignments: new Map([
        [
          "prj_xinyi_026",
          {
            projectId: "prj_xinyi_026",
            canReadActuals: true,
            canCreateAction: false,
          },
        ],
      ]),
    });
    expect(
      service.canProposeInternalReview(assignmentDenied, "prj_xinyi_026"),
    ).toMatchObject({
      allowed: false,
      internalReason: "ACTION_ASSIGNMENT_DENIED",
    });

    const capabilityDenied = context({
      capabilities: new Set([
        "project:read",
        "project:compare",
        "evidence:read",
      ]),
    });
    expect(
      service.canProposeInternalReview(capabilityDenied, "prj_xinyi_026"),
    ).toMatchObject({ allowed: false, internalReason: "MISSING_CAPABILITY" });
  });

  it("allows only organization administrators to bypass explicit assignment", () => {
    const admin = context({
      role: "ORGANIZATION_ADMIN",
      assignedProjectIds: new Set(),
      projectAssignments: new Map(),
    });
    expect(service.canReadProject(admin, "prj_neihu_021").allowed).toBe(true);

    const reviewer = context({
      role: "FINANCIAL_REVIEWER",
      assignedProjectIds: new Set(),
      projectAssignments: new Map(),
    });
    expect(service.canReadProject(reviewer, "prj_neihu_021").allowed).toBe(false);
  });
});
