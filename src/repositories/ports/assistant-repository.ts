import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  AssistantConfig,
  FallbackReason,
  TokenUsage,
  ToolName,
} from "@/modules/assistant/domain/contracts";
export type AssistantJobPolicy = Readonly<{ id: string; excluded: boolean }>;
export type AssistantSettings = Readonly<{
  enabled: boolean;
  calls: number;
  estimatedUsd: string;
  unmeteredCalls: number;
}>;
export type AssistantControlInput = Readonly<{
  target: "ORGANIZATION" | "PROJECT";
  projectKey?: string;
  enabled: boolean;
  idempotencyKey: string;
}>;
export type AssistantControlOutcome = Readonly<{
  kind: "SAVED" | "UNAVAILABLE" | "INVALID" | "CONFLICT";
}>;
export interface AssistantRepositoryPort {
  readableReferences(
    context: RuntimeContext,
    candidates: readonly string[],
  ): Promise<readonly string[]>;
  enabled(context: RuntimeContext): Promise<boolean>;
  jobPolicy(context: RuntimeContext, key: string): Promise<AssistantJobPolicy | null>;
  settings(context: RuntimeContext, monthStart: Date): Promise<AssistantSettings | null>;
  setControl(
    context: RuntimeContext,
    input: AssistantControlInput,
  ): Promise<AssistantControlOutcome>;
  reserveCall(
    context: RuntimeContext,
    config: AssistantConfig,
    now: Date,
    sent: Readonly<{ toolNames: readonly ToolName[]; sourceIds: readonly string[] }>,
  ): Promise<string | null>;
  meterCall(
    context: RuntimeContext,
    id: string,
    usage: TokenUsage,
    estimatedUsd: string,
  ): Promise<void>;
  finishTurn(
    context: RuntimeContext,
    outcome: "ANSWERED" | `FALLBACK_${FallbackReason}`,
  ): Promise<void>;
}
