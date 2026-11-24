import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { validateFirmListChange } from "@/modules/firm-lists/domain/list-change";
import {
  ChangeFirmList,
  GetFirmListSettings,
} from "@/modules/firm-lists/application/manage-firm-lists";
import { GetFirmLists } from "@/modules/firm-lists/application/get-firm-lists";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import { jobContext } from "../projects/job-fixture";

const input = () => ({
  kind: "JOB_TYPE",
  key: null,
  nameEn: "Residential",
  nameZhTw: "住宅",
  sortOrder: 9,
  active: true,
  relatedKeys: [],
  expectedRevision: "a".repeat(64),
  idempotencyKey: randomUUID(),
});
describe("firm list changes", () => {
  it("bounds names, order, immutable selectors and related keys", () => {
    expect(validateFirmListChange(input()).kind).toBe("VALID");
    for (const invalid of [
      { nameEn: "" },
      { nameZhTw: "x".repeat(201) },
      { nameEn: "bad\nname" },
      { key: "" },
      { sortOrder: -1 },
      { sortOrder: 0.5 },
      { sortOrder: 10001 },
      { active: "false" },
      { relatedKeys: ["same", "same"] },
      { key: "self", relatedKeys: ["self"] },
      { kind: "QUOTE_UNIT", relatedKeys: ["other"] },
      { organizationId: "foreign" },
      { expectedRevision: "invalid" },
      { idempotencyKey: "invalid" },
      { kind: "DELETE" },
    ])
      expect(validateFirmListChange({ ...input(), ...invalid }).kind).toBe("INVALID");
    expect(
      validateFirmListChange({
        kind: "AREA_UNIT",
        areaDisplayUnit: "ping",
        expectedRevision: "a".repeat(64),
        idempotencyKey: randomUUID(),
      }).kind,
    ).toBe("VALID");
    expect(
      validateFirmListChange({
        kind: "AREA_UNIT",
        areaDisplayUnit: "ft2",
        expectedRevision: "a".repeat(64),
        idempotencyKey: randomUUID(),
      }).kind,
    ).toBe("INVALID");
  });
  it.each(["VIEWER", "PROJECT_MANAGER_ESTIMATOR", "FINANCIAL_REVIEWER"] as const)(
    "denies %s settings reads and writes before the repository",
    async (role) => {
      const repository = { read: vi.fn(), referencedCategories: vi.fn(), changeWithAudit: vi.fn() },
        context = jobContext({ role, capabilities: roleBundle(role) });
      expect(await new GetFirmListSettings(repository).execute(context)).toEqual({
        kind: "UNAVAILABLE",
      });
      expect(await new ChangeFirmList(repository).execute(context, input())).toEqual({
        kind: "UNAVAILABLE",
      });
      expect(repository.read).not.toHaveBeenCalled();
      expect(repository.changeWithAudit).not.toHaveBeenCalled();
    },
  );
  it("requires the capability for an owner, and project access for general list readers", async () => {
    const repository = { read: vi.fn(), referencedCategories: vi.fn(), changeWithAudit: vi.fn() },
      context = jobContext({ role: "ORGANIZATION_ADMIN", capabilities: new Set() });
    expect(await new GetFirmListSettings(repository).execute(context)).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(await new GetFirmLists(repository).execute(context)).toEqual({ kind: "UNAVAILABLE" });
    expect(await new ChangeFirmList(repository).execute(context, input())).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(repository.read).not.toHaveBeenCalled();
    expect(repository.changeWithAudit).not.toHaveBeenCalled();
  });
  it("contains repository failures", async () => {
    const repository = {
        read: vi.fn().mockRejectedValue(new Error("private")),
        referencedCategories: vi.fn(),
        changeWithAudit: vi.fn().mockRejectedValue(new Error("private")),
      },
      context = jobContext({
        role: "ORGANIZATION_ADMIN",
        capabilities: roleBundle("ORGANIZATION_ADMIN"),
      });
    expect(await new GetFirmListSettings(repository).execute(context)).toEqual({ kind: "FAILED" });
    expect(await new GetFirmLists(repository).execute(context)).toEqual({ kind: "FAILED" });
    expect(await new ChangeFirmList(repository).execute(context, input())).toEqual({
      kind: "FAILED",
    });
  });
});
