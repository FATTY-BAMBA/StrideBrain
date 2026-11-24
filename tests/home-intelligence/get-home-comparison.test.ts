import { describe, expect, it, vi } from "vitest";
import { GetHomeComparison } from "@/modules/home-intelligence/application/get-home-comparison";
import { ActiveProjectContextService } from "@/modules/comparisons/application/active-project-context-service";
import {
  sha256,
  permissionFingerprint,
  profileFingerprint,
} from "@/modules/comparisons/application/fingerprints";
import type {
  ComparisonProjectProfile,
  Stage4ComparisonResult,
} from "@/modules/comparisons/domain/contracts";
import { jobContext } from "../projects/job-fixture";

const project = {
  id: "job-internal",
  organizationId: "org_horizon",
  businessKey: "J-OWN",
  recordVersion: 1,
};
const context = jobContext({ role: "ORGANIZATION_ADMIN" });
const profile: ComparisonProjectProfile = {
  internalId: project.id,
  organizationId: project.organizationId,
  businessKey: project.businessKey,
  nameEn: "Own job",
  nameZhTw: "目前專案",
  comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
  subtype: "RETAIL_FLAGSHIP",
  status: "ACTIVE",
  location: { city: "Taipei City" },
  areaValue: "640.000",
  areaUnit: "m2",
  currency: "TWD",
  metadataAuthority: "HUMAN_REVIEWED",
  dataClassification: "DEMO_SYNTHETIC",
  scopeCategoryIds: ["SIGNAGE"],
  commercialCategoryIds: ["SIGNAGE"],
  materialIds: [],
  supplierIds: [],
  factorEvidence: {},
  recordVersion: "job-updated-at|quote-v1|quote-created-at",
};
function setup() {
  const comparison = {
    run: { id: "saved" },
    activeContext: {
      projectKey: project.businessKey,
      permissionFingerprint: permissionFingerprint(context, project.id),
      sourceFingerprint: profileFingerprint(profile),
      relatedTypeFingerprint: sha256({ relatedSubtypeKeys: [] }),
    },
  } as Stage4ComparisonResult;
  const projects = { getAuthorizedByBusinessKey: vi.fn().mockResolvedValue(project) };
  const latest = {
    findLatest: vi.fn().mockResolvedValue({ comparisonRunId: "saved", enrichmentRunId: "econ" }),
  };
  const comparisons = {
    getAuthorizedResult: vi.fn().mockResolvedValue(comparison),
    persistComplete: vi.fn(),
  };
  const economics = {
    getAuthorizedResult: vi.fn().mockResolvedValue(null),
    persistComplete: vi.fn(),
  };
  const profiles = {
    getActiveComparisonProfile: vi
      .fn()
      .mockResolvedValue({ profile, relatedSubtypeKeys: [], activeQuoteVersionKey: "quote-v1" }),
    listAuthorizedHistoricalProfiles: vi.fn(),
  };
  // A later calendar date must not invalidate unchanged active-job records.
  const active = new ActiveProjectContextService(profiles, () => new Date("2027-01-02T00:00:00Z"));
  return {
    comparison,
    projects,
    latest,
    comparisons,
    economics,
    profiles,
    service: new GetHomeComparison(projects, latest, comparisons, economics, active),
  };
}
describe("saved Home comparison validation without replay", () => {
  it("invalidates changed related types separately from the job's source fingerprint", async () => {
    const f = setup();
    f.profiles.getActiveComparisonProfile.mockResolvedValue({
      profile,
      relatedSubtypeKeys: ["new-related-type"],
    });
    expect(f.comparison.activeContext.sourceFingerprint).toBe(profileFingerprint(profile));
    expect(await f.service.execute(context, project.businessKey)).toEqual({ kind: "OUT_OF_DATE" });
    expect(f.economics.getAuthorizedResult).not.toHaveBeenCalled();
    expect(f.profiles.listAuthorizedHistoricalProfiles).not.toHaveBeenCalled();
  });
  it("keeps the same member's unchanged records current across a date change", async () => {
    const f = setup();
    expect(await f.service.execute(context, project.businessKey)).toEqual({
      kind: "AVAILABLE",
      comparison: f.comparison,
    });
    expect(f.profiles.getActiveComparisonProfile).toHaveBeenCalledWith(context, project.id);
    expect(f.profiles.listAuthorizedHistoricalProfiles).not.toHaveBeenCalled();
    expect(f.comparisons.persistComplete).not.toHaveBeenCalled();
    expect(f.economics.persistComplete).not.toHaveBeenCalled();
  });
  it("rejects another member's saved result before reading economics", async () => {
    const f = setup();
    expect(
      await f.service.execute({ ...context, membershipId: "another-member" }, project.businessKey),
    ).toEqual({ kind: "OUT_OF_DATE" });
    expect(f.economics.getAuthorizedResult).not.toHaveBeenCalled();
  });
  it("rejects a result saved before the active quote version changed", async () => {
    const f = setup();
    f.profiles.getActiveComparisonProfile.mockResolvedValue({
      profile: { ...profile, recordVersion: "job-updated-at|quote-v2|quote-created-at" },
      activeQuoteVersionKey: "quote-v2",
      relatedSubtypeKeys: [],
    });
    expect(await f.service.execute(context, project.businessKey)).toEqual({ kind: "OUT_OF_DATE" });
    expect(f.economics.getAuthorizedResult).not.toHaveBeenCalled();
  });
  it("does not invent missing freshness metadata for a legacy snapshot", async () => {
    const f = setup();
    f.comparisons.getAuthorizedResult.mockResolvedValue({
      ...f.comparison,
      activeContext: { projectKey: project.businessKey },
    });
    expect(await f.service.execute(context, project.businessKey)).toEqual({ kind: "OUT_OF_DATE" });
  });
  it("keeps authorization before any saved-result or current-profile read", async () => {
    const f = setup();
    expect(
      await f.service.execute({ ...context, capabilities: new Set() }, project.businessKey),
    ).toBeNull();
    expect(f.projects.getAuthorizedByBusinessKey).not.toHaveBeenCalled();
    expect(f.latest.findLatest).not.toHaveBeenCalled();
    expect(f.profiles.getActiveComparisonProfile).not.toHaveBeenCalled();
  });
});
