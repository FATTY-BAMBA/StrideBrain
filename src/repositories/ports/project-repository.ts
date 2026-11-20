import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { CreateProjectInput, UpdateStageInput } from "@/modules/projects/domain/job-input";

export type CreateProjectResult =
  | { kind: "CREATED"; businessKey: string }
  | { kind: "DUPLICATE" | "CLIENT_DUPLICATE" | "CLIENT_UNAVAILABLE" | "UNAVAILABLE" | "CONFLICT" };
export type UpdateProjectStageResult =
  { kind: "UPDATED" } | { kind: "UNAVAILABLE" | "CONFLICT" | "INVALID" };

export type ProjectClientRecord = Readonly<{
  businessKey: string;
  nameEn: string;
  nameZhTw: string;
}>;
export interface ProjectClientRepositoryPort {
  listActiveClients(context: RuntimeContext): Promise<readonly ProjectClientRecord[]>;
}

/** Writes include their audit event in the same transaction. Read-only consumers
 * retain the smaller ProjectRepositoryPort below. */
export interface ProjectWriteRepositoryPort {
  createWithAudit(context: RuntimeContext, input: CreateProjectInput): Promise<CreateProjectResult>;
  updateStageWithAudit(
    context: RuntimeContext,
    input: UpdateStageInput,
  ): Promise<UpdateProjectStageResult>;
}

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
