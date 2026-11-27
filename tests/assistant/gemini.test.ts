import { seededFirmLists } from "@/fixtures/firm-lists";
import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { GeminiAssistantModel } from "@/modules/assistant/infrastructure/gemini-model";
import { assistantConfig } from "@/modules/assistant/infrastructure/config";
import { assistantTools } from "@/modules/assistant/application/read-tools";
const input = {
  instructions: "Read records only.",
  messages: [{ role: "user" as const, text: "Jobs?" }],
  tools: assistantTools(seededFirmLists),
  maxOutputTokens: 2048,
  signal: new AbortController().signal,
};
const body = {
  usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 12, thoughtsTokenCount: 8 },
  candidates: [
    {
      finishReason: "STOP",
      content: { parts: [{ functionCall: { name: "list_jobs", args: { stageGroup: "quote" } } }] },
    },
  ],
};
describe("Gemini boundary (network fake only)", () => {
  it("uses the documented endpoint and function schema with the key only in a header", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(body));
    const out = await new GeminiAssistantModel(
      "synthetic-test-key",
      "gemini-3.5-flash-lite",
      request,
    ).generate(input);
    expect(out.usage).toEqual({ inputTokens: 100, outputTokens: 20 });
    expect(out.result.kind).toBe("TOOLS");
    expect(request.mock.calls[0]?.[0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    );
    const options = request.mock.calls[0]?.[1];
    expect(options?.headers).toHaveProperty("x-goog-api-key", "synthetic-test-key");
    expect(String(options?.body)).not.toContain("synthetic-test-key");
    expect(String(options?.body)).toContain("parametersJsonSchema");
    expect(JSON.parse(String(options?.body)).toolConfig.functionCallingConfig.mode).toBe("ANY");
  });
  it.each([40] as const)(
    "constrains the provider to the turn's valid maximum of %i parts",
    async (maxAnswerParts) => {
      const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(body));
      await new GeminiAssistantModel("synthetic", "configured-model", request).generate({
        ...input,
        maxAnswerParts,
      });
      const schema = JSON.parse(
        String(request.mock.calls[0]![1]!.body),
      ).tools[0].functionDeclarations.at(-1).parametersJsonSchema;
      expect(schema.properties.parts.maxItems).toBe(maxAnswerParts);
    },
  );
  it("parses final structured answers and refuses writes, malformed or truncated responses", async () => {
    const answer = { parts: [], followUps: [] };
    const payload = {
      ...body,
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ functionCall: { name: "submit_answer", args: answer } }] },
        },
      ],
    };
    expect(
      (
        await new GeminiAssistantModel(
          "test",
          "model",
          vi.fn<typeof fetch>().mockResolvedValue(Response.json(payload)),
        ).generate(input)
      ).result,
    ).toEqual({ kind: "ANSWER", answer });
    for (const payload of [
      { ...body, candidates: [{ finishReason: "MAX_TOKENS" }] },
      {
        ...body,
        candidates: [
          {
            finishReason: "STOP",
            content: { parts: [{ functionCall: { name: "delete_job", args: {} } }] },
          },
        ],
      },
      {},
    ]) {
      await expect(
        new GeminiAssistantModel(
          "test",
          "model",
          vi.fn<typeof fetch>().mockResolvedValue(Response.json(payload)),
        ).generate(input),
      ).rejects.toThrow("ASSISTANT_PROVIDER_UNAVAILABLE");
    }
  });
  it("retains token counts on truncated output", async () => {
    await expect(
      new GeminiAssistantModel(
        "test",
        "model",
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(
            Response.json({ ...body, candidates: [{ finishReason: "MAX_TOKENS" }] }),
          ),
      ).generate(input),
    ).rejects.toMatchObject({
      reason: "OUTPUT_CAP",
      usage: { inputTokens: 100, outputTokens: 20 },
    });
  });
  it("does not expose provider bodies or credentials in exceptions", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("secret-key private records", { status: 403 }));
    await expect(
      new GeminiAssistantModel("secret-key", "model", request).generate(input),
    ).rejects.toThrow(/^ASSISTANT_PROVIDER_UNAVAILABLE$/);
  });
  it("bounds the provider response body", async () => {
    await expect(
      new GeminiAssistantModel(
        "test",
        "model",
        vi.fn<typeof fetch>().mockResolvedValue(new Response("a".repeat(131073))),
      ).generate(input),
    ).rejects.toThrow("ASSISTANT_PROVIDER_UNAVAILABLE");
  });
});
describe("server configuration", () => {
  it("requires an explicit flag and paid-tier confirmation", () => {
    expect(assistantConfig({}).enabled).toBe(false);
    expect(assistantConfig({ STRIDEBRAIN_AI_ENABLED: "true" }).enabled).toBe(false);
    expect(
      assistantConfig({
        STRIDEBRAIN_AI_ENABLED: "true",
        STRIDEBRAIN_AI_PAID_TIER_CONFIRMED: "true",
      }).enabled,
    ).toBe(true);
  });
  it("bounds caps and requires prices when changing model", () => {
    for (const env of [
      { STRIDEBRAIN_AI_MAX_TOOL_CALLS: "7" },
      { STRIDEBRAIN_AI_DAILY_CALLS: "0" },
      { STRIDEBRAIN_AI_MODEL: "gemini-other" },
      { STRIDEBRAIN_AI_PROVIDER: "other" },
    ])
      expect(() => assistantConfig(env)).toThrow("ASSISTANT_CONFIGURATION_INVALID");
  });
});
