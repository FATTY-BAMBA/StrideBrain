import { beforeEach, expect, it, vi } from "vitest";
import { jobContext } from "../projects/job-fixture";
const mocks = vi.hoisted(() => ({
  runtime: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  jobs: vi.fn(),
  quotes: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mocks.runtime }));
vi.mock("@/lib/server/client-services", () => ({
  createClientServices: () => ({
    get: { execute: mocks.get },
    list: { execute: mocks.list },
    jobs: { execute: mocks.jobs },
  }),
}));
vi.mock("@/lib/server/quote-list-services", () => ({
  createQuoteListService: () => ({ execute: mocks.quotes }),
}));
import ClientsPage from "@/app/[locale]/clients/page";
import ClientPage from "@/app/[locale]/clients/[clientKey]/page";
import QuotesPage from "@/app/[locale]/quotes/page";
beforeEach(() => vi.clearAllMocks());
it.each(["en", "zh-TW"])(
  "denies the Viewer client routes before reading records in %s",
  async (locale) => {
    mocks.runtime.mockResolvedValue(jobContext({ capabilities: new Set(["project:read"]) }));
    await expect(
      ClientsPage({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NOT_FOUND");
    await expect(
      ClientPage({
        params: Promise.resolve({ locale, clientKey: "CLIENT-01" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.jobs).not.toHaveBeenCalled();
  },
);
it("does not fetch a foreign client's jobs or quotes when the authorized client read is unavailable", async () => {
  mocks.runtime.mockResolvedValue(jobContext());
  mocks.get.mockResolvedValue({ kind: "UNAVAILABLE" });
  await expect(
    ClientPage({
      params: Promise.resolve({ locale: "en", clientKey: "FOREIGN-CLIENT" }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow("NOT_FOUND");
  expect(mocks.jobs).not.toHaveBeenCalled();
  expect(mocks.quotes).not.toHaveBeenCalled();
});
it("keeps quote access scoped to the server identity and does not read before sign-in", async () => {
  mocks.runtime.mockResolvedValue(null);
  await QuotesPage({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({}),
  });
  expect(mocks.quotes).not.toHaveBeenCalled();
  const context = jobContext();
  mocks.runtime.mockResolvedValue(context);
  mocks.quotes.mockResolvedValue({ kind: "UNAVAILABLE" });
  await QuotesPage({
    params: Promise.resolve({ locale: "zh-TW" }),
    searchParams: Promise.resolve({ status: "ISSUED" }),
  });
  expect(mocks.quotes).toHaveBeenCalledWith(
    { ...context, locale: "zh-TW" },
    { status: "ISSUED", page: 1 },
  );
});
