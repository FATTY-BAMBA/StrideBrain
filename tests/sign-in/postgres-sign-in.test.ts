import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaSignInCounter } from "@/repositories/prisma/prisma-sign-in-counter";
import { createRealAuth } from "@/lib/server/better-auth";
import { PrismaPeople } from "@/repositories/prisma/prisma-people";
import { ChangePeople } from "@/modules/people/application/change-people";
import { PrismaRealIdentity } from "@/repositories/prisma/prisma-real-identity";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
const owner: RuntimeContext = {
  requestId: "sign-in-test",
  organizationId: "org_horizon",
  membershipId: "membership_horizon_admin",
  userId: "person_horizon_admin",
  role: "ORGANIZATION_ADMIN",
  capabilities: roleBundle("ORGANIZATION_ADMIN"),
  locale: "en",
  dataMode: "DEMO_SYNTHETIC",
};
function change() {
  return {
    operation: "invite",
    name: "Synthetic Person",
    email: `person-${randomUUID()}@example.invalid`,
    role: "VIEWER",
    assignments: [],
    idempotencyKey: randomUUID(),
  };
}
const env = {
  STRIDEBRAIN_SIGN_IN_MODE: "both",
  STRIDEBRAIN_AUTH_SECRET: "synthetic-auth-secret-for-local-tests-only-84",
  STRIDEBRAIN_APP_ORIGIN: "https://signin.example.invalid",
  STRIDEBRAIN_GOOGLE_CLIENT_ID: "synthetic-google",
  STRIDEBRAIN_GOOGLE_CLIENT_SECRET: "synthetic-google-secret",
  STRIDEBRAIN_RESEND_API_KEY: "synthetic-not-a-key",
  STRIDEBRAIN_MAIL_FROM: "sender@example.invalid",
  STRIDEBRAIN_MAIL_REPLY_TO: "reply@example.invalid",
};
suite("real sign-in PostgreSQL boundary", () => {
  it("atomically admits only five concurrent decisions and expires old keys", async () => {
    const db = getPrismaClient();
    const guard = new PrismaSignInCounter(db);
    const key = randomUUID();
    const results = await Promise.all(
      Array.from({ length: 30 }, () =>
        guard.consume(key, { shortSeconds: 600, shortMax: 5, dayMax: 20 }),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(5);
    await db.signInCounter.create({
      data: {
        key: `old-${key}`,
        shortStartedAt: new Date(0),
        shortCount: 0,
        dayStartedAt: new Date(0),
        dayCount: 0,
        expiresAt: new Date(0),
      },
    });
    await guard.consume(randomUUID(), { shortSeconds: 60, shortMax: 1, dayMax: 10 });
    expect(await db.signInCounter.findUnique({ where: { key: `old-${key}` } })).toBeNull();
    await db.signInCounter.update({
      where: { key },
      data: { shortStartedAt: new Date(0), dayCount: 20 },
    });
    expect(await guard.consume(key, { shortSeconds: 600, shortMax: 5, dayMax: 20 })).toBe(false);
  });
  it("refuses a Viewer and another firm's membership or job", async () => {
    const db = getPrismaClient();
    const app = new ChangePeople(new PrismaPeople(db));
    expect(
      await app.execute({ ...owner, role: "VIEWER", capabilities: roleBundle("VIEWER") }, change()),
    ).toEqual({ kind: "DENIED" });
    expect(
      await app.execute(owner, {
        operation: "deactivate",
        membershipId: "membership_other_admin",
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "DENIED" });
    expect(
      await app.execute(owner, {
        ...change(),
        assignments: [
          {
            projectId: "other-organization-project",
            canReadActuals: false,
            canCreateAction: false,
          },
        ],
      }),
    ).toEqual({ kind: "DENIED" });
  });
  it("protects the last owner and self-deactivation", async () => {
    const app = new ChangePeople(new PrismaPeople(getPrismaClient()));
    expect(
      await app.execute(owner, {
        operation: "role",
        membershipId: owner.membershipId,
        role: "VIEWER",
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "LAST_OWNER" });
    expect(
      await app.execute(owner, {
        operation: "deactivate",
        membershipId: owner.membershipId,
        idempotencyKey: randomUUID(),
      }),
    ).toEqual({ kind: "SELF_DEACTIVATION" });
  });
  it("sends only invited codes after the response, hashes them, accepts once, and refreshes membership on every request", async () => {
    const db = getPrismaClient();
    const app = new ChangePeople(new PrismaPeople(db));
    const input = change();
    const invite = await app.execute(owner, input);
    expect(invite.kind).toBe("SUCCESS");
    if (invite.kind !== "SUCCESS") throw new Error("invite");
    const scheduled: (() => Promise<void>)[] = [];
    const messages: { to: string; subject: string; text: string; html: string }[] = [];
    const auth = createRealAuth(db, env, {
      schedule: (work) => {
        scheduled.push(work);
      },
      mail: {
        send: async (message) => {
          messages.push(message);
        },
      },
    });
    const headers = new Headers({
      origin: env.STRIDEBRAIN_APP_ORIGIN,
      "x-stridebrain-sign-in-locale": "zh-TW",
    });
    await auth.api.sendVerificationOTP({ headers, body: { email: input.email, type: "sign-in" } });
    await auth.api.sendVerificationOTP({
      headers,
      body: { email: "uninvited@example.invalid", type: "sign-in" },
    });
    expect(messages).toHaveLength(0);
    for (const work of scheduled.splice(0)) await work();
    expect(messages).toHaveLength(1);
    const code = messages[0]!.text.slice(0, 6);
    expect(code).toMatch(/^\d{6}$/);
    expect(messages[0]!.subject).toContain("驗證碼");
    const stored = await db.authVerification.findMany();
    expect(stored.some((v) => v.value.startsWith(code))).toBe(false);
    const result = await auth.api.signInEmailOTP({
      headers,
      body: { email: input.email, otp: code },
      asResponse: true,
    });
    expect(result.status).toBe(200);
    const cookie = result.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    expect(result.headers.get("set-cookie")).toContain("Secure");
    expect(result.headers.get("set-cookie")).toContain("HttpOnly");
    await expect(
      auth.api.signInEmailOTP({ headers, body: { email: input.email, otp: code } }),
    ).rejects.toBeDefined();
    const signedIn = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(signedIn).not.toBeNull();
    const session = { ...signedIn!.session, emailVerified: signedIn!.user.emailVerified };
    const identity = new PrismaRealIdentity(db);
    expect((await identity.resolve(session))?.role).toBe("VIEWER");
    expect(session.expiresAt.getTime() - session.createdAt.getTime()).toBeLessThanOrEqual(
      30 * 86400_000,
    );
    await app.execute(owner, {
      operation: "deactivate",
      membershipId: invite.membershipId,
      idempotencyKey: randomUUID(),
    });
    expect(await identity.resolve(session)).toBeNull();
    await app.execute(owner, {
      operation: "reactivate",
      membershipId: invite.membershipId,
      idempotencyKey: randomUUID(),
    });
    expect((await identity.resolve(session))?.membershipId).toBe(invite.membershipId);
    const audits = await db.auditEvent.findMany({
      where: { idempotencyKey: input.idempotencyKey },
    });
    expect(JSON.stringify(audits)).not.toContain(input.email);
    await auth.api.signOut({ headers: new Headers({ cookie }) });
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
  });
});
