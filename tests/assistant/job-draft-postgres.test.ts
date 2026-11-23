import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { randomUUID } from "node:crypto";
import { assistantDatabase } from "./database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaAssistantRepository } from "@/repositories/prisma/prisma-assistant-repository";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import { DraftJob } from "@/modules/assistant/application/draft-job";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import { draftFields } from "@/modules/assistant/domain/job-draft";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
let db: Awaited<ReturnType<typeof assistantDatabase>>;
beforeAll(async () => {
  if (process.env.DATABASE_URL) db = await assistantDatabase();
}, 30000);
afterAll(async () => {
  await db?.close();
});
suite("job draft tenant and usage boundary", () => {
  it("matches only active local clients, writes one metadata row and no job/client/audit", async () => {
    const prisma = getPrismaClient(),
      c = await db.actor();
    const model = {
      draftJob: vi.fn().mockResolvedValue({
        usage: { inputTokens: 100, outputTokens: 20 },
        draft: {
          ...Object.fromEntries(draftFields.map((k) => [k, k === "scopeCategoryIds" ? [] : null])),
          clientName: { value: "星序零售台灣", quote: "星序零售台灣" },
        },
      }),
    };
    const config = { ...assistantConfig({}), enabled: true };
    const service = new DraftJob(
      model,
      config,
      new PrismaAssistantRepository(prisma),
      new PrismaProjectWriteRepository(prisma),
    );
    const counts = async () => [
      await prisma.project.count(),
      await prisma.client.count(),
      await prisma.auditEvent.count(),
    ];
    const before = await counts();
    expect(await service.execute(c, "客戶星序零售台灣")).toMatchObject({
      kind: "DRAFTED",
      draft: { clientBusinessKey: "CLIENT-01", clientMode: "existing" },
    });
    expect(await counts()).toEqual(before);
    const rows = await prisma.assistantUsage.findMany({ where: { requestId: c.requestId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      outcome: "ANSWERED",
      inputTokens: 100,
      outputTokens: 20,
      toolNames: [],
      sourceIds: [],
    });
    expect(JSON.stringify(rows)).not.toContain("星序零售台灣");
    model.draftJob.mockResolvedValue({
      usage: { inputTokens: 100, outputTokens: 20 },
      draft: {
        ...Object.fromEntries(draftFields.map((k) => [k, k === "scopeCategoryIds" ? [] : null])),
        clientName: { value: "受限客戶", quote: "受限客戶" },
      },
    });
    expect(await service.execute({ ...c, requestId: randomUUID() }, "受限客戶")).toMatchObject({
      kind: "DRAFTED",
      draft: { clientBusinessKey: "", clientMode: "new" },
    });
    await prisma.client.update({ where: { id: "client_horizon_01" }, data: { active: false } });
    model.draftJob.mockResolvedValue({
      usage: { inputTokens: 100, outputTokens: 20 },
      draft: {
        ...Object.fromEntries(draftFields.map((k) => [k, k === "scopeCategoryIds" ? [] : null])),
        clientName: { value: "星序零售台灣", quote: "星序零售台灣" },
      },
    });
    expect(await service.execute({ ...c, requestId: randomUUID() }, "星序零售台灣")).toMatchObject({
      draft: { clientMode: "new" },
    });
  });
  it("denies Viewer, finance and a mismatched organization before any model call", async () => {
    const prisma = getPrismaClient(),
      model = { draftJob: vi.fn() };
    const service = new DraftJob(
      model,
      { ...assistantConfig({}), enabled: true },
      new PrismaAssistantRepository(prisma),
      new PrismaProjectWriteRepository(prisma),
    );
    const owner = await db.actor();
    for (const context of [
      await db.actor("membership_horizon_viewer"),
      await db.actor("membership_horizon_finance"),
      { ...owner, organizationId: "org_northern" },
    ])
      expect(await service.execute(context, "retail flagship")).toMatchObject({
        kind: "UNAVAILABLE",
      });
    expect(model.draftJob).not.toHaveBeenCalled();
    const capped = new DraftJob(
      model,
      { ...assistantConfig({}), enabled: true, dailyCalls: 1 },
      new PrismaAssistantRepository(prisma),
      new PrismaProjectWriteRepository(prisma),
    );
    expect(await capped.execute(owner, "retail flagship")).toMatchObject({ reason: "DAILY_CAP" });
    expect(model.draftJob).not.toHaveBeenCalled();
  });
});
