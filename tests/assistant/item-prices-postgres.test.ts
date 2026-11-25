import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "./database-fixture";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { createPriceListService } from "@/lib/server/price-list-services";
import { issuedPrice, priceItem, priceJob } from "../price-list/fixtures";
import { formatMoney } from "@/modules/finance/format-money";
import { modelFacts } from "@/modules/assistant/domain/redaction";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("item prices use the page read without sending client identities", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>,
    first: Awaited<ReturnType<typeof priceJob>>,
    newer: typeof first,
    target: typeof first;
  beforeAll(async () => {
    db = await assistantDatabase();
    const owner = await db.actor();
    first = await priceJob(owner);
    newer = await priceJob(owner);
    target = await priceJob(owner, first.clientKey);
    await issuedPrice(
      owner,
      first,
      [priceItem("天花板 Ceiling", "3200")],
      new Date("2026-11-24T00:00:00Z"),
    );
    await issuedPrice(
      owner,
      newer,
      [
        ...Array.from({ length: 7 }, (_, i) =>
          priceItem(i ? `天花板 Ceiling ${i}` : "天花板 Ceiling", "3500"),
        ),
        priceItem("天花板 Ceiling", "1000", "m²"),
      ],
      new Date("2026-11-25T00:00:00Z"),
    );
    for (const member of [
      "membership_horizon_mei",
      "membership_horizon_finance",
      "membership_horizon_viewer",
    ])
      for (const job of [first, target])
        await db.sql.query(
          'INSERT INTO "ProjectAssignment" (id,"organizationId","projectId","membershipId","canReadActuals","canCreateAction") VALUES ($1,$2,$3,$4,false,false)',
          [randomUUID(), owner.organizationId, job.projectId, member],
        );
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  it.each([
    ["owner", "membership_horizon_admin", true],
    ["assigned manager", "membership_horizon_mei", true],
    ["unassigned manager", "membership_horizon_mei", false],
    ["finance", "membership_horizon_finance", true],
    ["Viewer", "membership_horizon_viewer", true],
  ] as const)("%s has exactly the price fields of their page", async (_role, member, assigned) => {
    const c = await db.actor(member),
      projectKey = assigned ? target.projectKey : newer.projectKey;
    const page = await createPriceListService().execute(c, {
      mode: "LIST",
      search: "天花板",
      unit: "坪",
      page: 1,
      projectKey,
    });
    const tool = await createAssistantServices().tools.execute(c, {
      name: "get_item_prices",
      arguments: { description: "天花板", unit: "坪", projectKey },
    });
    if (page.kind !== "AVAILABLE") {
      expect(tool).toEqual({ status: "UNAVAILABLE", sources: [] });
      return;
    }
    expect(tool.sources.map((s) => modelFacts(s.facts))).toEqual(
      page.rows.slice(0, 5).map((row) => ({
        description: row.description,
        unit: row.unit,
        lastPrice: formatMoney(row.unitPrice, row.currency),
        lastQuoted: row.issuedOn,
        timesQuoted: row.timesQuoted,
        documentNumber: row.documentNumber,
        ...(row.clientPrice
          ? {
              clientLastPrice: formatMoney(row.clientPrice.unitPrice, row.clientPrice.currency),
              clientLastQuoted: row.clientPrice.issuedOn,
              clientDocumentNumber: row.clientPrice.documentNumber,
            }
          : {}),
      })),
    );
    expect(JSON.stringify(tool.sources)).not.toMatch(
      /clientName|clientId|contactPerson|contactEmail/,
    );
    if (member === "membership_horizon_admin")
      expect(tool.sources[0]?.facts).toMatchObject({
        lastPrice: "NT$3,500",
        clientLastPrice: "NT$3,200",
        clientLastQuoted: "2026-11-24",
        timesQuoted: 2,
      });
    else expect(tool.sources[0]?.facts).toMatchObject({ lastPrice: "NT$3,200", timesQuoted: 1 });
  });
  it("bounds results, accepts the optional unit, and keeps search parameterized", async () => {
    const c = await db.actor(),
      tools = createAssistantServices().tools;
    expect(
      (await tools.execute(c, { name: "get_item_prices", arguments: { description: "Ceiling" } }))
        .sources,
    ).toHaveLength(5);
    const otherUnit = await tools.execute(c, {
      name: "get_item_prices",
      arguments: { description: "Ceiling", unit: "m²" },
    });
    expect(otherUnit.sources).toHaveLength(1);
    expect(otherUnit.sources[0]?.facts.lastPrice).toBe("NT$1,000");
    for (const description of ["x' OR TRUE --", "%", "_"])
      expect(
        (await tools.execute(c, { name: "get_item_prices", arguments: { description } })).sources,
      ).toEqual([]);
    expect(
      (
        await tools.execute(c, {
          name: "get_item_prices",
          arguments: { description: "x".repeat(501) },
        })
      ).status,
    ).toBe("UNAVAILABLE");
    const foreign = await db.actor("membership_northern_owner");
    expect(
      (
        await tools.execute(foreign, {
          name: "get_item_prices",
          arguments: { description: "Ceiling", projectKey: target.projectKey },
        })
      ).sources,
    ).toEqual([]);
  });
  it("never sends an excluded source or a price derived from it", async () => {
    const c = await db.actor(),
      service = createAssistantServices();
    await service.control.execute(
      { ...c, requestId: randomUUID() },
      {
        target: "PROJECT",
        projectKey: newer.projectKey,
        enabled: true,
        idempotencyKey: randomUUID(),
      },
    );
    expect(
      (
        await service.tools.execute(c, {
          name: "get_item_prices",
          arguments: { description: "Ceiling", projectKey: target.projectKey },
        })
      ).sources,
    ).toEqual([]);
    await service.control.execute(
      { ...c, requestId: randomUUID() },
      {
        target: "PROJECT",
        projectKey: newer.projectKey,
        enabled: false,
        idempotencyKey: randomUUID(),
      },
    );
    await service.control.execute(
      { ...c, requestId: randomUUID() },
      {
        target: "PROJECT",
        projectKey: first.projectKey,
        enabled: true,
        idempotencyKey: randomUUID(),
      },
    );
    const result = await service.tools.execute(c, {
      name: "get_item_prices",
      arguments: { description: "Ceiling", unit: "坪" },
    });
    // The newest source is allowed, but count=2 would still disclose the excluded older quote.
    expect(result.sources.some((s) => s.facts.description === "天花板 Ceiling")).toBe(false);
    expect(result.sources).toHaveLength(5);
  });
});
