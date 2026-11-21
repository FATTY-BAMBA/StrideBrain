import type { RuntimeContext } from "@/modules/runtime-context/contracts";
export type WorkspaceAccountRecord = Readonly<{
  organizationId: string;
  membershipId: string;
  personId: string;
  person: Readonly<{ nameEn: string; nameZhTw: string }>;
  organization: Readonly<{ nameEn: string; nameZhTw: string }>;
}>;
export interface WorkspaceAccountRepositoryPort {
  getOwnAccount(context: RuntimeContext): Promise<WorkspaceAccountRecord | null>;
}
