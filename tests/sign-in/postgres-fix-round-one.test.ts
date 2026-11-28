import { randomUUID, createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaPeople } from "@/repositories/prisma/prisma-people";
import { ChangePeople } from "@/modules/people/application/change-people";
import { ManagePeople } from "@/modules/people/application/manage-people";
import { PrismaSignInCounter } from "@/repositories/prisma/prisma-sign-in-counter";
import { signInCounterKey } from "@/modules/sign-in/application/email-guard";
import { EMAIL_LIMITS } from "@/modules/sign-in/domain/policy";
import { createRealAuth } from "@/lib/server/better-auth";
import { guardedAuthHandler } from "@/modules/sign-in/application/auth-handler";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
const owner: RuntimeContext = {
  requestId: "round-one",
  organizationId: "org_horizon",
  membershipId: "membership_horizon_admin",
  userId: "person_horizon_admin",
  role: "ORGANIZATION_ADMIN",
  capabilities: roleBundle("ORGANIZATION_ADMIN"),
  locale: "en",
  dataMode: "DEMO_SYNTHETIC",
};
const env = {
  STRIDEBRAIN_SIGN_IN_MODE: "both",
  STRIDEBRAIN_AUTH_SECRET: "synthetic-round-one-local-secret-only-84",
  STRIDEBRAIN_APP_ORIGIN: "https://signin.example.invalid",
  STRIDEBRAIN_GOOGLE_CLIENT_ID: "synthetic-google",
  STRIDEBRAIN_GOOGLE_CLIENT_SECRET: "synthetic-google-secret",
  STRIDEBRAIN_RESEND_API_KEY: "synthetic-not-a-key",
  STRIDEBRAIN_MAIL_FROM: "sender@example.invalid",
  STRIDEBRAIN_MAIL_REPLY_TO: "reply@example.invalid",
};
const invite = () => ({
  operation: "invite",
  name: "Synthetic Person",
  email: `${randomUUID()}@example.invalid`,
  role: "VIEWER",
  assignments: [],
  idempotencyKey: randomUUID(),
});
suite("round one people mutations", () => {
  it.each(["cancel", "deactivate", "role"])(
    "allows %s of an invited owner with just one joined owner",
    async (operation) => {
      const app = new ChangePeople(new PrismaPeople(getPrismaClient()));
      const result = await app.execute(
        { ...owner, requestId: randomUUID() },
        { ...invite(), role: "ORGANIZATION_ADMIN" },
      );
      if (result.kind !== "SUCCESS") throw new Error("invite");
      expect(
        (
          await app.execute(
            { ...owner, requestId: randomUUID() },
            {
              operation,
              membershipId: result.membershipId,
              role: "VIEWER",
              idempotencyKey: randomUUID(),
            },
          )
        ).kind,
      ).toBe("SUCCESS");
      expect(
        (
          await app.execute(
            { ...owner, requestId: randomUUID() },
            {
              operation: "role",
              membershipId: owner.membershipId,
              role: "VIEWER",
              idempotencyKey: randomUUID(),
            },
          )
        ).kind,
      ).toBe("LAST_OWNER");
    },
  );
  it("reopens only the cancelled person, replaces name/role/jobs, hides cancelled rows and preserves link identity", async () => {
    const db = getPrismaClient(),
      repo = new PrismaPeople(db),
      app = new ChangePeople(repo),
      input = invite();
    const first = await app.execute({ ...owner, requestId: randomUUID() }, input);
    if (first.kind !== "SUCCESS") throw new Error("invite");
    const before = await db.membership.findUniqueOrThrow({ where: { id: first.membershipId } });
    await app.execute(
      { ...owner, requestId: randomUUID() },
      {
        operation: "cancel",
        membershipId: first.membershipId,
        idempotencyKey: randomUUID(),
      },
    );
    expect((await repo.read(owner))!.people.some((p) => p.id === first.membershipId)).toBe(false);
    const job = await db.project.findFirstOrThrow({
      where: { organizationId: owner.organizationId },
    });
    const assignments = [{ projectId: job.id, canReadActuals: true, canCreateAction: false }];
    const again = {
      ...input,
      name: "New synthetic name",
      role: "FINANCIAL_REVIEWER",
      assignments,
      idempotencyKey: randomUUID(),
    };
    expect(await app.execute({ ...owner, requestId: randomUUID() }, again)).toEqual({
      kind: "SUCCESS",
      membershipId: first.membershipId,
      sendInvitation: true,
    });
    const after = await db.membership.findUniqueOrThrow({
      where: { id: first.membershipId },
      include: { person: true, assignments: true },
    });
    expect(after.personId).toBe(before.personId);
    expect(after.person.nameEn).toBe(again.name);
    expect(after.role).toBe(again.role);
    expect(after.invitationStatus).toBe("INVITED");
    expect(after.assignments).toEqual([expect.objectContaining(assignments[0]!)]);
    expect(
      await db.person.count({
        where: { organizationId: owner.organizationId, email: input.email },
      }),
    ).toBe(1);
    expect(await db.identityLink.count({ where: { personId: before.personId } })).toBe(0);
    await app.execute(
      { ...owner, requestId: randomUUID() },
      {
        operation: "deactivate",
        membershipId: first.membershipId,
        idempotencyKey: randomUUID(),
      },
    );
    expect(
      (
        await app.execute(
          { ...owner, requestId: randomUUID() },
          { ...again, idempotencyKey: randomUUID() },
        )
      ).kind,
    ).toBe("DUPLICATE");
    await db.membership.update({
      where: { id: first.membershipId },
      data: { active: true, invitationStatus: "JOINED" },
    });
    expect(
      (
        await app.execute(
          { ...owner, requestId: randomUUID() },
          { ...again, idempotencyKey: randomUUID() },
        )
      ).kind,
    ).toBe("DUPLICATE");
  });
  it("updates role and assignments atomically and idempotently; invalid jobs leave both unchanged", async () => {
    const db = getPrismaClient(),
      app = new ChangePeople(new PrismaPeople(db));
    const first = await app.execute({ ...owner, requestId: randomUUID() }, invite());
    if (first.kind !== "SUCCESS") throw new Error("invite");
    const job = await db.project.findFirstOrThrow({
      where: { organizationId: owner.organizationId },
    });
    const input = {
      operation: "update",
      membershipId: first.membershipId,
      name: "Edited synthetic",
      role: "PROJECT_MANAGER_ESTIMATOR",
      assignments: [{ projectId: job.id, canReadActuals: false, canCreateAction: true }],
      idempotencyKey: randomUUID(),
    };
    expect((await app.execute({ ...owner, requestId: randomUUID() }, input)).kind).toBe("SUCCESS");
    expect((await app.execute({ ...owner, requestId: randomUUID() }, input)).kind).toBe("SUCCESS");
    expect(await db.auditEvent.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(1);
    expect(
      (
        await app.execute(
          { ...owner, requestId: randomUUID() },
          {
            ...input,
            role: "FINANCIAL_REVIEWER",
            assignments: [{ ...input.assignments[0], projectId: "foreign-job" }],
            idempotencyKey: randomUUID(),
          },
        )
      ).kind,
    ).toBe("DENIED");
    const row = await db.membership.findUniqueOrThrow({
      where: { id: first.membershipId },
      include: { assignments: true },
    });
    expect(row.role).toBe(input.role);
    expect(row.assignments).toEqual([expect.objectContaining(input.assignments[0]!)]);
    expect(
      (await app.execute({ ...owner, role: "VIEWER", capabilities: roleBundle("VIEWER") }, input))
        .kind,
    ).toBe("DENIED");
    expect(
      (
        await app.execute(
          { ...owner, requestId: randomUUID() },
          {
            ...input,
            membershipId: "membership_other_admin",
            idempotencyKey: randomUUID(),
          },
        )
      ).kind,
    ).toBe("DENIED");
  });
  it("keeps the other-language name when saving an unchanged name", async () => {
    const db = getPrismaClient(),
      app = new ChangePeople(new PrismaPeople(db));
    const before = await db.membership.findUniqueOrThrow({
      where: { id: "membership_horizon_mei" },
      include: { person: true },
    });
    expect(
      (
        await app.execute(
          { ...owner, requestId: randomUUID() },
          {
            operation: "update",
            membershipId: before.id,
            name: before.person.nameEn,
            role: before.role,
            assignments: [],
            idempotencyKey: randomUUID(),
          },
        )
      ).kind,
    ).toBe("SUCCESS");
    expect(await db.person.findUniqueOrThrow({ where: { id: before.personId } })).toMatchObject({
      nameEn: before.person.nameEn,
      nameZhTw: before.person.nameZhTw,
    });
  });
  it("caps organization invitations at 50 per firm-local day before creating or mailing", async () => {
    const db = getPrismaClient(),
      repo = new PrismaPeople(db),
      counter = new PrismaSignInCounter(db),
      secret = randomUUID();
    const day = await repo.invitationDay(owner);
    const key = signInCounterKey(
      secret,
      "organizationInvitation",
      `${owner.organizationId}:${day}`,
    );
    const results = await Promise.all(
      Array.from({ length: 55 }, () => counter.consume(key, EMAIL_LIMITS.organizationInvitation)),
    );
    expect(results.filter(Boolean)).toHaveLength(50);
    const mail = { send: vi.fn(async () => {}) };
    const input = invite();
    expect(
      await new ManagePeople(repo, counter, mail, {
        secret,
        origin: env.STRIDEBRAIN_APP_ORIGIN,
      }).execute({ ...owner, requestId: randomUUID() }, input),
    ).toBe("ORGANIZATION_LIMITED");
    expect(await db.person.count({ where: { email: input.email } })).toBe(0);
    expect(mail.send).not.toHaveBeenCalled();
    expect(
      await counter.consume(
        signInCounterKey(secret, "organizationInvitation", `${owner.organizationId}:next-day`),
        EMAIL_LIMITS.organizationInvitation,
      ),
    ).toBe(true);
    expect(
      await counter.consume(
        signInCounterKey(secret, "organizationInvitation", `another-firm:${day}`),
        EMAIL_LIMITS.organizationInvitation,
      ),
    ).toBe(true);
  });
});
suite("round one sign-in persistence boundary", () => {
  it("a correct code for an uninvited address creates no user, account or session", async () => {
    const db = getPrismaClient(),
      email = `unknown-${randomUUID()}@example.invalid`,
      otp = "314159";
    const auth = createRealAuth(db, env, {
      schedule: () => {},
      mail: {
        send: async () => {
          throw new Error("Unexpected mail");
        },
      },
    });
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    // Model a correct guess without bypassing the real library verification or creation hooks.
    await db.authVerification.updateMany({
      where: { identifier: `sign-in-otp-${email}` },
      data: { value: `${createHash("sha256").update(otp).digest("base64url")}:0` },
    });
    const before = await Promise.all([
      db.authUser.count(),
      db.authAccount.count(),
      db.authSession.count(),
    ]);
    const response = await auth.api.signInEmailOTP({ body: { email, otp }, asResponse: true });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "NO_FIRM_ACCESS" });
    expect(
      await Promise.all([db.authUser.count(), db.authAccount.count(), db.authSession.count()]),
    ).toEqual(before);
  });
  it.each([
    ["gmail.com", undefined, true, true],
    ["googlemail.com", undefined, true, true],
    ["example.invalid", "example.invalid", true, true],
    ["example.invalid", undefined, true, false],
    ["gmail.com", undefined, false, false],
  ] as const)("Google %s hd=%s invited=%s accepted=%s", async (domain, hd, invited, accepted) => {
    const db = getPrismaClient(),
      email = `synthetic-${randomUUID()}@${domain}`;
    if (invited)
      await new ChangePeople(new PrismaPeople(db)).execute(
        { ...owner, requestId: randomUUID() },
        { ...invite(), email },
      );
    const auth = createRealAuth(db, env, { schedule: () => {}, mail: { send: async () => {} } });
    const token =
      [
        { alg: "RS256", kid: "synthetic" },
        {
          iss: "https://accounts.google.com",
          aud: env.STRIDEBRAIN_GOOGLE_CLIENT_ID,
          sub: randomUUID(),
          email,
          email_verified: true,
          hd,
          name: "Synthetic Google Person",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 600,
        },
      ]
        .map((x) => Buffer.from(JSON.stringify(x)).toString("base64url"))
        .join(".") + ".synthetic";
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "https://oauth2.googleapis.com/token")
        return Response.json({
          access_token: "synthetic",
          token_type: "Bearer",
          expires_in: 600,
          id_token: token,
        });
      throw new Error("Unexpected network");
    });
    try {
      await db.authRateLimit.deleteMany(); // Each callback case starts its own local network window.
      const dependencies = {
        handler: auth.handler,
        counter: { consume: async () => true },
        secret: env.STRIDEBRAIN_AUTH_SECRET,
        origin: env.STRIDEBRAIN_APP_ORIGIN,
        hosted: false,
      };
      const start = await guardedAuthHandler(
        new Request(`${env.STRIDEBRAIN_APP_ORIGIN}/api/auth/sign-in/social`, {
          method: "POST",
          headers: { origin: env.STRIDEBRAIN_APP_ORIGIN, "content-type": "application/json" },
          body: JSON.stringify({ locale: "en" }),
        }),
        dependencies,
      );
      const state = new URL((await start.json()).url).searchParams.get("state")!;
      const cookie = start.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
      const before = await Promise.all([
        db.authUser.count(),
        db.authAccount.count(),
        db.authSession.count(),
      ]);
      const result = await guardedAuthHandler(
        new Request(
          `${env.STRIDEBRAIN_APP_ORIGIN}/api/auth/callback/google?code=synthetic&state=${encodeURIComponent(state)}`,
          { headers: { cookie } },
        ),
        dependencies,
      );
      if (accepted) {
        expect(result.headers.get("location")).toContain("/en/sign-in/complete");
        expect(await db.authUser.count({ where: { email } })).toBe(1);
      } else {
        expect(result.headers.get("location")).toBe(
          invited ? "/en/sign-in?error=google-account" : "/en/no-access",
        );
        expect(
          await Promise.all([db.authUser.count(), db.authAccount.count(), db.authSession.count()]),
        ).toEqual(before);
      }
    } finally {
      fetch.mockRestore();
    }
  });
});
