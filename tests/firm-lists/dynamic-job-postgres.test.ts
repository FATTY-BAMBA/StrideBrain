import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { jobInput } from "../projects/job-fixture";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { createFirmListServices } from "@/lib/server/firm-list-services";
import { validateCreateProject } from "@/modules/projects/domain/job-input";
import { jobDraftChoices } from "@/modules/assistant/application/draft-job";
import { assistantTools } from "@/modules/assistant/application/read-tools";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("jobs use tenant list settings end to end", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  async function change(value: object) {
    const c = await db.actor();
    return createFirmListServices().change.execute(c, {
      ...value,
      expectedRevision: c.firmLists!.revision,
      idempotencyKey: randomUUID(),
    });
  }
  it("adds a type/category, creates a 100-ping job, then renames/retires without changing its keys or area", async () => {
    const fields = {
      key: null,
      nameEn: "Residential",
      nameZhTw: "住宅",
      sortOrder: 1,
      active: true,
      relatedKeys: [],
    };
    const type = await change({ ...fields, kind: "JOB_TYPE" }),
      category = await change({
        ...fields,
        kind: "WORK_CATEGORY",
        nameEn: "Water and power",
        nameZhTw: "水電",
        pricedUnderKey: null,
      });
    if (type.kind !== "SAVED" || category.kind !== "SAVED" || !type.key || !category.key)
      throw Error("SETTINGS_REQUIRED");
    expect((await change({ kind: "AREA_UNIT", areaDisplayUnit: "ping" })).kind).toBe("SAVED");
    const c = await db.actor(),
      input = {
        ...jobInput(),
        subtype: type.key,
        scopeCategoryIds: [category.key],
        commercialCategoryIds: [category.key],
        areaQuantity: "100",
        areaUnit: "ping",
      };
    expect((await createProjectWriteServices().create.execute(c, input)).kind).toBe("CREATED");
    const before = (
      await db.sql.query(
        'SELECT subtype,"areaQuantity"::text,"areaUnit","commercialCategoryIds" FROM "Project" WHERE "organizationId"=$1 AND "businessKey"=$2',
        [c.organizationId, input.businessKey],
      )
    ).rows[0];
    expect(before).toMatchObject({
      subtype: type.key,
      areaQuantity: "330.579",
      areaUnit: "m2",
      commercialCategoryIds: [category.key],
    });
    for (const locale of ["en", "zh-TW"] as const) {
      const result = await createProjectWorkspaceService().execute(
        { ...c, locale },
        input.businessKey,
      );
      expect(result.kind).toBe("AVAILABLE");
      if (result.kind !== "AVAILABLE") throw Error("WORKSPACE_REQUIRED");
      expect(result.workspace.project.area).toMatchObject({
        displayValue: "100",
        displayUnit: "坪",
      });
      expect(result.workspace.project.subtypeName).toBe(locale === "en" ? "Residential" : "住宅");
      expect(result.workspace.project.scopeCategories[0]?.name.display).toBe(
        locale === "en" ? "Water and power" : "水電",
      );
    }
    expect(JSON.stringify(jobDraftChoices(c.firmLists!))).toContain("住宅");
    expect(JSON.stringify(assistantTools(c.firmLists!))).toContain("水電");
    expect(
      (
        await change({
          ...fields,
          kind: "JOB_TYPE",
          key: type.key,
          nameEn: "Homes",
          nameZhTw: "住家",
          active: false,
        })
      ).kind,
    ).toBe("SAVED");
    expect(
      (
        await change({
          ...fields,
          kind: "WORK_CATEGORY",
          key: category.key,
          nameEn: "Building services",
          nameZhTw: "建築設備",
          pricedUnderKey: null,
          active: false,
        })
      ).kind,
    ).toBe("SAVED");
    const after = await db.actor();
    expect(validateCreateProject(input, after.firmLists!).kind).toBe("INVALID");
    expect(JSON.stringify(jobDraftChoices(after.firmLists!))).not.toContain(type.key);
    const old = await createProjectWorkspaceService().execute(
      { ...after, locale: "zh-TW" },
      input.businessKey,
    );
    expect(old.kind).toBe("AVAILABLE");
    if (old.kind === "AVAILABLE") {
      expect(old.workspace.project.subtypeName).toBe("住家");
      expect(old.workspace.project.scopeCategories[0]?.name.display).toBe("建築設備");
    }
    expect(
      (
        await db.sql.query(
          'SELECT subtype,"areaQuantity"::text,"areaUnit","commercialCategoryIds" FROM "Project" WHERE "businessKey"=$1',
          [input.businessKey],
        )
      ).rows[0],
    ).toEqual(before);
  });
});
