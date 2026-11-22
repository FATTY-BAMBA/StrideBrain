import type { AssistantConfig } from "../domain/contracts";
function integer(input: string | undefined, fallback: number, min: number, max: number) {
  const value = input === undefined ? fallback : Number(input);
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new Error("ASSISTANT_CONFIGURATION_INVALID");
  return value;
}
export function assistantConfig(env: Record<string, string | undefined>): AssistantConfig {
  if (env.STRIDEBRAIN_AI_PROVIDER && env.STRIDEBRAIN_AI_PROVIDER !== "gemini")
    throw new Error("ASSISTANT_CONFIGURATION_INVALID");
  const model = env.STRIDEBRAIN_AI_MODEL ?? "gemini-3.5-flash-lite";
  if (!/^gemini-[a-zA-Z0-9.-]{1,80}$/.test(model))
    throw new Error("ASSISTANT_CONFIGURATION_INVALID");
  const inputUsdPerMillion = env.STRIDEBRAIN_AI_INPUT_USD_PER_MILLION ?? "0.30",
    outputUsdPerMillion = env.STRIDEBRAIN_AI_OUTPUT_USD_PER_MILLION ?? "2.50";
  for (const price of [inputUsdPerMillion, outputUsdPerMillion])
    if (!/^\d{1,4}(?:\.\d{1,6})?$/.test(price)) throw new Error("ASSISTANT_CONFIGURATION_INVALID");
  if (
    model !== "gemini-3.5-flash-lite" &&
    (!env.STRIDEBRAIN_AI_INPUT_USD_PER_MILLION || !env.STRIDEBRAIN_AI_OUTPUT_USD_PER_MILLION)
  )
    throw new Error("ASSISTANT_CONFIGURATION_INVALID");
  return {
    enabled:
      env.STRIDEBRAIN_AI_ENABLED === "true" && env.STRIDEBRAIN_AI_PAID_TIER_CONFIRMED === "true",
    provider: "gemini",
    model,
    timeoutMs: integer(env.STRIDEBRAIN_AI_TIMEOUT_MS, 20000, 1000, 60000),
    maxToolCalls: integer(env.STRIDEBRAIN_AI_MAX_TOOL_CALLS, 6, 1, 6),
    maxOutputTokens: integer(env.STRIDEBRAIN_AI_MAX_OUTPUT_TOKENS, 2048, 128, 8192),
    dailyCalls: integer(env.STRIDEBRAIN_AI_DAILY_CALLS, 500, 1, 10000),
    inputUsdPerMillion,
    outputUsdPerMillion,
  };
}
