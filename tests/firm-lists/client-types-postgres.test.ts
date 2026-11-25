import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaFirmListsRepository } from "@/repositories/prisma/prisma-firm-lists-repository";
import { PrismaFirmListsWriteRepository } from "@/repositories/prisma/prisma-firm-lists-write-repository";
import { PrismaClientRepository } from "@/repositories/prisma/prisma-client-repository";
import {
  ChangeFirmList,
  GetFirmListSettings,
} from "@/modules/firm-lists/application/manage-firm-lists";
import {
  CLIENT_DETAIL_FIELDS,
  type UpdateClientInput,
} from "@/modules/clients/domain/client-input";
import { validateFirmListChange } from "@/modules/firm-lists/domain/list-change";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { jobInput } from "../projects/job-fixture";

const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("SB-073 client types", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  const reader = () => new PrismaFirmListsRepository(getPrismaClient());
  const writer = () => new PrismaFirmListsWriteRepository(getPrismaClient());
  async function change() {
    return {
      kind: "CLIENT_TYPE" as const,
      key: null,
      nameEn: "Developer",
      nameZhTw: "建設公司",
      sortOrder: 4,
      active: true,
      relatedKeys: [],
      expectedRevision: (await reader().read(await db.actor()))!.revision,
      idempotencyKey: randomUUID(),
    };
  }
  it("rejects Viewer, forged tenant, and another firm's key without audit", async () => {
    const value = await change(),
      owner = await db.actor(),
      viewer = await db.actor("membership_horizon_viewer");
    expect(await new ChangeFirmList(writer()).execute(viewer, value)).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(await new GetFirmListSettings(reader()).execute(viewer)).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(
      await writer().changeWithAudit({ ...owner, organizationId: "org_northern" }, value),
    ).toEqual({ kind: "UNAVAILABLE" });
    await getPrismaClient().firmClientType.create({
      data: {
        id: randomUUID(),
        organizationId: "org_northern",
        key: "FOREIGN-CLIENT-TYPE",
        nameEn: "Foreign",
        nameZhTw: "外部",
        sortOrder: 0,
      },
    });
    expect(await writer().changeWithAudit(owner, { ...value, key: "FOREIGN-CLIENT-TYPE" })).toEqual(
      { kind: "UNAVAILABLE" },
    );
    expect(
      await getPrismaClient().auditEvent.count({ where: { idempotencyKey: value.idempotencyKey } }),
    ).toBe(0);
  });
  it("creates an Individual client and a keyed Taichung job, displayed in either language", async () => {
    const owner = await db.actor();
    const input = {
      ...jobInput(),
      clientType: "INDIVIDUAL",
      locationCity: "TAICHUNG_CITY",
      locationDistrict: "",
    };
    expect((await createProjectWriteServices().create.execute(owner, input)).kind).toBe("CREATED");
    const job = await getPrismaClient().project.findFirstOrThrow({
      where: { organizationId: owner.organizationId, businessKey: input.businessKey },
      include: { client: true },
    });
    expect(job.locationCity).toBe("TAICHUNG_CITY");
    expect(job.locationCityBeforeCanonicalization).toBeNull();
    expect(job.client?.clientType).toBe("INDIVIDUAL");
    for (const locale of ["en", "zh-TW"] as const) {
      const result = await createProjectWorkspaceService().execute(
        { ...owner, locale },
        input.businessKey,
      );
      expect(result.kind).toBe("AVAILABLE");
      if (result.kind === "AVAILABLE")
        expect(result.workspace.project.location.display).toBe(
          locale === "en" ? "Taichung City" : "臺中市",
        );
    }
  });
  it("keeps a retired type on its current client but rejects assigning it to another", async () => {
    const owner = await db.actor(),
      clients = new PrismaClientRepository(getPrismaClient());
    const first = await clients.get(owner, "CLIENT-01");
    expect(first).not.toBeNull();
    const value = await change();
    expect(
      await writer().changeWithAudit(owner, { ...value, key: first!.clientType, active: false }),
    ).toEqual({ kind: "SAVED", key: first!.clientType });
    const input = (row: NonNullable<typeof first>): UpdateClientInput =>
      ({
        ...Object.fromEntries(CLIENT_DETAIL_FIELDS.map((k) => [k, row[k]])),
        businessKey: row.businessKey,
        expectedUpdatedAt: row.updatedAt,
        idempotencyKey: randomUUID(),
      }) as UpdateClientInput;
    expect(
      (
        await clients.updateWithAudit(await db.actor(), {
          ...input(first!),
          note: "A note with the retired type retained",
        })
      ).kind,
    ).toBe("SAVED");
    const other = await clients.get(owner, "CLIENT-02");
    await getPrismaClient().client.updateMany({
      where: { organizationId: owner.organizationId, businessKey: "CLIENT-02" },
      data: { clientType: "INDIVIDUAL" },
    });
    const changed = await clients.get(owner, other!.businessKey);
    expect(
      await clients.updateWithAudit(await db.actor(), {
        ...input(changed!),
        clientType: first!.clientType,
      }),
    ).toEqual({ kind: "INVALID", errors: { clientType: "invalid" } });
    const audit = await getPrismaClient().auditEvent.findFirstOrThrow({
      where: { organizationId: owner.organizationId, idempotencyKey: value.idempotencyKey },
    });
    expect(JSON.stringify(audit.payload)).not.toMatch(/Developer|建設公司|contactPerson/);
    expect(audit.payload).toMatchObject({
      list: "CLIENT_TYPE",
      changedFields: ["nameEn", "nameZhTw", "sortOrder", "active"],
    });
  });
  it("bounds labels to 40 and additions to 30 including retired types", async () => {
    const value = await change();
    expect(validateFirmListChange({ ...value, nameEn: "a".repeat(40) }).kind).toBe("VALID");
    for (const field of ["nameEn", "nameZhTw"])
      expect(validateFirmListChange({ ...value, [field]: "字".repeat(41) })).toEqual({
        kind: "INVALID",
        fields: [field],
      });
    const owner = await db.actor();
    const count = await getPrismaClient().firmClientType.count({
      where: { organizationId: owner.organizationId },
    });
    await getPrismaClient().firmClientType.createMany({
      data: Array.from({ length: 30 - count }, (_, i) => ({
        id: randomUUID(),
        organizationId: owner.organizationId,
        key: `TYPE-${i}`,
        nameEn: `Type ${i}`,
        nameZhTw: `類型${i}`,
        sortOrder: i,
        active: false,
      })),
    });
    expect(await writer().changeWithAudit(owner, await change())).toEqual({ kind: "LIMIT" });
  });
});
