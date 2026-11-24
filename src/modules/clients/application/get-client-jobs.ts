import { BUSINESS_KEY } from "@/modules/projects/domain/job-input";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ClientJobsRepository } from "@/repositories/ports/client-jobs-repository";
export class GetClientJobs {
  constructor(private readonly jobs: ClientJobsRepository) {}
  async execute(context: RuntimeContext, clientKey: string, page = 1) {
    if (
      !context.capabilities.has("client:read") ||
      !context.capabilities.has("project:read") ||
      !BUSINESS_KEY.test(clientKey) ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 10000
    )
      return { kind: "UNAVAILABLE" } as const;
    try {
      const result = await this.jobs.list(context, clientKey, page);
      return result ? { kind: "AVAILABLE" as const, ...result } : { kind: "UNAVAILABLE" as const };
    } catch {
      return { kind: "FAILED" } as const;
    }
  }
}
