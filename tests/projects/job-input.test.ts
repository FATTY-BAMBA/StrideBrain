import { describe, expect, it, vi } from "vitest";
import {
  validateCreateProject,
  validateStageUpdate,
  JOB_FIELDS,
  SCOPE_CATEGORIES,
  COMMERCIAL_CATEGORIES,
} from "@/modules/projects/domain/job-input";
import { CreateProject } from "@/modules/projects/application/create-project";
import { UpdateProjectStage } from "@/modules/projects/application/update-project-stage";
import { resolveCapabilities, roleBundle } from "@/modules/runtime-context/capabilities";
import { jobContext, jobInput } from "./job-fixture";

describe("Job creation validation and application boundary", () => {
  it("accepts comparison-ready input and strips browser authority fields", () => {
    const input = jobInput();
    const result = validateCreateProject({
      ...input,
      organizationId: "foreign",
      membershipId: "admin",
      metadataAuthority: "RECONCILED_ACTUAL",
      stage: "COMPLETE",
    });
    expect(result.kind).toBe("VALID");
    if (result.kind === "VALID")
      expect(Object.keys(result.input).sort()).toEqual(
        [...JOB_FIELDS, "commercialCategoryIds"].sort(),
      );
  });
  it.each(JOB_FIELDS.filter((f) => f !== "locationDistrict"))("requires %s", (field) => {
    const input: Record<string, unknown> = jobInput();
    delete input[field];
    expect(validateCreateProject(input)).toMatchObject({
      kind: "INVALID",
      errors: { [field]: "required" },
    });
  });
  it.each(["0", "-1", "NaN", "Infinity", "1e3", "1.2345", "1000000000000000", "0x10"])(
    "rejects invalid or overflowing area %s",
    (areaQuantity) => {
      expect(validateCreateProject({ ...jobInput(), areaQuantity })).toMatchObject({
        kind: "INVALID",
        errors: { areaQuantity: "invalid" },
      });
    },
  );
  it.each(["0.001", "999999999999999.999"])("preserves exact decimal %s", (areaQuantity) => {
    expect(validateCreateProject({ ...jobInput(), areaQuantity })).toMatchObject({
      kind: "VALID",
      input: { areaQuantity },
    });
  });
  it.each([
    { comparisonClass: "RESIDENTIAL" },
    { subtype: "APARTMENT" },
    { currency: "USD" },
    { areaUnit: "坪" },
    { scopeCategoryIds: ["free text"] },
    { scopeCategoryIds: ["CUSTOM_MILLWORK", "CUSTOM_MILLWORK"] },
    { name: "x".repeat(201) },
    { locationCity: "x".repeat(121) },
    { businessKey: "../unsafe" },
    { businessKey: "new" },
    { idempotencyKey: "unsafe" },
  ])("rejects unsupported or unbounded values: %j", (values) => {
    expect(validateCreateProject({ ...jobInput(), ...values }).kind).toBe("INVALID");
  });
  it("does not require new-client fields for existing clients", () => {
    expect(
      validateCreateProject({
        ...jobInput(),
        clientMode: "existing",
        clientName: undefined,
        clientType: undefined,
      }).kind,
    ).toBe("VALID");
  });
  it.each([
    "ORGANIZATION_ADMIN",
    "PROJECT_MANAGER_ESTIMATOR",
    "VIEWER",
    "FINANCIAL_REVIEWER",
  ] as const)("respects the %s role bundle for both writes", async (role) => {
    const allowed = role === "ORGANIZATION_ADMIN" || role === "PROJECT_MANAGER_ESTIMATOR";
    const createWithAudit = vi.fn().mockResolvedValue({ kind: "CREATED", businessKey: "JOB" });
    const updateStageWithAudit = vi.fn().mockResolvedValue({ kind: "UPDATED" });
    const repository = { createWithAudit, updateStageWithAudit };
    const context = jobContext({ role, capabilities: roleBundle(role) });
    expect((await new CreateProject(repository).execute(context, jobInput())).kind).toBe(
      allowed ? "CREATED" : "UNAVAILABLE",
    );
    expect(
      (
        await new UpdateProjectStage(repository).execute(context, {
          ...jobInput(),
          stage: "DESIGN",
          expectedStage: "QUOTE_REVIEW",
        })
      ).kind,
    ).toBe(allowed ? "UPDATED" : "UNAVAILABLE");
    expect(createWithAudit).toHaveBeenCalledTimes(allowed ? 1 : 0);
    expect(updateStageWithAudit).toHaveBeenCalledTimes(allowed ? 1 : 0);
  });
  it("explicit capability denies win before input validation or storage", async () => {
    const repository = { createWithAudit: vi.fn(), updateStageWithAudit: vi.fn() };
    const context = jobContext({
      capabilities: resolveCapabilities("ORGANIZATION_ADMIN", [
        { capability: "project:create", effect: "DENY" },
        { capability: "project:update", effect: "DENY" },
      ]),
    });
    expect(await new CreateProject(repository).execute(context, null)).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(await new UpdateProjectStage(repository).execute(context, null)).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(repository.createWithAudit).not.toHaveBeenCalled();
    expect(repository.updateStageWithAudit).not.toHaveBeenCalled();
  });
  it("contains database failures independently of data mode", async () => {
    const repository = {
      createWithAudit: vi.fn().mockRejectedValue(new Error("SQL secret")),
      updateStageWithAudit: vi.fn().mockRejectedValue(new Error("SQL secret")),
    };
    expect(
      await new CreateProject(repository).execute(
        jobContext({ dataMode: "TENANT_PRIVATE" }),
        jobInput(),
      ),
    ).toEqual({ kind: "FAILED" });
    expect(await new CreateProject(repository).execute(jobContext(), jobInput())).toEqual({
      kind: "FAILED",
    });
    expect(
      await new UpdateProjectStage(repository).execute(jobContext(), {
        ...jobInput(),
        stage: "DESIGN",
        expectedStage: "QUOTE_REVIEW",
      }),
    ).toEqual({ kind: "FAILED" });
  });
  it.each(["DEMO_SYNTHETIC", "TENANT_PRIVATE"] as const)(
    "uses the same feature path for %s",
    async (dataMode) => {
      const repository = {
        createWithAudit: vi.fn().mockResolvedValue({ kind: "CREATED", businessKey: "JOB" }),
        updateStageWithAudit: vi.fn().mockResolvedValue({ kind: "UPDATED" }),
      };
      const context = jobContext({ dataMode });
      expect((await new CreateProject(repository).execute(context, jobInput())).kind).toBe(
        "CREATED",
      );
      expect(
        (
          await new UpdateProjectStage(repository).execute(context, {
            ...jobInput(),
            stage: "DESIGN",
            expectedStage: "QUOTE_REVIEW",
          })
        ).kind,
      ).toBe("UPDATED");
      expect(repository.createWithAudit.mock.calls[0]![0]).toBe(context);
      expect(repository.updateStageWithAudit.mock.calls[0]![0]).toBe(context);
    },
  );
  it("derives and deduplicates commercial categories from scopes, ignoring forged commercial choices", () => {
    const result = validateCreateProject({
      ...jobInput(),
      scopeCategoryIds: [...SCOPE_CATEGORIES],
      commercialCategoryIds: ["FORGED"],
    });
    expect(result).toMatchObject({
      kind: "VALID",
      input: { commercialCategoryIds: [...COMMERCIAL_CATEGORIES].sort() },
    });
    expect(
      validateCreateProject({
        ...jobInput(),
        scopeCategoryIds: ["SELECTIVE_DEMOLITION", "PARTITIONS_CEILINGS"],
      }),
    ).toMatchObject({ kind: "VALID", input: { commercialCategoryIds: ["DEMOLITION_CEILING"] } });
  });
  it.each([
    { stage: "COMPLETE", expectedStage: "QUOTE_REVIEW" },
    { stage: "DESIGN", expectedStage: "COMPLETE" },
  ])("reserves completion for close-job: %j", async (command) => {
    const repository = { createWithAudit: vi.fn(), updateStageWithAudit: vi.fn() };
    expect(validateStageUpdate({ ...jobInput(), ...command })).toBeNull();
    expect(
      await new UpdateProjectStage(repository).execute(jobContext(), { ...jobInput(), ...command }),
    ).toEqual({ kind: "INVALID" });
    expect(repository.updateStageWithAudit).not.toHaveBeenCalled();
  });
  it("bounds stage requests and rejects unknown stages", () => {
    expect(
      validateStageUpdate({ ...jobInput(), stage: "CUSTOM", expectedStage: "QUOTE_REVIEW" }),
    ).toBeNull();
    expect(
      validateStageUpdate({ ...jobInput(), stage: "COMPLETE", expectedStage: "CUSTOM" }),
    ).toBeNull();
  });
});
