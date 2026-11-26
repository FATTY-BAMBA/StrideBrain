import { estimatedCost } from "@/modules/assistant/domain/usage-cost";
import {
  compare,
  decimalFromString,
  decimalToString,
  sum,
  subtract,
} from "@/modules/finance/fixed-decimal";
import type { AssistantConfig, TokenUsage } from "@/modules/assistant/domain/contracts";
/** Dispatch-local spend guard. Reserves an intentionally conservative token bound
 * before every call; unknown failure usage keeps its reservation. Never logs content. */
export class EvaluationBudget {
  private charged = decimalFromString("0", 9);
  private readonly limit;
  constructor(
    readonly maximumUsd: string,
    private readonly prices: Pick<AssistantConfig, "inputUsdPerMillion" | "outputUsdPerMillion">,
  ) {
    if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,9})?$/.test(maximumUsd))
      throw Error("INVALID_EVALUATION_BUDGET");
    this.limit = decimalFromString(maximumUsd, 9);
    if (compare(this.limit, decimalFromString("0", 9)) <= 0)
      throw Error("INVALID_EVALUATION_BUDGET");
  }
  get estimatedUsd() {
    return decimalToString(this.charged);
  }
  async call<T extends { usage: TokenUsage }>(
    input: { maxOutputTokens: number },
    invoke: () => Promise<T>,
  ): Promise<T> {
    // UTF-8 bytes overestimate input tokens; extra allowance covers provider schema framing.
    const upper = decimalFromString(
      estimatedCost(
        {
          inputTokens: Buffer.byteLength(JSON.stringify(input), "utf8") + 8192,
          outputTokens: input.maxOutputTokens,
        },
        this.prices,
      ),
      9,
    );
    if (compare(sum([this.charged, upper], 9), this.limit) > 0)
      throw Error("EVALUATION_BUDGET_REACHED");
    this.charged = sum([this.charged, upper], 9);
    const reply = await invoke();
    this.charged = sum(
      [
        subtract(this.charged, upper),
        decimalFromString(estimatedCost(reply.usage, this.prices), 9),
      ],
      9,
    );
    return reply;
  }
}
