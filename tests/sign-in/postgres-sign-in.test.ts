import { createSign, generateKeyPairSync, randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
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

suite("invitation delivery is a separate whole step", () => {
  it("keeps a failed invitation and jobs, persists failure after reload, then clears it on successful resend", async () => {
    const { ManagePeople } = await import("@/modules/people/application/manage-people");
    const db = getPrismaClient();
    const repository = new PrismaPeople(db);
    const input = change();
    const jobs = await db.project.findMany({
      where: { organizationId: owner.organizationId },
      take: 1,
    });
    const invite = {
      ...input,
      assignments: [{ projectId: jobs[0]!.id, canReadActuals: false, canCreateAction: true }],
    };
    const counter = new PrismaSignInCounter(db);
    const failedMail = {
      send: async () => {
        throw new Error("Synthetic timeout");
      },
    };
    expect(
      await new ManagePeople(repository, counter, failedMail, {
        secret: env.STRIDEBRAIN_AUTH_SECRET,
        origin: env.STRIDEBRAIN_APP_ORIGIN,
      }).execute({ ...owner, requestId: randomUUID() }, invite),
    ).toBe("MAIL_FAILED");
    const row = await db.membership.findFirstOrThrow({
      where: { person: { email: input.email } },
      include: { assignments: true },
    });
    expect(row.active).toBe(true);
    expect(row.invitationStatus).toBe("INVITED");
    expect(row.invitationEmailStatus).toBe("FAILED");
    expect(row.assignments).toHaveLength(1);
    expect(
      (await repository.read(owner))?.people.find((p) => p.id === row.id)?.invitationEmailStatus,
    ).toBe("FAILED");
    const resend = { operation: "resend", membershipId: row.id, idempotencyKey: randomUUID() };
    const successfulMail = { send: async () => {} };
    const service = new ManagePeople(repository, counter, successfulMail, {
      secret: env.STRIDEBRAIN_AUTH_SECRET,
      origin: env.STRIDEBRAIN_APP_ORIGIN,
    });
    expect(await service.execute(owner, resend)).toBe("LIMITED");
    await db.signInCounter.updateMany({ data: { shortStartedAt: new Date(0) } });
    expect(await service.execute({ ...owner, requestId: randomUUID() }, resend)).toBe("SUCCESS");
    expect(
      (await db.membership.findUniqueOrThrow({ where: { id: row.id } })).invitationEmailStatus,
    ).toBe("SENT");
    const events = await db.auditEvent.findMany({
      where: {
        organizationId: owner.organizationId,
        eventType: { in: ["INVITATION_EMAIL_SENT", "INVITATION_EMAIL_FAILED"] },
      },
    });
    expect(events.map((e) => e.eventType)).toContain("INVITATION_EMAIL_FAILED");
    expect(events.map((e) => e.eventType)).toContain("INVITATION_EMAIL_SENT");
    for (const event of events) {
      expect(Object.keys(event.payload as object)).toEqual(["membershipId"]);
      expect(JSON.stringify(event)).not.toContain(input.email);
    }
  });
});

suite("OTP expiry, attempts and fake Google callback", () => {
  it("refuses an expired code and a correct code after five wrong entries", async () => {
    const db = getPrismaClient();
    const app = new ChangePeople(new PrismaPeople(db));
    const input = change();
    await app.execute({ ...owner, requestId: randomUUID() }, input);
    const scheduled: (() => Promise<void>)[] = [];
    let code = "";
    const auth = createRealAuth(db, env, {
      schedule: (task) => {
        scheduled.push(task);
      },
      mail: {
        send: async (m) => {
          code = m.text.slice(0, 6);
        },
      },
    });
    const headers = new Headers({ origin: env.STRIDEBRAIN_APP_ORIGIN });
    await auth.api.sendVerificationOTP({ headers, body: { email: input.email, type: "sign-in" } });
    for (const task of scheduled.splice(0)) await task();
    const wrong = code === "000000" ? "999999" : "000000";
    for (let i = 0; i < 5; i++)
      await expect(
        auth.api.signInEmailOTP({ headers, body: { email: input.email, otp: wrong } }),
      ).rejects.toBeDefined();
    await expect(
      auth.api.signInEmailOTP({ headers, body: { email: input.email, otp: code } }),
    ).rejects.toBeDefined();
    expect(await db.authSession.count()).toBe(0);
    await auth.api.sendVerificationOTP({ headers, body: { email: input.email, type: "sign-in" } });
    for (const task of scheduled.splice(0)) await task();
    await db.authVerification.updateMany({ data: { expiresAt: new Date(0) } });
    await expect(
      auth.api.signInEmailOTP({ headers, body: { email: input.email, otp: code } }),
    ).rejects.toBeDefined();
  });
  it("verifies Google locally, links OTP to the same person, and stores no provider tokens", async () => {
    const db = getPrismaClient();
    const input = change();
    const app = new ChangePeople(new PrismaPeople(db));
    const invitation = await app.execute({ ...owner, requestId: randomUUID() }, input);
    if (invitation.kind !== "SUCCESS") throw new Error("invite");
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const kid = randomUUID();
    const jwk = { ...publicKey.export({ format: "jwk" }), kid, use: "sig", alg: "RS256" };
    let verified = true;
    const scheduled: (() => Promise<void>)[] = [];
    let otp = "";
    const auth = createRealAuth(db, env, {
      schedule: (task) => {
        scheduled.push(task);
      },
      mail: {
        send: async (m) => {
          otp = m.text.slice(0, 6);
        },
      },
    });
    const fakeFetch = vi.spyOn(globalThis, "fetch").mockImplementation(async (value) => {
      const url = String(value instanceof Request ? value.url : value);
      if (url === "https://www.googleapis.com/oauth2/v3/certs")
        return Response.json({ keys: [jwk] });
      if (url === "https://oauth2.googleapis.com/token") {
        const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
        const data = `${encode({ alg: "RS256", kid })}.${encode({ iss: "https://accounts.google.com", aud: env.STRIDEBRAIN_GOOGLE_CLIENT_ID, sub: "synthetic-google-subject", email: input.email, email_verified: verified, name: "Synthetic Google Person", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 600 })}`;
        const signature = createSign("RSA-SHA256")
          .update(data)
          .sign(privateKey)
          .toString("base64url");
        return Response.json({
          access_token: "synthetic-access-token",
          refresh_token: "synthetic-refresh-token",
          token_type: "Bearer",
          expires_in: 600,
          id_token: `${data}.${signature}`,
        });
      }
      throw new Error("Unexpected network request in fake-provider test");
    });
    try {
      async function google() {
        const start = await auth.handler(
          new Request(`${env.STRIDEBRAIN_APP_ORIGIN}/api/auth/sign-in/social`, {
            method: "POST",
            headers: { origin: env.STRIDEBRAIN_APP_ORIGIN, "content-type": "application/json" },
            body: JSON.stringify({
              provider: "google",
              callbackURL: `${env.STRIDEBRAIN_APP_ORIGIN}/en/sign-in/complete`,
            }),
          }),
        );
        const authorization = new URL((await start.json()).url);
        expect(authorization.searchParams.get("scope")?.split(" ").sort()).toEqual([
          "email",
          "openid",
        ]);
        expect(authorization.searchParams.get("access_type")).toBe("online");
        const state = authorization.searchParams.get("state")!;
        const cookie = start.headers
          .getSetCookie()
          .map((c) => c.split(";")[0])
          .join("; ");
        return auth.handler(
          new Request(
            `${env.STRIDEBRAIN_APP_ORIGIN}/api/auth/callback/google?code=synthetic-code&state=${encodeURIComponent(state)}`,
            { headers: { cookie } },
          ),
        );
      }
      const response = await google();
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toContain("/en/sign-in/complete");
      const account = await db.authAccount.findFirstOrThrow({ where: { providerId: "google" } });
      expect(account.accessToken).toBeNull();
      expect(account.refreshToken).toBeNull();
      expect(account.idToken).toBeNull();
      expect(await db.identityLink.count({ where: { authUserId: account.userId } })).toBe(1);
      await auth.api.sendVerificationOTP({ body: { email: input.email, type: "sign-in" } });
      for (const task of scheduled.splice(0)) await task();
      const emailSignIn = await auth.api.signInEmailOTP({ body: { email: input.email, otp } });
      expect(emailSignIn.user.id).toBe(account.userId);
      verified = false;
      const before = await db.authSession.count();
      const refused = await google();
      expect(refused.headers.get("location") ?? "").not.toContain("/en/sign-in/complete");
      expect(await db.authSession.count()).toBe(before);
    } finally {
      fakeFetch.mockRestore();
    }
  });
});
