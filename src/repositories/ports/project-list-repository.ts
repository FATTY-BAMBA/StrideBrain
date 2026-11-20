import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectStage } from "@/modules/projects/domain/job-input";

export type ProjectListRecord = Readonly<{
  id: string;
  organizationId: string;
  businessKey: string;
  nameEn: string;
  nameZhTw: string;
  status: string;
  stage: ProjectStage;
}>;

/** Minimal navigation read; never loads commercial or evidence relations. */
export interface ProjectListRepositoryPort {
  listReadableProjects(context: RuntimeContext): Promise<readonly ProjectListRecord[]>;
}
