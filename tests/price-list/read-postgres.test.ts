import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { ReadPriceList } from "@/modules/price-list/application/read-price-list";
import { PrismaPriceListRepository } from "@/repositories/prisma/prisma-price-list-repository";
import { priceJob, issuedPrice, priceItem, priceServices } from "./fixtures";
import type { PriceQuery } from "@/modules/price-list/domain/price-input";
const suite = process.env.DATABASE_URL ? describe.sequential : describe.skip;
const query = (
  mode: PriceQuery["mode"],
  search = "天花板",
  projectKey: string | null = null,
  unit = "坪",
  page = 1,
): PriceQuery => ({ mode, search, unit, projectKey, page });
suite("issued price read model and source access", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  const read = () => new ReadPriceList(new PrismaPriceListRepository(getPrismaClient()));
  beforeAll(async () => {
    db = await assistantDatabase();
  });
  afterAll(async () => {
    await db?.close();
  });
  it("returns the newest global price, orders same-client items first and separately links that client’s different last price", async () => {
    const owner = await db.actor(),
      first = await priceJob(owner),
      later = await priceJob(owner),
      target = await priceJob(owner, first.clientKey);
    const old = await issuedPrice(owner, first, [priceItem()], new Date("2026-11-25T16:30:00Z"));
    const newest = await issuedPrice(
      owner,
      later,
      [priceItem("天花板", "3800"), priceItem("天花A", "1200")],
      new Date("2026-11-27T00:00:00Z"),
    );
    const result = await read().execute(owner, query("SUGGEST", "天花", target.projectKey));
    expect(result.kind).toBe("AVAILABLE");
    if (result.kind !== "AVAILABLE") return;
    expect(result.rows.map((r) => r.description)).toEqual(["天花板", "天花A"]);
    expect(result.rows[0]).toMatchObject({
      unit: "坪",
      unitPrice: "3800",
      timesQuoted: 2,
      versionId: newest.versionId,
      clientPrice: {
        unitPrice: "3500",
        issuedOn: "2026-11-26",
        versionId: old.versionId,
        projectKey: first.projectKey,
      },
    });
    const list = await read().execute(owner, query("LIST", "天花板"));
    expect(list).toMatchObject({
      rows: [{ unitPrice: "3800", timesQuoted: 2, versionId: newest.versionId }],
    });
    const history = await read().execute(owner, query("HISTORY", "天花板"));
    expect(history).toMatchObject({
      rows: [
        { unitPrice: "3800", versionId: newest.versionId },
        { unitPrice: "3500", versionId: old.versionId },
      ],
    });
    // Removing a source assignment immediately removes its prices and all counts/client hints.
    for (const membership of ["membership_horizon_mei", "membership_horizon_finance"]) {
      for (const job of [first, target])
        await db.sql.query(
          'INSERT INTO "ProjectAssignment" (id,"organizationId","projectId","membershipId","canReadActuals","canCreateAction") VALUES ($1,$2,$3,$4,false,false)',
          [randomUUID(), owner.organizationId, job.projectId, membership],
        );
      const actor = await db.actor(membership);
      expect(
        await read().execute(actor, query("SUGGEST", "天花", target.projectKey)),
      ).toMatchObject({ rows: [{ unitPrice: "3500", timesQuoted: 1, versionId: old.versionId }] });
      const page = await read().execute(actor, query("LIST", "天花"));
      expect(JSON.stringify(page)).not.toContain(later.projectKey);
      expect(await read().execute(actor, query("HISTORY", "天花板"))).toMatchObject({
        rows: [{ versionId: old.versionId }],
      });
      expect(await read().execute(actor, query("SUGGEST", "天花", later.projectKey))).toEqual({
        kind: "UNAVAILABLE",
      });
      await db.sql.query(
        'DELETE FROM "ProjectAssignment" WHERE "organizationId"=$1 AND "membershipId"=$2 AND "projectId"=$3',
        [owner.organizationId, membership, first.projectId],
      );
      expect(await read().execute(actor, query("HISTORY", "天花板"))).toMatchObject({ rows: [] });
    }
    for (const mode of ["LIST", "SUGGEST", "HISTORY"] as const) {
      expect(
        await read().execute(
          await db.actor("membership_horizon_viewer"),
          query(mode, "天花板", target.projectKey),
        ),
      ).toEqual({ kind: "UNAVAILABLE" });
      const other = await db.actor("membership_northern_owner");
      expect(await read().execute(other, query(mode, "天花板", target.projectKey))).toEqual({
        kind: "UNAVAILABLE",
      });
      expect(
        await read().execute(
          { ...owner, organizationId: other.organizationId },
          query(mode, "天花板", target.projectKey),
        ),
      ).toEqual({ kind: "UNAVAILABLE" });
    }
    expect(
      await read().execute(await db.actor("membership_northern_owner"), query("LIST", "天花板")),
    ).toMatchObject({ rows: [] });
  });
  it("counts quotes once, deduplicates identical prices within a quote, and uses the last document line for its last price", async () => {
    const owner = await db.actor(),
      job = await priceJob(owner);
    const issued = await issuedPrice(owner, job, [
      priceItem("  Ｃｅｉｌｉｎｇ  ", "3500", "ｍ２"),
      priceItem("ceiling", "3800", "m2"),
      priceItem("CEILING", "3500", "m²"),
      { kind: "NOTE", description: "Ceiling" },
      { kind: "PERCENTAGE", description: "Ceiling", percentage: "8", remark: "" },
    ]);
    expect(await read().execute(owner, query("LIST", "ＣＥＩＬＩＮＧ"))).toMatchObject({
      rows: [
        { description: "CEILING", unitPrice: "3500", timesQuoted: 1, versionId: issued.versionId },
      ],
    });
    const history = await read().execute(owner, query("HISTORY", "Ceiling", null, "m2"));
    expect(history).toMatchObject({
      rows: [
        { unitPrice: "3500", versionId: issued.versionId },
        { unitPrice: "3800", versionId: issued.versionId },
      ],
    });
  });
  it("uses the last item across multiple sections in document order", async () => {
    const owner = await db.actor(),
      job = await priceJob(owner);
    const issued = await issuedPrice(owner, job, [], undefined, null, [
      {
        id: "z-first",
        title: "First",
        categoryId: null,
        lines: [priceItem("Section order", "500")],
      },
      {
        id: "a-last",
        title: "Last",
        categoryId: null,
        lines: [priceItem("Section order", "100"), priceItem("Section order", "200")],
      },
    ]);
    expect(await read().execute(owner, query("LIST", "Section order"))).toMatchObject({
      rows: [{ unitPrice: "200", timesQuoted: 1, versionId: issued.versionId }],
    });
    const history = await read().execute(owner, query("HISTORY", "Section order"));
    expect(history.kind === "AVAILABLE" && history.rows.map((row) => row.unitPrice)).toEqual([
      "200",
      "100",
      "500",
    ]);
  });
  it("ignores newer drafts, superseded versions and FINAL, and uses the latest issued/accepted version of each quote", async () => {
    const owner = await db.actor(),
      job = await priceJob(owner),
      app = priceServices();
    const first = await issuedPrice(owner, job, [priceItem("Revision item", "100")]);
    const revision = await app.revise.execute(
      { ...owner, requestId: randomUUID() },
      { projectKey: job.projectKey, versionId: first.versionId, idempotencyKey: randomUUID() },
    );
    if (revision.kind !== "REVISED") throw Error("REVISION_REQUIRED");
    expect(await read().execute(owner, query("LIST", "Revision item"))).toMatchObject({
      rows: [{ unitPrice: "100", timesQuoted: 1, versionId: first.versionId }],
    });
    const second = await issuedPrice(
      owner,
      job,
      [priceItem("Revision item", "200")],
      new Date("2026-11-28T00:00:00Z"),
      revision.versionId!,
    );
    await db.sql.query(
      `UPDATE "QuoteVersion" SET status='ACCEPTED',"acceptedOn"='2026-11-28',"acceptedByMembershipId"='membership_horizon_admin' WHERE id=$1`,
      [second.versionId],
    );
    expect(await read().execute(owner, query("HISTORY", "Revision item"))).toMatchObject({
      rows: [{ unitPrice: "200", versionId: second.versionId }],
    });
    expect(await read().execute(owner, query("LIST", "Revision item"))).toMatchObject({
      rows: [{ unitPrice: "200", timesQuoted: 1 }],
    });
    expect(await read().execute(owner, query("LIST", "Custom millwork"))).toMatchObject({
      rows: [],
    });
  });
  it("bounds suggestions/history/pages and treats wildcard characters literally", async () => {
    const owner = await db.actor(),
      job = await priceJob(owner);
    await issuedPrice(
      owner,
      job,
      Array.from({ length: 51 }, (_, i) => priceItem(`Bound ${String(i).padStart(2, "0")}`, "10")),
    );
    const suggestions = await read().execute(owner, query("SUGGEST", "Bound", job.projectKey));
    if (suggestions.kind !== "AVAILABLE") throw Error("READ_REQUIRED");
    expect(suggestions.rows).toHaveLength(8);
    const page = await read().execute(owner, query("LIST", "Bound"));
    if (page.kind !== "AVAILABLE") throw Error("READ_REQUIRED");
    expect(page.rows).toHaveLength(50);
    expect(page.hasMore).toBe(true);
    const next = await read().execute(owner, query("LIST", "Bound", null, "", 2));
    expect(next).toMatchObject({ rows: [{ description: "Bound 50" }], hasMore: false });
    expect(await read().execute(owner, query("LIST", "%"))).toMatchObject({ rows: [] });
    const prices = await priceJob(owner);
    await issuedPrice(
      owner,
      prices,
      Array.from({ length: 7 }, (_, i) => priceItem("History limit", String(i + 1))),
    );
    const history = await read().execute(owner, query("HISTORY", "History limit"));
    if (history.kind !== "AVAILABLE") throw Error("READ_REQUIRED");
    expect(history.rows.map((r) => r.unitPrice)).toEqual(["7", "6", "5", "4", "3"]);
  });
});
