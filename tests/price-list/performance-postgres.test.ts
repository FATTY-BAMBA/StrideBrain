import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { getPrismaClient } from "@/lib/server/prisma";
import { ReadPriceList } from "@/modules/price-list/application/read-price-list";
import { PrismaPriceListRepository } from "@/repositories/prisma/prisma-price-list-repository";
import { priceJob, issuedPrice, priceItem } from "./fixtures";
import type { PriceQuery } from "@/modules/price-list/domain/price-input";
const suite = process.env.DATABASE_URL ? describe.sequential : describe.skip;
suite("20,000 readable issued item benchmark", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  });
  afterAll(async () => {
    await db?.close();
  });
  it("reads one suggestion, history and list page with authorization included", async () => {
    const owner = await db.actor(),
      job = await priceJob(owner);
    const { versionId } = await issuedPrice(
      owner,
      job,
      Array.from({ length: 200 }, (_, i) =>
        priceItem(`Benchmark ceiling ${String(i).padStart(3, "0")}`),
      ),
    );
    const { quoteId } = (
      await db.sql.query('SELECT "quoteId" FROM "QuoteVersion" WHERE id=$1', [versionId])
    ).rows[0];
    // 100 different quotes, each with one issued version of 200 items. The other
    // 99 are SQL copies of the valid application-issued fixture, in this disposable DB.
    // Generated columns are intentionally excluded; PostgreSQL computes every key.
    const clone = async (table: string, where: string, id: string, overrides: string) => {
      const columns = (
        await db.sql.query(
          `SELECT quote_ident(attname) AS name FROM pg_attribute WHERE attrelid=$1::regclass AND attnum>0 AND NOT attisdropped AND attgenerated='' ORDER BY attnum`,
          [`"${table}"`],
        )
      ).rows.map((r) => r.name);
      await db.sql.query(
        `INSERT INTO "${table}" (${columns.join(",")}) SELECT ${columns.map((c) => `copy.${c}`).join(",")} FROM "${table}" original CROSS JOIN generate_series(1,99) n CROSS JOIN LATERAL jsonb_populate_record(NULL::"${table}", to_jsonb(original) || jsonb_build_object(${overrides})) copy WHERE original.${where}=$1`,
        [id],
      );
    };
    await clone(
      "Project",
      "id",
      job.projectId,
      "'id','bench-project-'||n,'businessKey','BENCH-JOB-'||n",
    );
    await clone(
      "Quote",
      "id",
      quoteId,
      "'id','bench-quote-'||n,'businessKey','BENCH-QUOTE-'||n,'projectId','bench-project-'||n",
    );
    await clone(
      "QuoteVersion",
      "id",
      versionId,
      "'id','bench-version-'||n,'quoteId','bench-quote-'||n,'documentNumber','BENCH-Q-'||n,'issuedAt',NULL,'status','DRAFT','authorityState','HUMAN_REVIEWED'",
    );
    await clone(
      "QuoteSection",
      '"quoteVersionId"',
      versionId,
      "'id','bench-section-'||n,'quoteVersionId','bench-version-'||n",
    );
    await clone(
      "QuoteItem",
      '"quoteVersionId"',
      versionId,
      "'id','bench-item-'||n||'-'||original.\"lineNumber\",'quoteVersionId','bench-version-'||n,'sectionId','bench-section-'||n",
    );
    await db.sql.query(
      `UPDATE "QuoteVersion" v SET "issuedAt"=source."issuedAt", status=source.status, "authorityState"=source."authorityState" FROM "QuoteVersion" source WHERE source.id=$1 AND v.id LIKE 'bench-version-%'`,
      [versionId],
    );
    await db.sql.query(
      'ANALYZE "Project"; ANALYZE "Quote"; ANALYZE "QuoteVersion"; ANALYZE "QuoteItem"; ANALYZE "QuoteSection"',
    );
    const count = (
      await db.sql.query(
        `SELECT count(*)::int n FROM "IssuedQuotePrice" WHERE "organizationId"=$1 AND "descriptionKey" LIKE 'benchmark ceiling %'`,
        [owner.organizationId],
      )
    ).rows[0].n;
    expect(count).toBe(20000);
    const repository = new PrismaPriceListRepository(getPrismaClient());
    let failure: { name: string; code: string } | undefined;
    const read = new ReadPriceList({
      read: async (context, query) => {
        try {
          return await repository.read(context, query);
        } catch (error) {
          const e = error as { name?: unknown; code?: unknown };
          const safe = (v: unknown) =>
            typeof v === "string" && /^[A-Za-z0-9_]{1,80}$/.test(v) ? v : "UNKNOWN";
          failure = { name: safe(e.name), code: safe(e.code) };
          throw error;
        }
      },
    });
    const timings: Record<string, number> = {};
    for (const mode of ["SUGGEST", "HISTORY", "LIST"] as const) {
      const input: PriceQuery = {
        mode,
        search: mode === "HISTORY" ? "Benchmark ceiling 000" : "Benchmark ceiling",
        unit: "坪",
        page: 1,
        projectKey: mode === "SUGGEST" ? job.projectKey : null,
      };
      const start = performance.now();
      const result = await read.execute(owner, input);
      timings[mode] = Math.round((performance.now() - start) * 100) / 100;
      expect(result.kind, JSON.stringify({ mode, milliseconds: timings[mode], failure })).toBe(
        "AVAILABLE",
      );
      if (result.kind !== "AVAILABLE") throw Error("BENCHMARK_READ_REQUIRED");
      expect(result.rows).toHaveLength(mode === "SUGGEST" ? 8 : mode === "HISTORY" ? 5 : 50);
      if (mode !== "HISTORY") expect(result.rows.every((r) => r.timesQuoted === 100)).toBe(true);
    }
    // Timings are evidence, not a machine-dependent CI pass mark. Local target: each <200ms.
    console.info(
      "PRICE_READ_BENCHMARK",
      JSON.stringify({
        lines: count,
        quotes: 100,
        postgres: (await db.sql.query("SHOW server_version")).rows[0].server_version,
        milliseconds: timings,
      }),
    );
  }, 60000);
});
