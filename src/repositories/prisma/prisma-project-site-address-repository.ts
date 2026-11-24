import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "../../../.generated/prisma/client";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { SiteAddressInput } from "@/modules/projects/domain/site-address-input";
import { validateSiteAddress } from "@/modules/projects/domain/site-address-input";
import type {
  ProjectSiteAddressRepositoryPort,
  SiteAddressOutcome,
} from "@/repositories/ports/project-site-address-repository";
async function authorized(tx: Prisma.TransactionClient, context: RuntimeContext, key: string) {
  if (!context.capabilities.has("project:read")) return null;
  const organizationId = context.organizationId;
  if (
    !(await tx.membership.findFirst({
      where: { id: context.membershipId, organizationId, active: true },
      select: { id: true },
    }))
  )
    return null;
  return tx.project.findFirst({
    where: {
      organizationId,
      businessKey: key,
      deletedAt: null,
      ...(context.role === "ORGANIZATION_ADMIN"
        ? {}
        : { assignments: { some: { organizationId, membershipId: context.membershipId } } }),
    },
    select: { id: true, businessKey: true, siteAddress: true, updatedAt: true },
  });
}
export class PrismaProjectSiteAddressRepository implements ProjectSiteAddressRepositoryPort {
  constructor(private readonly database: PrismaClient) {}
  async read(context: RuntimeContext, key: string) {
    const row = await authorized(this.database, context, key);
    return row ? { projectKey: row.businessKey, siteAddress: row.siteAddress ?? "" } : null;
  }
  async updateWithAudit(
    context: RuntimeContext,
    input: SiteAddressInput,
  ): Promise<SiteAddressOutcome> {
    if (!context.capabilities.has("project:update")) return { kind: "UNAVAILABLE" };
    if (!validateSiteAddress(input)) return { kind: "INVALID" };
    const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.database.$transaction(
          async (tx) => {
            const row = await authorized(tx, context, input.businessKey);
            if (!row) return { kind: "UNAVAILABLE" } as const;
            const organizationId = context.organizationId;
            const existing = await tx.auditEvent.findUnique({
              where: {
                organizationId_idempotencyKey: {
                  organizationId,
                  idempotencyKey: input.idempotencyKey,
                },
              },
            });
            if (existing)
              return {
                kind:
                  existing.actorMembershipId === context.membershipId &&
                  existing.eventType === "PROJECT_SITE_ADDRESS_UPDATED" &&
                  (existing.payload as { fingerprint?: string }).fingerprint === fingerprint
                    ? "UPDATED"
                    : "CONFLICT",
              } as const;
            if ((row.siteAddress ?? "") !== input.expectedSiteAddress)
              return { kind: "CONFLICT" } as const;
            const changed = await tx.project.updateMany({
              where: { id: row.id, organizationId, updatedAt: row.updatedAt },
              data: { siteAddress: input.siteAddress || null },
            });
            if (changed.count !== 1) return { kind: "CONFLICT" } as const;
            await tx.auditEvent.create({
              data: {
                id: randomUUID(),
                organizationId,
                actorMembershipId: context.membershipId,
                eventType: "PROJECT_SITE_ADDRESS_UPDATED",
                requestId: context.requestId,
                idempotencyKey: input.idempotencyKey,
                result: "UPDATED",
                payload: { projectId: row.id, fingerprint, fields: ["siteAddress"] },
              },
            });
            return { kind: "UPDATED" } as const;
          },
          { isolationLevel: "Serializable", timeout: 15000 },
        );
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error ? String(error.code) : "";
        if (attempt >= 2 || !["P2034", "P2002"].includes(code)) throw error;
      }
    }
  }
}
