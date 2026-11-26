import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "./database-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { getPrismaClient } from "@/lib/server/prisma";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("bounded failure metadata", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  });
  afterAll(async () => {
    await db?.close();
  });
  it("records one failed call, groups only this tenant's seven days, and excludes response bodies", async () => {
    const c = await db.actor(),
      service = createAssistantServices(),
      repo = service.repository;
    const now = new Date(),
      month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const config = { ...service.config, dailyCalls: 1000 };
    const first = await repo.reserveCall(c, config, now, { toolNames: [], sourceIds: [] });
    const second = await repo.reserveCall(c, config, now, { toolNames: [], sourceIds: [] });
    await repo.finishTurn(c, "FALLBACK_UNAVAILABLE", {
      callId: second!,
      code: "PROVIDER_HTTP",
      httpStatus: 429,
    });
    const rows = await getPrismaClient().assistantUsage.findMany({
      where: { requestId: c.requestId },
    });
    expect(rows.find((r) => r.id === first)).toMatchObject({
      outcome: "FALLBACK_UNAVAILABLE",
      failureCode: null,
      providerHttpStatus: null,
    });
    expect(rows.find((r) => r.id === second)).toMatchObject({
      failureCode: "PROVIDER_HTTP",
      providerHttpStatus: 429,
    });
    const next = { ...c, requestId: randomUUID() },
      third = await repo.reserveCall(next, config, now, { toolNames: [], sourceIds: [] });
    await repo.finishTurn(next, "FALLBACK_UNGROUNDED", {
      callId: third!,
      code: "UNKNOWN_REFERENCE",
    });
    const old = { ...c, requestId: randomUUID() },
      oldId = await repo.reserveCall(old, config, now, { toolNames: [], sourceIds: [] });
    await repo.finishTurn(old, "FALLBACK_TIMEOUT", { callId: oldId!, code: "TIMEOUT" });
    await getPrismaClient().assistantUsage.update({
      where: { id: oldId! },
      data: { createdAt: new Date(now.getTime() - 8 * 86400000) },
    });
    expect((await repo.settings(c, month))?.failures).toEqual([
      { code: "PROVIDER_HTTP", httpStatus: 429, count: 1 },
      { code: "UNKNOWN_REFERENCE", httpStatus: null, count: 1 },
    ]);
    expect(
      (await repo.settings(await db.actor("membership_northern_owner"), month))?.failures,
    ).toEqual([]);
    expect(await repo.settings(await db.actor("membership_horizon_viewer"), month)).toBeNull();
    const columns = await db.sql.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='AssistantUsage'",
    );
    expect(columns.rows.map((r) => r.column_name)).not.toEqual(
      expect.arrayContaining(["question", "responseBody", "rawAnswer", "apiKey"]),
    );
  });
});
