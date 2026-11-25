import { expect, it, vi } from "vitest";
import { priceIdentity, priceQuery } from "@/modules/price-list/domain/price-input";
import { ReadPriceList } from "@/modules/price-list/application/read-price-list";
import { jobContext } from "../projects/job-fixture";
import { roleBundle } from "@/modules/runtime-context/capabilities";
it.each([
  ["  ＣＥＩＬＩＮＧ　", "ceiling"],
  ["Maße", "masse"],
  ["Σςσ", "σσσ"],
  ["İ", "i\u0307"],
  ["\u00a0天花板\uFEFF", "天花板"],
  ["M²", "m2"],
  ["坪", "坪"],
  ["Café", "café"],
  ["ﬃ", "ffi"],
])("normalizes and fully case folds %s exactly", (text, expected) =>
  expect(priceIdentity(text)).toBe(expected),
);
it("does not fuzzy-match, collapse inner spaces, translate units or strip accents", () => {
  expect(priceIdentity("ceiling board")).not.toBe(priceIdentity("ceilingboard"));
  expect(priceIdentity("ceiling  board")).not.toBe(priceIdentity("ceiling board"));
  expect(priceIdentity("café")).not.toBe(priceIdentity("cafe"));
  expect(priceIdentity("坪")).not.toBe(priceIdentity("ping"));
});
it("bounds reads, requires two typed characters and treats invalid or repeated input as invalid", () => {
  const query = { mode: "SUGGEST", search: "天花", unit: "", page: 1, projectKey: "JOB" };
  expect(priceQuery(query)).toEqual(query);
  for (const patch of [
    { search: "天" },
    { search: "ß" },
    { search: "x".repeat(501) },
    { search: "\uD800" },
    { search: ["天花", "木作"] },
    { projectKey: "../other" },
    { projectKey: null },
    { page: 0 },
    { page: 2 },
    { organizationId: "foreign" },
  ])
    expect(priceQuery({ ...query, ...patch })).toBeNull();
  expect(
    priceQuery({ ...query, mode: "HISTORY", search: "Cabinet\nfinished", unit: "式" }),
  ).not.toBeNull();
  expect(priceQuery({ ...query, mode: "HISTORY", unit: "" })).toBeNull();
});
it("denies Viewer and absent quote/project capabilities before a repository read", async () => {
  const read = vi.fn();
  const app = new ReadPriceList({ read });
  for (const capabilities of [
    roleBundle("VIEWER"),
    new Set<"quote:read">(["quote:read"]),
    new Set<"project:read">(["project:read"]),
  ]) {
    expect(await app.execute(jobContext({ capabilities }), {})).toEqual({ kind: "UNAVAILABLE" });
  }
  expect(read).not.toHaveBeenCalled();
});
it("returns a bounded unavailable result if the price source fails", async () => {
  const read = vi.fn().mockRejectedValue(new Error("private database details"));
  const result = await new ReadPriceList({ read }).execute(jobContext(), {
    mode: "LIST",
    search: "",
    unit: "",
    page: 1,
    projectKey: null,
  });
  expect(result).toEqual({ kind: "UNAVAILABLE" });
});
