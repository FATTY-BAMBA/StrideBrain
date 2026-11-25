import "server-only";
import { AssistantModelError } from "../domain/model-error";
import type { TokenUsage, JobDraftModelPort } from "../domain/contracts";
import { jobDraftSchema } from "../domain/job-draft";
import { record } from "../domain/grounding";
import {
  toolNames,
  type AssistantModelPort,
  type ModelReply,
  type ToolCall,
} from "../domain/contracts";

const answerDeclaration = {
  name: "submit_answer",
  description:
    "Finish with a grounded short answer. Use empty sourceIds when records cannot answer the question.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      text: { type: "string", maxLength: 1400 },
      sourceIds: { type: "array", items: { type: "string" }, maxItems: 30 },
      followUps: { type: "array", items: { type: "string", maxLength: 160 }, maxItems: 3 },
    },
    required: ["text", "sourceIds", "followUps"],
    additionalProperties: false,
  },
};
async function boundedJson(response: Response): Promise<unknown> {
  if (!response.ok || !response.body) throw new Error("ASSISTANT_PROVIDER_UNAVAILABLE");
  const reader = response.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 131072) throw new Error("ASSISTANT_PROVIDER_OUTPUT_LIMIT");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
/** Stateless generateContent calls avoid provider conversation retention and replayed model facts. */
export class GeminiAssistantModel implements AssistantModelPort, JobDraftModelPort {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly request: typeof fetch = fetch,
  ) {}
  async draftJob(input: Parameters<JobDraftModelPort["draftJob"]>[0]) {
    let knownUsage: TokenUsage | undefined;
    try {
      const response = await this.request(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
          signal: input.signal,
          cache: "no-store",
          redirect: "error",
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: input.instructions }] },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: JSON.stringify({
                      kind: "UNTRUSTED_JOB_TEXT",
                      text: input.text,
                      choices: input.choices,
                    }),
                  },
                ],
              },
            ],
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "submit_job_draft",
                    description:
                      "Submit the supported fields of a review-only job draft; null means absent.",
                    parametersJsonSchema: jobDraftSchema({
                      clientType: input.choices.clientType?.map((entry) => entry.value) ?? [],
                      subtype: input.choices.subtype?.map((entry) => entry.value) ?? [],
                      scopeCategoryIds:
                        input.choices.scopeCategoryIds?.map((entry) => entry.value) ?? [],
                    }),
                  },
                ],
              },
            ],
            toolConfig: {
              functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_job_draft"] },
            },
            generationConfig: { maxOutputTokens: input.maxOutputTokens },
          }),
        },
      );
      const body = record(await boundedJson(response)),
        usage = record(body?.usageMetadata);
      const inputTokens = usage?.promptTokenCount,
        outputTokens = usage?.candidatesTokenCount ?? 0,
        thoughts = usage?.thoughtsTokenCount ?? 0;
      if (
        ![inputTokens, outputTokens, thoughts].every(
          (v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= 10000000,
        )
      )
        throw new Error("INVALID_USAGE");
      knownUsage = {
        inputTokens: inputTokens as number,
        outputTokens: (outputTokens as number) + (thoughts as number),
      };
      if (!Array.isArray(body?.candidates) || body.candidates.length !== 1)
        throw new Error("INVALID_CANDIDATE");
      const candidate = record(body.candidates[0]),
        parts = record(candidate?.content)?.parts;
      if (candidate?.finishReason === "MAX_TOKENS")
        throw new AssistantModelError("OUTPUT_CAP", knownUsage);
      if (candidate?.finishReason !== "STOP" || !Array.isArray(parts) || parts.length !== 1)
        throw new Error("INVALID_OUTPUT");
      const part = record(parts[0]),
        call = record(part?.functionCall);
      if (part?.text !== undefined || call?.name !== "submit_job_draft" || !record(call.args))
        throw new Error("INVALID_CALL");
      return { draft: call.args, usage: knownUsage };
    } catch (error) {
      if (error instanceof AssistantModelError) throw error;
      throw new AssistantModelError(knownUsage ? "INVALID_OUTPUT" : "UNAVAILABLE", knownUsage);
    }
  }
  async generate(input: Parameters<AssistantModelPort["generate"]>[0]): Promise<ModelReply> {
    let knownUsage: TokenUsage | undefined;
    try {
      const response = await this.request(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
          signal: input.signal,
          cache: "no-store",
          redirect: "error",
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: input.instructions }] },
            contents: [
              {
                role: "user",
                parts: input.messages.map((m) => ({
                  text: JSON.stringify({
                    kind: m.role === "data" ? "UNTRUSTED_RECORD_DATA" : "USER_QUESTION",
                    content: m.text,
                  }),
                })),
              },
            ],
            tools: [
              {
                functionDeclarations: [
                  ...input.tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    parametersJsonSchema: t.parameters,
                  })),
                  answerDeclaration,
                ],
              },
            ],
            toolConfig: { functionCallingConfig: { mode: "ANY" } },
            generationConfig: { maxOutputTokens: input.maxOutputTokens },
          }),
        },
      );
      const body = record(await boundedJson(response)),
        usage = record(body?.usageMetadata);
      const inputTokens = usage?.promptTokenCount,
        responseTokens = usage?.candidatesTokenCount ?? 0,
        thinkingTokens = usage?.thoughtsTokenCount ?? 0;
      if (
        ![inputTokens, responseTokens, thinkingTokens].every(
          (v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= 10000000,
        )
      )
        throw new Error("INVALID_USAGE");
      knownUsage = {
        inputTokens: inputTokens as number,
        outputTokens: (responseTokens as number) + (thinkingTokens as number),
      };
      const candidates = body?.candidates;
      if (!Array.isArray(candidates) || candidates.length !== 1)
        throw new Error("INVALID_CANDIDATE");
      const candidate = record(candidates[0]),
        content = record(candidate?.content),
        parts = content?.parts;
      if (candidate?.finishReason === "MAX_TOKENS")
        throw new AssistantModelError("OUTPUT_CAP", knownUsage);
      if (candidate?.finishReason !== "STOP" || !Array.isArray(parts))
        throw new Error("INCOMPLETE_OUTPUT");
      const calls = parts.flatMap((p) => {
        const part = record(p);
        return part?.functionCall ? [record(part.functionCall)] : [];
      });
      if (
        !calls.length ||
        calls.length > 6 ||
        calls.some((c) => !c || typeof c.name !== "string" || !record(c.args))
      )
        throw new Error("INVALID_CALLS");
      const tokens = {
        inputTokens: inputTokens as number,
        outputTokens: (responseTokens as number) + (thinkingTokens as number),
      };
      if (calls.length === 1 && calls[0]?.name === "submit_answer")
        return { usage: tokens, result: { kind: "ANSWER", answer: calls[0].args } };
      if (
        calls.some(
          (c) =>
            !toolNames.includes(c!.name as ToolCall["name"]) ||
            !input.tools.some((t) => t.name === c!.name),
        )
      )
        throw new Error("UNKNOWN_TOOL");
      return {
        usage: tokens,
        result: {
          kind: "TOOLS",
          calls: calls.map((c) => ({
            name: c!.name as ToolCall["name"],
            arguments: record(c!.args)!,
          })),
        },
      };
    } catch (error) {
      if (error instanceof AssistantModelError) throw error;
      throw new AssistantModelError(knownUsage ? "INVALID_OUTPUT" : "UNAVAILABLE", knownUsage);
    }
  }
}
