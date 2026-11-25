import { expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ context: vi.fn(), execute: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mock.context }));
vi.mock("@/lib/env/server-env", () => ({
  getServerEnvironment: () => ({ appOrigin: new URL("https://stridebrain.test") }),
}));
vi.mock("@/lib/server/price-list-services", () => ({
  createPriceListService: () => ({ execute: mock.execute }),
}));
import * as route from "@/app/api/quotes/prices/route";
import { jobContext } from "../projects/job-fixture";
const body = {
  locale: "zh-TW",
  mode: "SUGGEST",
  search: "Ceiling",
  unit: "",
  page: 1,
  projectKey: "JOB",
};
const request = (input = JSON.stringify(body), headers: Record<string, string> = {}, query = "") =>
  new Request(`https://stridebrain.test/api/quotes/prices${query}`, {
    method: "POST",
    headers: {
      "x-stridebrain-price-read": "1",
      origin: "https://stridebrain.test",
      "Content-Type": "application/json",
      ...headers,
    },
    body: input,
  });
it("reads a JSON POST through the authorized service with private caching; no GET export", async () => {
  expect(route).not.toHaveProperty("GET");
  mock.context.mockResolvedValue(jobContext());
  mock.execute.mockResolvedValue({ kind: "AVAILABLE", rows: [], hasMore: false });
  const response = await route.POST(request());
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
it("denies anonymous and Viewer reads before body handling, and conceals inaccessible jobs", async () => {
  for (const context of [null, jobContext({ capabilities: new Set(["project:read"]) })]) {
    mock.context.mockResolvedValue(context);
    const req = request("invalid");
    expect((await route.POST(req)).status).toBe(404);
    expect(req.bodyUsed).toBe(false);
  }
  expect(mock.execute).not.toHaveBeenCalled();
  mock.context.mockResolvedValue(jobContext());
  // Real cross-organization and assignment denials are covered in read-postgres.test.ts.
  mock.execute.mockResolvedValue({ kind: "UNAVAILABLE" });
  const response = await route.POST(request(JSON.stringify({ ...body, projectKey: "OTHER-ORG" })));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ kind: "UNAVAILABLE" });
});
it("rejects malformed, missing, repeated, unknown fields and invalid locale", async () => {
  mock.context.mockResolvedValue(jobContext());
  const missingLocale: Record<string, unknown> = { ...body };
  delete missingLocale.locale;
  for (const input of [
    "{",
    "null",
    "[]",
    JSON.stringify(missingLocale),
    JSON.stringify({ ...body, extra: 1 }),
    JSON.stringify({ ...body, locale: "xx" }),
    JSON.stringify(body).replace('"page":1', '"page":1,"page":2'),
    JSON.stringify(body).replace('"page":1', '"page":1,"p\\u0061ge":2'),
  ])
    expect((await route.POST(request(input))).status).toBe(400);
  expect(mock.execute).not.toHaveBeenCalled();
  mock.execute.mockResolvedValue({ kind: "INVALID" });
  expect((await route.POST(request(JSON.stringify({ ...body, page: "bad" })))).status).toBe(400);
  expect(mock.execute).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ page: "bad" }),
  );
});
it("keeps quoted text as content, rather than mistaking it for repeated fields", async () => {
  mock.context.mockResolvedValue(jobContext());
  mock.execute.mockResolvedValue({ kind: "AVAILABLE", rows: [], hasMore: false });
  const search = 'Label "page": 1; "search": Ceiling';
  expect((await route.POST(request(JSON.stringify({ ...body, search })))).status).toBe(200);
  expect(mock.execute).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ search }));
});
it("bounds actual body bytes even without a valid Content-Length and forbids query content", async () => {
  mock.context.mockResolvedValue(jobContext());
  const large = JSON.stringify({ ...body, search: "天".repeat(3000) });
  for (const req of [
    request(large),
    request(large, { "content-length": "1" }),
    request(undefined, { "content-length": "8193" }),
    request(undefined, { "content-type": "text/plain" }),
    request(undefined, {}, "?search=Ceiling"),
  ])
    expect((await route.POST(req)).status).toBe(400);
  expect(mock.execute).not.toHaveBeenCalled();
});
it("requires same-origin Origin and custom header, and fails closed on read errors", async () => {
  for (const headers of [
    { origin: "" },
    { origin: "https://other.test" },
    { "sec-fetch-site": "cross-site" },
    { "x-stridebrain-price-read": "" },
  ])
    expect((await route.POST(request(undefined, headers))).status).toBe(404);
  const absent = request();
  absent.headers.delete("origin");
  expect((await route.POST(absent)).status).toBe(404);
  expect(mock.context).not.toHaveBeenCalled();
  mock.context.mockRejectedValue(Error("offline"));
  expect((await route.POST(request())).status).toBe(404);
});
