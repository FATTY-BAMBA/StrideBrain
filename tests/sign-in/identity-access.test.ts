import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaPeople } from "@/repositories/prisma/prisma-people";
import { PrismaRealIdentity } from "@/repositories/prisma/prisma-real-identity";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import { BetterAuthIdentityContext } from "@/modules/runtime-context/better-auth-identity-context";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
const owner: RuntimeContext = {
  requestId: "identity-access",
  organizationId: "org_horizon",
  membershipId: "membership_horizon_admin",
  userId: "person_horizon_admin",
  role: "ORGANIZATION_ADMIN",
  capabilities: roleBundle("ORGANIZATION_ADMIN"),
  locale: "en",
  dataMode: "DEMO_SYNTHETIC",
};
suite("fresh identity, firm and job authority", () => {
  it("switches only linked firms, refreshes roles/jobs, and denies actual foreign records", async () => {
    const db = getPrismaClient();
    const people = new PrismaPeople(db);
    const identity = new PrismaRealIdentity(db);
    const email = `identity-${randomUUID()}@example.invalid`;
    const job = await db.project.findFirstOrThrow({
      where: { organizationId: owner.organizationId },
    });
    const invitation = await people.change(owner, {
      operation: "invite",
      name: "Synthetic access",
      email,
      role: "VIEWER",
      assignments: [{ projectId: job.id, canReadActuals: false, canCreateAction: false }],
      idempotencyKey: randomUUID(),
    });
    if (invitation.kind !== "SUCCESS") throw new Error("invitation");
    const user = await db.authUser.create({
      data: { id: randomUUID(), name: "Synthetic access", email, emailVerified: true },
    });
    await identity.acceptInvitations(user.id);
    const session = {
      ...(await db.authSession.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          token: randomUUID(),
          expiresAt: new Date(Date.now() + 30 * 86400_000),
        },
      })),
      emailVerified: true,
    };
    expect((await identity.resolve(session))?.assignedProjectIds?.has(job.id)).toBe(true);
    await people.change(owner, {
      operation: "access",
      membershipId: invitation.membershipId,
      assignments: [],
      idempotencyKey: randomUUID(),
    });
    expect((await identity.resolve(session))?.assignedProjectIds?.has(job.id)).toBe(false);
    await people.change(owner, {
      operation: "role",
      membershipId: invitation.membershipId,
      role: "PROJECT_MANAGER_ESTIMATOR",
      idempotencyKey: randomUUID(),
    });
    expect((await identity.resolve(session))?.role).toBe("PROJECT_MANAGER_ESTIMATOR");
    // Real foreign rows, not merely unknown ids.
    const firm = await db.organization.create({
      data: {
        id: randomUUID(),
        businessKey: randomUUID(),
        nameEn: "Synthetic second firm",
        nameZhTw: "範例第二公司",
        primaryLocale: "en",
        dataClassification: "DEMO_SYNTHETIC",
      },
    });
    const person = await db.person.create({
      data: {
        id: randomUUID(),
        organizationId: firm.id,
        businessKey: randomUUID(),
        nameEn: "Synthetic second",
        nameZhTw: "範例第二人",
        email,
      },
    });
    const member = await db.membership.create({
      data: {
        id: randomUUID(),
        organizationId: firm.id,
        personId: person.id,
        role: "VIEWER",
        invitationStatus: "INVITED",
      },
    });
    expect(await identity.selectFirm(session, member.id)).toBe(false);
    expect(
      await people.change(owner, {
        operation: "deactivate",
        membershipId: member.id,
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "DENIED" });
    await identity.acceptInvitations(user.id);
    expect(await identity.resolve(session)).toBeNull();
    expect(await identity.choices(user.id)).toHaveLength(2);
    expect(await identity.selectFirm(session, member.id)).toBe(true);
    expect((await identity.resolve(session))?.organizationId).toBe(firm.id);
    expect((await people.read(owner))?.people.some((p) => p.id === member.id)).toBe(false);
    expect(await identity.selectFirm(session, invitation.membershipId)).toBe(true);
    const audit = await db.auditEvent.findMany({
      where: { organizationId: { in: [firm.id, owner.organizationId] } },
    });
    expect(JSON.stringify(audit)).not.toContain(email);
    await db.authSession.update({ where: { id: session.id }, data: { expiresAt: new Date(0) } });
    expect(await identity.resolve(session)).toBeNull();
    expect(await identity.selectFirm(session, member.id)).toBe(false);
  });
  it("rejects absolute expiry even if a session expiry was extended", async () => {
    const repository = {
      resolve: async () => owner,
      choices: async () => [],
      selectFirm: async () => true,
    };
    const adapter = new BetterAuthIdentityContext(
      {
        read: async () => ({
          id: "synthetic",
          userId: "synthetic",
          emailVerified: true,
          createdAt: new Date(Date.now() - 31 * 86400_000),
          expiresAt: new Date(Date.now() + 86400_000),
        }),
      },
      repository,
    );
    expect(await adapter.resolve(new Request("https://signin.example.invalid"))).toBeNull();
  });
});
