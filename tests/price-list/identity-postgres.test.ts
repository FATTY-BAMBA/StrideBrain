import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assistantDatabase } from "../assistant/database-fixture";
import mappings from "@/modules/price-list/domain/case-folding.json";
import { priceIdentity } from "@/modules/price-list/domain/price-input";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite("price identity SQL/domain parity", () => {
  let db: Awaited<ReturnType<typeof assistantDatabase>>;
  beforeAll(async () => {
    db = await assistantDatabase();
  });
  afterAll(async () => {
    await db?.close();
  });
  it("uses identical exact identities for the complete pinned folding data, compatibility forms and whitespace", async () => {
    const inputs = [
      ...Object.keys(mappings),
      ...Object.values(mappings),
      "　Ｔｅｓｔ　",
      "\uFEFF 天花板\u00a0",
      "A\nB",
      "Café",
      "ＡßΣ",
      "",
      "😀",
    ];
    const result = await db.sql.query(
      "SELECT value, sb_price_identity(value) AS folded FROM unnest($1::text[]) WITH ORDINALITY AS input(value, n) ORDER BY n",
      [inputs],
    );
    expect(result.rows.map((r) => r.folded)).toEqual(inputs.map(priceIdentity));
  });
  it("keeps the derived view tenant identifiable and indexed at the issued-version selection", async () => {
    const columns = (
      await db.sql.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name='IssuedQuotePrice'`,
      )
    ).rows.map((r) => r.column_name);
    expect(columns).toEqual(
      expect.arrayContaining([
        "id",
        "organizationId",
        "projectId",
        "versionId",
        "descriptionKey",
        "unitKey",
      ]),
    );
    expect(
      (
        await db.sql.query(
          `SELECT indexdef FROM pg_indexes WHERE indexname='QuoteVersion_issued_prices_idx'`,
        )
      ).rows[0].indexdef,
    ).toMatch(/organizationId.*quoteId.*versionNumber/);
  });
});
