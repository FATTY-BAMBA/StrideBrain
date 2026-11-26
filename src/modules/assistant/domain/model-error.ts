import type { TokenUsage } from "./contracts";
/** Sanitized failure; known usage survives invalid/truncated output without keeping provider text. */
export class AssistantModelError extends Error {
  constructor(
    readonly reason: "UNAVAILABLE" | "INVALID_OUTPUT" | "OUTPUT_CAP",
    readonly usage?: TokenUsage,
    readonly failure?: Readonly<{
      code: "PROVIDER_HTTP" | "PROVIDER_NETWORK" | "TIMEOUT";
      httpStatus?: number;
    }>,
  ) {
    super("ASSISTANT_PROVIDER_UNAVAILABLE");
    this.name = "AssistantModelError";
  }
}
