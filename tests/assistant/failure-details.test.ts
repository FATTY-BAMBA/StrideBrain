import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { GeminiAssistantModel } from "@/modules/assistant/infrastructure/gemini-model";
import { assistantFailureText } from "@/modules/localization/assistant";
const input = {
  instructions: "Read only",
  messages: [],
  tools: [],
  maxOutputTokens: 100,
  signal: new AbortController().signal,
};
describe("sanitized provider diagnostics", () => {
  it.each([401, 403, 429, 500, 503])("retains HTTP %i without the body or key", async (status) => {
    const model = new GeminiAssistantModel(
      "private-key",
      "model",
      vi.fn<typeof fetch>().mockResolvedValue(new Response("private-response", { status })),
    );
    const error = await model.generate(input).catch((e) => e);
    expect(error).toMatchObject({ failure: { code: "PROVIDER_HTTP", httpStatus: status } });
    expect(JSON.stringify(error)).not.toMatch(/private-key|private-response/);
  });
  it("distinguishes a network failure, timeout and malformed successful response", async () => {
    const model = (request: typeof fetch) => new GeminiAssistantModel("key", "model", request);
    await expect(
      model(vi.fn<typeof fetch>().mockRejectedValue(new Error("secret socket"))).generate(input),
    ).rejects.toMatchObject({ failure: { code: "PROVIDER_NETWORK" } });
    const controller = new AbortController();
    controller.abort();
    await expect(
      model(vi.fn<typeof fetch>().mockRejectedValue(new Error("secret"))).generate({
        ...input,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ failure: { code: "TIMEOUT" } });
    await expect(
      model(vi.fn<typeof fetch>().mockResolvedValue(new Response("invalid-json"))).generate(input),
    ).rejects.toMatchObject({ reason: "INVALID_OUTPUT" });
  });
  it.each(["en", "zh-TW"] as const)("explains status codes in %s", (locale) => {
    const text = (status: number) => assistantFailureText(locale, "PROVIDER_HTTP", status);
    expect(text(401)).toBe(text(403));
    expect(text(401)).toContain(locale === "en" ? "key" : "金鑰");
    expect(text(429)).toContain(locale === "en" ? "limit" : "限制");
    expect(text(503)).toContain(locale === "en" ? "error" : "錯誤");
  });
});
