import { expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ context: vi.fn(), execute: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mock.context }));
vi.mock("@/lib/env/server-env", () => ({
  getServerEnvironment: () => ({ appOrigin: new URL("https://stridebrain.test") }),
}));
vi.mock("@/lib/server/price-list-services", () => ({
  createPriceListService: () => ({ execute: mock.execute }),
}));
import { GET } from "@/app/api/quotes/prices/route";
import { jobContext } from "../projects/job-fixture";
const query = "locale=zh-TW&mode=SUGGEST&search=Ceiling&unit=&page=1&projectKey=JOB";
const request = (q = query, headers: Record<string, string> = {}) =>
  new Request(`https://stridebrain.test/api/quotes/prices?${q}`, {
    headers: { "x-stridebrain-price-read": "1", ...headers },
  });
it("reads through the same authorized service with private no-store caching", async () => {
  mock.context.mockResolvedValue(jobContext());
  mock.execute.mockResolvedValue({ kind: "AVAILABLE", rows: [], hasMore: false });
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(mock.execute).toHaveBeenCalledWith(expect.objectContaining({ locale: "zh-TW" }), {
    mode: "SUGGEST",
    search: "Ceiling",
    unit: "",
    page: 1,
    projectKey: "JOB",
  });
});
it("denies anonymous and Viewer reads before query handling, and conceals inaccessible jobs", async () => {
  for (const context of [null, jobContext({ capabilities: new Set(["project:read"]) })]) {
    mock.context.mockResolvedValue(context);
    expect((await GET(request("invalid"))).status).toBe(404);
  }
  expect(mock.execute).not.toHaveBeenCalled();
  mock.context.mockResolvedValue(jobContext());
  // The real repository's cross-organization denial is covered by read-postgres.test.ts.
  mock.execute.mockResolvedValue({ kind: "UNAVAILABLE" });
  const response = await GET(request(query.replace("JOB", "OTHER-ORG")));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ kind: "UNAVAILABLE" });
});
it("rejects missing, repeated, unknown and oversized fields and invalid locale", async () => {
  mock.context.mockResolvedValue(jobContext());
  for (const q of [
    query + "&mode=LIST",
    query + "&extra=1",
    query.replace("locale=zh-TW&", ""),
    query.replace("zh-TW", "xx"),
    query + "x".repeat(8192),
  ])
    expect((await GET(request(q))).status).toBe(400);
  expect(mock.execute).not.toHaveBeenCalled();
  mock.execute.mockResolvedValue({ kind: "INVALID" });
  expect((await GET(request(query.replace("page=1", "page=bad")))).status).toBe(400);
  expect(mock.execute).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ page: 0 }),
  );
});
it("requires a same-origin private fetch and fails closed on read errors", async () => {
  for (const headers of [
    { origin: "https://other.test" },
    { "sec-fetch-site": "cross-site" },
    { "x-stridebrain-price-read": "" },
  ])
    expect((await GET(request(query, headers))).status).toBe(404);
  expect(mock.context).not.toHaveBeenCalled();
  mock.context.mockRejectedValue(Error("offline"));
  expect((await GET(request())).status).toBe(404);
});
