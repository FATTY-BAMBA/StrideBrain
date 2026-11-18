import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export type ProjectListRecord = Readonly<{
  id: string;
  organizationId: string;
  businessKey: string;
  nameEn: string;
  nameZhTw: string;
  status: string;
}>;

/** Minimal navigation read; never loads commercial or evidence relations. */
export interface ProjectListRepositoryPort {
  listReadableProjects(context: RuntimeContext): Promise<readonly ProjectListRecord[]>;
}
