import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AssistantSettings } from "@/components/assistant/assistant-settings";
import { assistantCopy } from "@/modules/localization/assistant";
import { jobContext } from "../projects/job-fixture";
const boundary = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/lib/server/assistant-services", () => ({
  createAssistantServices: () => ({
    config: { model: "configured-model", enabled: true },
    repository: { settings: boundary.read },
  }),
}));
vi.mock("@/lib/server/assistant-availability", () => ({ assistantConfigured: () => true }));
vi.mock("@/components/assistant/assistant-control", () => ({ AssistantControl: () => null }));
describe("AI failure settings", () => {
  it.each(["en", "zh-TW"] as const)(
    "renders the seven-day counts, empty state and read failure in %s",
    async (locale) => {
      const settings = {
        enabled: true,
        calls: 8,
        estimatedUsd: "0.001",
        unmeteredCalls: 0,
        turnTimings: {
          count: 9,
          latestMs: 1234,
          maximumMs: 9999,
          recent: [
            {
              requestId: "request",
              startedAt: new Date("2026-11-26T00:00:00Z"),
              serverDurationMs: 1234,
            },
          ],
        },
        failures: [{ code: "PROVIDER_HTTP", httpStatus: 429, count: 2 }],
      };
      boundary.read.mockResolvedValue(settings);
      const html = renderToStaticMarkup(
        await AssistantSettings({ context: jobContext({ locale }) }),
      );
      expect(html).toContain(assistantCopy(locale).failures);
      expect(html).toContain(assistantCopy(locale).turnTimings);
      expect(html).toContain(locale === "en" ? "1.2 s" : "1.2 秒");
      expect(html).toContain("<details>");
      expect(html).not.toContain("<details open");
      expect(html).toContain(locale === "en" ? "10.0 s" : "10.0 秒");
      expect(html).toContain("2026-11-26 00:00:00.000");
      expect(html).toContain(">429</td>");
      expect(html).not.toContain("PROVIDER_HTTP");
      expect(html).toContain(">2</td>");
      expect(html).toContain('tabindex="0"');
      expect(html).toContain('scope="row"');
      expect(html).not.toMatch(/private|responseBody|rawAnswer/);
      boundary.read.mockResolvedValue({ ...settings, failures: [] });
      expect(
        renderToStaticMarkup(await AssistantSettings({ context: jobContext({ locale }) })),
      ).toContain(assistantCopy(locale).noFailures);
      boundary.read.mockRejectedValue(new Error("private database failure"));
      const unavailable = renderToStaticMarkup(
        await AssistantSettings({ context: jobContext({ locale }) }),
      );
      expect(unavailable).toContain(assistantCopy(locale).unavailable);
      expect(unavailable).not.toContain("private database failure");
    },
  );
});
