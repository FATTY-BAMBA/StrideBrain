import { describe, expect, it } from "vitest";

import {
  resolveCapabilities,
  roleBundle,
  toPresentationCapabilityView,
} from "@/modules/runtime-context/capabilities";

describe("capability policy", () => {
  it("gives organization administrators the reviewed v0.1 bundle", () => {
    const capabilities = roleBundle("ORGANIZATION_ADMIN");
    expect(capabilities.has("commercial:actual-read")).toBe(true);
    expect(capabilities.has("authority:financial-conflict:resolve")).toBe(true);
    expect(capabilities.has("settings:manage")).toBe(true);
  });

  it("does not give actual-cost access to a project manager by default", () => {
    const capabilities = roleBundle("PROJECT_MANAGER_ESTIMATOR");
    expect(capabilities.has("project:compare")).toBe(true);
    expect(capabilities.has("commercial:forecast-read")).toBe(true);
    expect(capabilities.has("commercial:actual-read")).toBe(false);
  });

  it("adds Mei's actual-cost capability through an explicit allow", () => {
    const capabilities = resolveCapabilities("PROJECT_MANAGER_ESTIMATOR", [
      { capability: "commercial:actual-read", effect: "ALLOW" },
    ]);
    expect(capabilities.has("commercial:actual-read")).toBe(true);
  });

  it("makes explicit deny win regardless of grant ordering", () => {
    const grants = [
      { capability: "commercial:actual-read", effect: "ALLOW" as const },
      { capability: "commercial:actual-read", effect: "DENY" as const },
    ];
    expect(
      resolveCapabilities("FINANCIAL_REVIEWER", grants).has(
        "commercial:actual-read",
      ),
    ).toBe(false);
    expect(
      resolveCapabilities("FINANCIAL_REVIEWER", [...grants].reverse()).has(
        "commercial:actual-read",
      ),
    ).toBe(false);
  });

  it("keeps Viewer actual costs and action writes unavailable", () => {
    const capabilities = resolveCapabilities("VIEWER", [
      { capability: "commercial:actual-read", effect: "DENY" },
      { capability: "action:internal-review:propose", effect: "DENY" },
      { capability: "action:internal-review:create", effect: "DENY" },
      { capability: "action:assign", effect: "DENY" },
    ]);
    const view = toPresentationCapabilityView(capabilities);
    expect(view.canCompareProjects).toBe(true);
    expect(view.canReadActualCosts).toBe(false);
    expect(view.canProposeInternalReview).toBe(false);
    expect(view.canCreateInternalReview).toBe(false);
    expect(view.canAssignInternalReview).toBe(false);
  });
});
