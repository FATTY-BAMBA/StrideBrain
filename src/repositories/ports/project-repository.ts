import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export type ProjectWorkspaceRecord = {
  id: string;
  businessKey: string;
  organizationId: string;
  recordVersion: number;
};

export interface ProjectRepositoryPort {
  getAuthorizedByBusinessKey(
    context: RuntimeContext,
    projectKey: string,
  ): Promise<ProjectWorkspaceRecord | null>;
}
