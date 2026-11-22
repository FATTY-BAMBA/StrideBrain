import type { Locale } from "@/modules/localization/config";

export const toolNames = [
  "list_jobs",
  "get_job",
  "get_quote_status",
  "list_awaiting_client",
  "get_saved_comparison",
  "get_past_prices",
  "get_closed_job_lessons",
] as const;
export type ToolName = (typeof toolNames)[number];
export type ToolCall = Readonly<{ name: ToolName; arguments: Readonly<Record<string, unknown>> }>;
export type ToolDefinition = Readonly<{
  name: ToolName;
  description: string;
  parameters: Readonly<Record<string, unknown>>;
}>;
export type AssistantSource = Readonly<{
  sourceId: string;
  href: string;
  label: string;
  facts: Readonly<Record<string, unknown>>;
  /** Server-only access dependencies; never model-controlled. */
  projectKeys: readonly string[];
}>;
export type ToolResult = Readonly<{
  status: "OK" | "NO_RECORDS" | "UNAVAILABLE" | "EXCLUDED" | "OUT_OF_DATE";
  sources: readonly AssistantSource[];
}>;
export type StructuredAnswer = Readonly<{
  text: string;
  sourceIds: readonly string[];
  followUps: readonly string[];
}>;
export type TokenUsage = Readonly<{ inputTokens: number; outputTokens: number }>;
export type ModelReply = Readonly<{
  result: { kind: "TOOLS"; calls: readonly ToolCall[] } | { kind: "ANSWER"; answer: unknown };
  usage: TokenUsage;
}>;
export type ModelMessage = Readonly<{ role: "user" | "data"; text: string }>;
/** No provider SDK type, database handle or tool executor crosses this port. */
export interface AssistantModelPort {
  generate(
    input: Readonly<{
      instructions: string;
      messages: readonly ModelMessage[];
      tools: readonly ToolDefinition[];
      maxOutputTokens: number;
      signal: AbortSignal;
    }>,
  ): Promise<ModelReply>;
}
export type FallbackReason =
  | "DISABLED"
  | "NO_KEY"
  | "CONFIGURATION"
  | "UNAVAILABLE"
  | "TIMEOUT"
  | "DAILY_CAP"
  | "TOOL_CAP"
  | "OUTPUT_CAP"
  | "INVALID_OUTPUT"
  | "UNGROUNDED"
  | "ACCESS_CHANGED";
export type AssistantOutcome =
  | Readonly<{ kind: "FALLBACK"; reason: FallbackReason }>
  | Readonly<{
      kind: "ANSWER";
      answer: StructuredAnswer;
      sources: readonly AssistantSource[];
      locale: Locale;
    }>;
export type AssistantConfig = Readonly<{
  enabled: boolean;
  provider: "gemini";
  model: string;
  timeoutMs: number;
  maxToolCalls: number;
  maxOutputTokens: number;
  dailyCalls: number;
  inputUsdPerMillion: string;
  outputUsdPerMillion: string;
}>;
