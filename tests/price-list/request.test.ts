import { afterEach, expect, it, vi } from "vitest";
import { readQuotePrices } from "@/modules/price-list/request";
afterEach(() => vi.unstubAllGlobals());
const input = {
  mode: "HISTORY" as const,
  search: "天花板",
  unit: "坪",
  page: 1,
  projectKey: "JOB",
};
it("uses GET outside the Server Action queue with cancellation and private credentials", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ kind: "AVAILABLE", rows: [], hasMore: false }));
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  expect(await readQuotePrices("zh-TW", input, controller.signal)).toMatchObject({
    kind: "AVAILABLE",
  });
  const [url, init] = fetch.mock.calls[0]!;
  expect(new URL(url, "https://stridebrain.test").searchParams.get("search")).toBe("天花板");
  expect(init).toMatchObject({
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "x-stridebrain-price-read": "1" },
  });
  expect(init.signal.aborted).toBe(false);
  controller.abort();
  expect(init.signal.aborted).toBe(true);
});
it("returns a visible unavailable outcome for HTTP or network failure", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockRejectedValueOnce(Error("offline"));
  vi.stubGlobal("fetch", fetch);
  for (let i = 0; i < 2; i++)
    expect(await readQuotePrices("en", input, new AbortController().signal)).toEqual({
      kind: "UNAVAILABLE",
    });
});
