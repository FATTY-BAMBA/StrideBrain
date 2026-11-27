import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../../.generated/prisma/client";
import { resolveCapabilities, isCapability } from "@/modules/runtime-context/capabilities";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  RealIdentityRepositoryPort,
  VerifiedSession,
} from "@/repositories/ports/real-identity";

export class PrismaRealIdentity implements RealIdentityRepositoryPort {
  constructor(private readonly db: PrismaClient) {}
  async choices(userId: string) {
    return this.db.membership.findMany({
      where: {
        active: true,
        invitationStatus: "JOINED",
        person: { active: true, identityLinks: { some: { authUserId: userId } } },
      },
      include: { organization: true },
      orderBy: { id: "asc" },
    });
  }
  async resolve(session: VerifiedSession): Promise<RuntimeContext | null> {
    const current = await this.db.authSession.findUnique({ where: { id: session.id } });
    if (!current || current.userId !== session.userId || current.expiresAt <= new Date())
      return null;
    const choices = await this.choices(session.userId);
    const membership =
      choices.find((m) => m.id === current.selectedMembershipId) ??
      (choices.length === 1 ? choices[0] : undefined);
    if (!membership) return null;
    const row = await this.db.membership.findUnique({
      where: { id: membership.id },
      include: {
        person: { include: { identityLinks: true } },
        organization: true,
        assignments: true,
        capabilityGrants: true,
      },
    });
    if (
      !row?.active ||
      !row.person.active ||
      row.invitationStatus !== "JOINED" ||
      !row.person.identityLinks.some(
        (l) => l.authUserId === session.userId && l.organizationId === row.organizationId,
      )
    )
      return null;
    const assignments = new Map(
      row.assignments
        .filter((a) => a.organizationId === row.organizationId)
        .map((a) => [
          a.projectId,
          {
            projectId: a.projectId,
            canReadActuals: a.canReadActuals,
            canCreateAction: a.canCreateAction,
          },
        ]),
    );
    return {
      sessionId: session.id,
      requestId: randomUUID(),
      userId: row.personId,
      membershipId: row.id,
      organizationId: row.organizationId,
      role: row.role,
      capabilities: resolveCapabilities(
        row.role,
        row.capabilityGrants
          .filter((g) => g.organizationId === row.organizationId && isCapability(g.capability))
          .map((g) => ({
            capability: g.capability as import("@/modules/runtime-context/contracts").Capability,
            effect: g.effect,
          })),
      ),
      assignedProjectIds: new Set(assignments.keys()),
      projectAssignments: assignments,
      locale: row.organization.primaryLocale === "en" ? "en" : "zh-TW",
      dataMode: row.organization.dataClassification as RuntimeContext["dataMode"],
    };
  }
  async acceptInvitations(userId: string) {
    await this.db.$transaction(async (tx) => {
      const user = await tx.authUser.findUnique({ where: { id: userId } });
      if (!user?.emailVerified) return;
      const people = await tx.person.findMany({
        where: {
          email: { equals: user.email, mode: "insensitive" },
          active: true,
          memberships: { some: { active: true, invitationStatus: "INVITED" } },
        },
        include: { memberships: true },
      });
      for (const person of people) {
        for (const membership of person.memberships.filter(
          (m) => m.active && m.invitationStatus === "INVITED",
        )) {
          await tx.identityLink.upsert({
            where: {
              organizationId_personId: {
                organizationId: person.organizationId,
                personId: person.id,
              },
            },
            update: {},
            create: {
              id: randomUUID(),
              organizationId: person.organizationId,
              personId: person.id,
              authUserId: user.id,
            },
          });
          const linked = await tx.identityLink.findUnique({
            where: {
              organizationId_personId: {
                organizationId: person.organizationId,
                personId: person.id,
              },
            },
          });
          if (linked?.authUserId !== user.id) throw new Error("Identity link unavailable.");
          const changed = await tx.membership.updateMany({
            where: {
              id: membership.id,
              organizationId: person.organizationId,
              invitationStatus: "INVITED",
            },
            data: { invitationStatus: "JOINED", joinedAt: new Date() },
          });
          if (changed.count)
            await tx.auditEvent.create({
              data: {
                id: randomUUID(),
                organizationId: person.organizationId,
                actorMembershipId: membership.id,
                eventType: "INVITATION_ACCEPTED",
                requestId: randomUUID(),
                idempotencyKey: `invitation-accepted:${membership.id}`,
                payload: { membershipId: membership.id },
                result: "SUCCESS",
              },
            });
        }
      }
    });
  }
  async eligible(email: string) {
    return Boolean(
      await this.db.person.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          memberships: { some: { invitationStatus: { in: ["INVITED", "JOINED"] } } },
        },
        select: { id: true },
      }),
    );
  }
}
