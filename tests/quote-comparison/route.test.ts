import { expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ context: vi.fn(), execute: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mock.context }));
vi.mock("@/lib/env/server-env", () => ({
  getServerEnvironment: () => ({ appOrigin: new URL("https://stridebrain.test") }),
}));
vi.mock("@/lib/server/comparison-services", () => ({ createComparisonServices: () => ({}) }));
vi.mock("@/lib/server/quote-draft-services", () => ({ createQuoteDraftServices: () => ({}) }));
vi.mock("@/modules/quote-comparison/application/quote-comparison", () => ({
  QuoteComparisonService: class {
    execute = mock.execute;
  },
}));
import { GET, POST } from "@/app/api/projects/[projectKey]/quote-comparison/route";
import { jobContext } from "../projects/job-fixture";
const params = { params: Promise.resolve({ projectKey: "JOB" }) };
it("authenticates and never lets GET run a comparison; private responses", async () => {
  mock.context.mockResolvedValue(jobContext());
  mock.execute.mockResolvedValue({ kind: "NOT_RUN" });
  const response = await GET(
    new Request("https://stridebrain.test/api/projects/JOB/quote-comparison?locale=zh-TW"),
    params,
  );
  expect(await response.json()).toEqual({ kind: "NOT_RUN" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(mock.execute).toHaveBeenCalledWith(
    expect.objectContaining({ locale: "zh-TW" }),
    "JOB",
    "READ",
  );
});
it("requires same-origin for writes and refuses repeated or unknown query fields", async () => {
  for (const query of ["locale=en&locale=zh-TW", "locale=en&action=RUN", "locale=xx"]) {
    expect((await GET(new Request(`https://stridebrain.test/api?${query}`), params)).status).toBe(
      404,
    );
  }
  for (const origin of [null, "https://elsewhere.test"]) {
    expect(
      (
        await POST(
          new Request("https://stridebrain.test/api?locale=en", {
            method: "POST",
            headers: origin ? { origin } : {},
          }),
          params,
        )
      ).status,
    ).toBe(404);
  }
  expect(mock.execute).not.toHaveBeenCalled();
});
it("anonymous and denied records share a non-disclosing response", async () => {
  mock.context.mockResolvedValue(null);
  expect((await GET(new Request("https://stridebrain.test/api?locale=en"), params)).status).toBe(
    404,
  );
  expect(mock.execute).not.toHaveBeenCalled();
  mock.context.mockResolvedValue(jobContext());
  mock.execute.mockResolvedValue({ kind: "UNAVAILABLE" });
  expect((await GET(new Request("https://stridebrain.test/api?locale=en"), params)).status).toBe(
    404,
  );
});
it("an explicit authenticated same-origin POST runs only the requested job", async () => {
  mock.context.mockResolvedValue(jobContext());
  mock.execute.mockResolvedValue({ kind: "NOT_RUN" });
  await POST(
    new Request("https://stridebrain.test/api?locale=en", {
      method: "POST",
      headers: { origin: "https://stridebrain.test" },
    }),
    params,
  );
  expect(mock.execute).toHaveBeenCalledWith(expect.anything(), "JOB", "RUN");
});

it("accepts an empty stream, including empty chunks, as supplied by the HTTP adapter", async () => {
  mock.context.mockResolvedValue(jobContext());
  mock.execute.mockResolvedValue({ kind: "NOT_RUN" });
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array());
      controller.close();
    },
  });
  const request = new Request("https://stridebrain.test/api?locale=en", {
    method: "POST",
    headers: { origin: "https://stridebrain.test" },
    body,
    duplex: "half",
  } as RequestInit);
  expect(request.body).not.toBeNull();
  expect((await POST(request, params)).status).toBe(200);
  expect(mock.execute).toHaveBeenCalledWith(expect.anything(), "JOB", "RUN");
});
it.each([" ", "{}", "x".repeat(10000)])(
  "refuses actual body bytes without running (%s)",
  async (body) => {
    mock.context.mockResolvedValue(jobContext());
    const request = new Request("https://stridebrain.test/api?locale=en", {
      method: "POST",
      headers: { origin: "https://stridebrain.test" },
      body,
    });
    expect((await POST(request, params)).status).toBe(404);
    expect(mock.execute).not.toHaveBeenCalled();
  },
);
