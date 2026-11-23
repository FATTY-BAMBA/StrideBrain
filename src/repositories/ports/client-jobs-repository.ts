import type { RuntimeContext } from "@/modules/runtime-context/contracts";
export type ClientJob = Readonly<{ businessKey: string; name: string; stage: string }>;
export interface ClientJobsRepository {
  list(
    context: RuntimeContext,
    clientKey: string,
    page: number,
  ): Promise<{ jobs: readonly ClientJob[]; hasMore: boolean } | null>;
}
