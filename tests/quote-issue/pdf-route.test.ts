import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ context: vi.fn(), document: vi.fn(), render: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.context }));
vi.mock("@/lib/server/quote-issue-services", () => ({
  createQuoteIssueServices: () => ({ document: { execute: mocks.document } }),
}));
vi.mock("@/modules/quote-issue/infrastructure/render-quote-pdf", () => ({
  renderQuotePdf: mocks.render,
}));
import { GET, POST } from "@/app/api/quotes/[versionId]/pdf/route";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.context.mockResolvedValue({ membershipId: "trusted" });
  mocks.render.mockResolvedValue(Buffer.from("%PDF-synthetic"));
});
const params = Promise.resolve({ versionId: "version" });
it("authorizes before rendering, returns no private data for a denial or missing session", async () => {
  mocks.document.mockResolvedValue({ kind: "UNAVAILABLE" });
  const response = await GET(new Request("https://app.test/api/quotes/version/pdf"), { params });
  expect(response.status).toBe(404);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.render).not.toHaveBeenCalled();
  mocks.context.mockResolvedValue(null);
  mocks.document.mockClear();
  expect(
    (await GET(new Request("https://app.test/api/quotes/version/pdf"), { params })).status,
  ).toBe(404);
  expect(mocks.document).not.toHaveBeenCalled();
});
it("sets PDF filename and private caching from the authorized snapshot, and passes draft preview options", async () => {
  const snapshot = { documentNumber: "J-2611-A7K3-Q1" };
  mocks.document.mockResolvedValue({ kind: "DOCUMENT", snapshot, draft: false });
  const response = await GET(new Request("https://app.test/api/quotes/version/pdf"), { params });
  expect(response.headers.get("Content-Disposition")).toBe('inline; filename="J-2611-A7K3-Q1.pdf"');
  expect(response.headers.get("Content-Type")).toBe("application/pdf");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.render).toHaveBeenCalledWith(snapshot, false);
  const options = { language: "zh-TW", attention: "" };
  mocks.document.mockResolvedValue({ kind: "DOCUMENT", snapshot, draft: true });
  await POST(
    new Request("https://app.test/api/quotes/version/pdf", {
      method: "POST",
      body: JSON.stringify(options),
    }),
    { params },
  );
  expect(mocks.document).toHaveBeenLastCalledWith({ membershipId: "trusted" }, "version", options);
  expect(mocks.render).toHaveBeenLastCalledWith(snapshot, true);
});
it("bounds chunked preview bodies without a content-length header", async () => {
  const response = await POST(
    new Request("https://app.test/api/quotes/version/pdf", {
      method: "POST",
      body: "x".repeat(64001),
    }),
    { params },
  );
  expect(response.status).toBe(413);
  expect(mocks.document).not.toHaveBeenCalled();
});
it("returns an empty private failure when rendering fails", async () => {
  mocks.document.mockResolvedValue({ kind: "DOCUMENT", snapshot: {}, draft: false });
  mocks.render.mockRejectedValue(new Error("internal detail"));
  const response = await GET(new Request("https://app.test/api/quotes/version/pdf"), { params });
  expect(response.status).toBe(503);
  expect(await response.text()).toBe("");
});
