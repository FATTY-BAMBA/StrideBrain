import {
  decimalToString,
  divide,
  multiply,
  quantity,
  sum,
  unitRate,
} from "@/modules/finance/fixed-decimal";
import type { AssistantConfig, TokenUsage } from "./contracts";
export function estimatedCost(
  usage: TokenUsage,
  config: Pick<AssistantConfig, "inputUsdPerMillion" | "outputUsdPerMillion">,
): string {
  return decimalToString(
    divide(
      sum(
        [
          multiply(quantity(String(usage.inputTokens)), unitRate(config.inputUsdPerMillion), 9),
          multiply(quantity(String(usage.outputTokens)), unitRate(config.outputUsdPerMillion), 9),
        ],
        9,
      ),
      quantity("1000000"),
      9,
    ),
  );
}
