import { describe, expect, it } from "vitest";

import { determineProjectWorkspaceState } from "@/modules/projects/domain/project-workspace";

describe("determineProjectWorkspaceState", () => {
  it("uses conflict, stale, partial, restriction, then ready precedence", () => {
    expect(
      determineProjectWorkspaceState({
        hasConflict: true,
        hasStaleEvidence: true,
        hasPartialData: true,
        hasRestrictedSections: true,
      }),
    ).toBe("CONFLICTED");

    expect(
      determineProjectWorkspaceState({
        hasConflict: false,
        hasStaleEvidence: true,
        hasPartialData: true,
        hasRestrictedSections: true,
      }),
    ).toBe("STALE");

    expect(
      determineProjectWorkspaceState({
        hasConflict: false,
        hasStaleEvidence: false,
        hasPartialData: true,
        hasRestrictedSections: true,
      }),
    ).toBe("PARTIAL");

    expect(
      determineProjectWorkspaceState({
        hasConflict: false,
        hasStaleEvidence: false,
        hasPartialData: false,
        hasRestrictedSections: true,
      }),
    ).toBe("PERMISSION_RESTRICTED");

    expect(
      determineProjectWorkspaceState({
        hasConflict: false,
        hasStaleEvidence: false,
        hasPartialData: false,
        hasRestrictedSections: false,
      }),
    ).toBe("READY");
  });
});
