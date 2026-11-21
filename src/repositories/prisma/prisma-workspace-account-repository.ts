import type { PrismaClient } from "../../../.generated/prisma/client";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { WorkspaceAccountRepositoryPort } from "@/repositories/ports/workspace-account-repository";
export class PrismaWorkspaceAccountRepository implements WorkspaceAccountRepositoryPort {
  constructor(private readonly database: PrismaClient) {}
  async getOwnAccount(context: RuntimeContext) {
    // An authenticated member may read their own account identity, independently
    // of project capabilities. No browser identity selectors enter this query.
    const row = await this.database.membership.findFirst({
      where: {
        id: context.membershipId,
        organizationId: context.organizationId,
        personId: context.userId,
        active: true,
        person: { organizationId: context.organizationId, active: true },
      },
      select: {
        id: true,
        organizationId: true,
        personId: true,
        person: { select: { nameEn: true, nameZhTw: true } },
        organization: { select: { nameEn: true, nameZhTw: true } },
      },
    });
    return row ? { ...row, membershipId: row.id } : null;
  }
}
