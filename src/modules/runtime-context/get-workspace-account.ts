import type { RuntimeContext } from "./contracts";
import type { WorkspaceAccountRepositoryPort } from "@/repositories/ports/workspace-account-repository";
export type WorkspaceAccount = Readonly<{ person: string; organization: string }>;
export class GetWorkspaceAccount {
  constructor(private readonly repository: WorkspaceAccountRepositoryPort) {}
  async execute(context: RuntimeContext): Promise<WorkspaceAccount | null> {
    try {
      const account = await this.repository.getOwnAccount(context);
      if (
        !account ||
        account.organizationId !== context.organizationId ||
        account.membershipId !== context.membershipId ||
        account.personId !== context.userId
      )
        return null;
      const field = context.locale === "zh-TW" ? "nameZhTw" : "nameEn";
      return { person: account.person[field], organization: account.organization[field] };
    } catch {
      return null;
    }
  }
}
