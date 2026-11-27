import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../../.generated/prisma/client";
import { resolveCapabilities, isCapability } from "@/modules/runtime-context/capabilities";
import type { RuntimeContext, Capability } from "@/modules/runtime-context/contracts";
import { canManagePeople, type PeopleChange } from "@/modules/people/domain/policy";
import type { PeopleOutcome, PeopleRepositoryPort } from "@/repositories/ports/people";
export class PrismaPeople implements PeopleRepositoryPort {
  constructor(private readonly db: PrismaClient) {}
  async read(context: RuntimeContext) {
    if (!canManagePeople(context)) return null;
    const [people, jobs] = await Promise.all([
      this.db.membership.findMany({
        where: { organizationId: context.organizationId },
        include: { person: true, assignments: true },
        orderBy: { createdAt: "asc" },
      }),
      this.db.project.findMany({
        where: { organizationId: context.organizationId },
        select: { id: true, nameEn: true, nameZhTw: true },
        orderBy: { businessKey: "asc" },
      }),
    ]);
    return { people, jobs };
  }
  async invitation(context: RuntimeContext, membershipId: string) {
    if (!canManagePeople(context)) return null;
    const row = await this.db.membership.findFirst({
      where: {
        id: membershipId,
        organizationId: context.organizationId,
        active: true,
        invitationStatus: "INVITED",
      },
      include: { person: true, organization: true },
    });
    if (!row?.person.email) return null;
    const locale: "en" | "zh-TW" = row.organization.primaryLocale === "en" ? "en" : "zh-TW";
    return {
      email: row.person.email,
      locale,
      firm: locale === "en" ? row.organization.nameEn : row.organization.nameZhTw,
    };
  }
  async recordDelivery(
    context: RuntimeContext,
    membershipId: string,
    idempotencyKey: string,
    sent: boolean,
  ) {
    await this.db.$transaction(async (tx) => {
      // Only the server receipt of the authorized invitation operation can record this result.
      const receipt = await tx.auditEvent.findUnique({
        where: {
          organizationId_idempotencyKey: { organizationId: context.organizationId, idempotencyKey },
        },
      });
      if (
        !receipt ||
        receipt.actorMembershipId !== context.membershipId ||
        !["INVITATION_SENT", "INVITATION_RESENT"].includes(receipt.eventType) ||
        (receipt.payload as { membershipId?: string }).membershipId !== membershipId
      )
        throw new Error("Invitation receipt unavailable.");
      const deliveryKey = `invitation-email:${idempotencyKey}`;
      if (
        await tx.auditEvent.findUnique({
          where: {
            organizationId_idempotencyKey: {
              organizationId: context.organizationId,
              idempotencyKey: deliveryKey,
            },
          },
        })
      )
        return;
      const changed = await tx.membership.updateMany({
        where: { id: membershipId, organizationId: context.organizationId },
        data: { invitationEmailStatus: sent ? "SENT" : "FAILED" },
      });
      if (!changed.count) throw new Error("Invitation unavailable.");
      await tx.auditEvent.create({
        data: {
          id: randomUUID(),
          organizationId: context.organizationId,
          actorMembershipId: context.membershipId,
          requestId: randomUUID(),
          eventType: sent ? "INVITATION_EMAIL_SENT" : "INVITATION_EMAIL_FAILED",
          idempotencyKey: deliveryKey,
          payload: { membershipId },
          result: sent ? "SUCCESS" : "FAILED",
        },
      });
    });
  }
  async change(context: RuntimeContext, input: PeopleChange): Promise<PeopleOutcome> {
    if (!canManagePeople(context)) return { kind: "DENIED" };
    return this.db.$transaction(async (tx) => {
      // Serialize owner changes, including the last-owner decision and duplicate invitations.
      await tx.$queryRaw`SELECT "id" FROM "Organization" WHERE "id" = ${context.organizationId} FOR UPDATE`;
      const actor = await tx.membership.findFirst({
        where: {
          id: context.membershipId,
          organizationId: context.organizationId,
          active: true,
          person: { active: true },
        },
        include: { capabilityGrants: true },
      });
      if (
        !actor ||
        actor.role !== "ORGANIZATION_ADMIN" ||
        !resolveCapabilities(
          actor.role,
          actor.capabilityGrants
            .filter((g) => isCapability(g.capability))
            .map((g) => ({ capability: g.capability as Capability, effect: g.effect })),
        ).has("settings:manage")
      )
        return { kind: "DENIED" };
      const prior = await tx.auditEvent.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: context.organizationId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (prior) {
        const payload = prior.payload as { membershipId?: string };
        return prior.actorMembershipId === context.membershipId && payload.membershipId
          ? { kind: "SUCCESS", membershipId: payload.membershipId, sendInvitation: false }
          : { kind: "DENIED" };
      }
      const ids = [...new Set(input.assignments?.map((a) => a.projectId) ?? [])];
      if (
        ids.length !== (input.assignments?.length ?? 0) ||
        (await tx.project.count({
          where: { id: { in: ids }, organizationId: context.organizationId },
        })) !== ids.length
      )
        return { kind: "DENIED" };
      let target = input.membershipId
        ? await tx.membership.findFirst({
            where: { id: input.membershipId, organizationId: context.organizationId },
          })
        : null;
      if (input.operation === "invite") {
        if (
          await tx.person.findFirst({
            where: {
              organizationId: context.organizationId,
              email: { equals: input.email!, mode: "insensitive" },
            },
          })
        )
          return { kind: "DUPLICATE" };
        const personId = randomUUID();
        await tx.person.create({
          data: {
            id: personId,
            businessKey: `person-${personId}`,
            organizationId: context.organizationId,
            nameEn: input.name!.trim(),
            nameZhTw: input.name!.trim(),
            email: input.email!,
          },
        });
        target = await tx.membership.create({
          data: {
            id: randomUUID(),
            organizationId: context.organizationId,
            personId,
            role: input.role!,
            active: true,
            invitationStatus: "INVITED",
            invitedAt: new Date(),
          },
        });
      }
      if (!target) return { kind: "DENIED" };
      if (
        (input.operation === "deactivate" || input.operation === "cancel") &&
        target.id === actor.id
      )
        return { kind: "SELF_DEACTIVATION" };
      if (
        target.active &&
        target.role === "ORGANIZATION_ADMIN" &&
        (input.operation === "deactivate" ||
          input.operation === "cancel" ||
          (input.operation === "role" && input.role !== "ORGANIZATION_ADMIN"))
      ) {
        if (
          (await tx.membership.count({
            where: {
              organizationId: context.organizationId,
              role: "ORGANIZATION_ADMIN",
              active: true,
              invitationStatus: "JOINED",
              person: { active: true },
            },
          })) <= 1
        )
          return { kind: "LAST_OWNER" };
      }
      if (["resend", "cancel"].includes(input.operation) && target.invitationStatus !== "INVITED")
        return { kind: "INVALID" };
      if (input.operation === "reactivate" && target.invitationStatus === "CANCELLED")
        return { kind: "INVALID" };
      if (input.operation === "role")
        await tx.membership.update({ where: { id: target.id }, data: { role: input.role! } });
      if (input.operation === "deactivate" || input.operation === "reactivate")
        await tx.membership.update({
          where: { id: target.id },
          data: { active: input.operation === "reactivate" },
        });
      if (input.operation === "cancel")
        await tx.membership.update({
          where: { id: target.id },
          data: { invitationStatus: "CANCELLED", active: false },
        });
      if (input.operation === "invite" || input.operation === "access") {
        await tx.projectAssignment.deleteMany({
          where: { organizationId: context.organizationId, membershipId: target.id },
        });
        if (input.assignments?.length)
          await tx.projectAssignment.createMany({
            data: input.assignments.map((a) => ({
              id: randomUUID(),
              organizationId: context.organizationId,
              membershipId: target!.id,
              ...a,
            })),
          });
      }
      const events = {
        invite: "INVITATION_SENT",
        resend: "INVITATION_RESENT",
        cancel: "INVITATION_CANCELLED",
        role: "MEMBERSHIP_ROLE_CHANGED",
        deactivate: "MEMBERSHIP_DEACTIVATED",
        reactivate: "MEMBERSHIP_REACTIVATED",
        access: "JOB_ACCESS_CHANGED",
      };
      await tx.auditEvent.create({
        data: {
          id: randomUUID(),
          organizationId: context.organizationId,
          actorMembershipId: actor.id,
          eventType: events[input.operation],
          requestId: context.requestId,
          idempotencyKey: input.idempotencyKey,
          payload: { membershipId: target.id },
          result: "SUCCESS",
        },
      });
      return {
        kind: "SUCCESS",
        membershipId: target.id,
        sendInvitation: input.operation === "invite" || input.operation === "resend",
      };
    });
  }
}
