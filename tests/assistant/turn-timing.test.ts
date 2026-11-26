import { afterEach, describe, expect, it, vi } from "vitest";
import { jobContext } from "../projects/job-fixture";
const mocks = vi.hoisted(() => ({ after: vi.fn(), record: vi.fn(), prisma: {} }));
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/lib/server/prisma", () => ({ getPrismaClient: () => mocks.prisma }));
vi.mock("@/repositories/prisma/prisma-assistant-repository", () => ({
  PrismaAssistantRepository: class {
    recordTurnTiming = mocks.record;
  },
}));
import { scheduleAssistantTurnTiming } from "@/lib/server/assistant-turn-timing";
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe("whole action timing", () => {
  it("records through response completion, without waiting for its write", async () => {
    vi.useFakeTimers();
    const start = new Date("2026-11-26T00:00:00Z"),
      context = jobContext();
    vi.setSystemTime(new Date(start.getTime() + 250)); // runtime resolution
    scheduleAssistantTurnTiming(context, start);
    expect(mocks.record).not.toHaveBeenCalled();
    vi.setSystemTime(new Date(start.getTime() + 9300)); // reads, model, response
    await mocks.after.mock.calls.at(-1)![0]();
    expect(mocks.record).toHaveBeenCalledWith(context, start, new Date(start.getTime() + 9300));
  });
  it("contains a timing write failure and logs request metadata only", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.record.mockRejectedValueOnce(new Error("private body"));
    const context = jobContext();
    scheduleAssistantTurnTiming(context, new Date());
    await mocks.after.mock.calls.at(-1)![0]();
    expect(warn).toHaveBeenCalledWith(
      JSON.stringify({ event: "ASSISTANT_TIMING_UNAVAILABLE", requestId: context.requestId }),
    );
  });
});
