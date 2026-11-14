import type {
  Stage4ComparisonOutcome,
  Stage4ComparisonResult,
} from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";

export type ReopenComparisonRunOutcome =
  | Readonly<{ kind: "COMPLETE"; result: Stage4ComparisonResult }>
  | Extract<Stage4ComparisonOutcome, { kind: "UNAVAILABLE" }>;

export class GetComparisonRun {
  constructor(private readonly runs: ComparisonRunRepositoryPort) {}

  async execute(
    context: RuntimeContext,
    comparisonRunId: string,
  ): Promise<ReopenComparisonRunOutcome> {
    const result = await this.runs.getAuthorizedResult(context, comparisonRunId);
    if (!result) {
      return Object.freeze({
        kind: "UNAVAILABLE",
        errorCode: "PROJECT_UNAVAILABLE",
        requestId: context.requestId,
      });
    }
    return Object.freeze({ kind: "COMPLETE", result });
  }
}
