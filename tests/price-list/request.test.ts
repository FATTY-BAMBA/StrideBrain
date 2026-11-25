import { afterEach, expect, it, vi } from "vitest";
import { readQuotePrices } from "@/modules/price-list/request";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const input = {
  mode: "HISTORY" as const,
  search: "天花板",
  unit: "坪",
  page: 1,
  projectKey: "JOB",
};
it("posts document text only in JSON outside the Server Action queue, with private credentials", async () => {
  vi.useFakeTimers();
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ kind: "AVAILABLE", rows: [], hasMore: false }));
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController(),
    remove = vi.spyOn(controller.signal, "removeEventListener");
  expect(await readQuotePrices("zh-TW", input, controller.signal)).toMatchObject({
    kind: "AVAILABLE",
  });
  const [url, init] = fetch.mock.calls[0]!;
  expect(url).toBe("/api/quotes/prices");
  expect(init).toMatchObject({
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "x-stridebrain-price-read": "1", "Content-Type": "application/json" },
  });
  expect(JSON.parse(init.body)).toEqual({ locale: "zh-TW", ...input });
  expect(init.signal.aborted).toBe(false);
  expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  expect(vi.getTimerCount()).toBe(0);
});
function pendingFetch() {
  const fetch = vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal!.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
it("forwards caller cancellation without AbortSignal.any and cleans up the timeout", async () => {
  vi.useFakeTimers();
  const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, "any")!;
  Object.defineProperty(AbortSignal, "any", { value: undefined, configurable: true });
  try {
    const fetch = pendingFetch(),
      controller = new AbortController();
    const result = readQuotePrices("en", input, controller.signal);
    expect(fetch).toHaveBeenCalledTimes(1);
    controller.abort();
    expect(await result).toEqual({ kind: "UNAVAILABLE" });
    expect(fetch.mock.calls[0]![1].signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    Object.defineProperty(AbortSignal, "any", descriptor);
  }
});
it("times out at ten seconds and removes the caller listener", async () => {
  vi.useFakeTimers();
  const fetch = pendingFetch(),
    controller = new AbortController(),
    remove = vi.spyOn(controller.signal, "removeEventListener");
  const result = readQuotePrices("en", input, controller.signal);
  await vi.advanceTimersByTimeAsync(9999);
  expect(fetch.mock.calls[0]![1].signal!.aborted).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(await result).toEqual({ kind: "UNAVAILABLE" });
  expect(fetch.mock.calls[0]![1].signal!.aborted).toBe(true);
  expect(controller.signal.aborted).toBe(false);
  expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  expect(vi.getTimerCount()).toBe(0);
});
it("does not send an already cancelled read", async () => {
  vi.useFakeTimers();
  const fetch = pendingFetch(),
    controller = new AbortController();
  controller.abort();
  expect(await readQuotePrices("en", input, controller.signal)).toEqual({ kind: "UNAVAILABLE" });
  expect(fetch).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
it("returns a visible unavailable outcome for HTTP or network failure", async () => {
  vi.useFakeTimers();
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockRejectedValueOnce(Error("offline"));
  vi.stubGlobal("fetch", fetch);
  for (let i = 0; i < 2; i++)
    expect(await readQuotePrices("en", input, new AbortController().signal)).toEqual({
      kind: "UNAVAILABLE",
    });
  expect(vi.getTimerCount()).toBe(0);
});
