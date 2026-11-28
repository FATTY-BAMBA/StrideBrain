import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getGooglePublicKey } from "@better-auth/core/social-providers";
import { createRealAuth } from "@/lib/server/better-auth";
import { getPrismaClient } from "@/lib/server/prisma";
import { guardedAuthHandler } from "@/modules/sign-in/application/auth-handler";
import { signInCopy } from "@/modules/localization/sign-in";

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

it("loads the patched core build through the Google provider's relative import", () => {
  const require = createRequire(import.meta.url);
  const providers = require.resolve("@better-auth/core/social-providers");
  const google = resolve(dirname(providers), "google.mjs");
  expect(readFileSync(google, "utf8")).toContain('from "../oauth2/reject-redirects.mjs"');
  const helper = readFileSync(resolve(dirname(google), "../oauth2/reject-redirects.mjs"), "utf8");
  expect(helper).toContain("timeout: options?.timeout ?? (options?.signal ? undefined : 10_000)");
});

(process.env.DATABASE_URL ? describe : describe.skip)("stalled Google callback", () => {
  it.each([
    ["token", "en"],
    ["certs", "zh-TW"],
    ["token", "zh-TW"],
  ] as const)(
    "bounds %s in %s without writing identity; callback returns to sign-in",
    async (endpoint, locale) => {
      const db = getPrismaClient();
      const email = `timeout-${randomUUID()}@example.invalid`;
      const person = await db.person.create({
        data: {
          id: randomUUID(),
          organizationId: "org_horizon",
          businessKey: randomUUID(),
          nameEn: "Synthetic timeout",
          nameZhTw: "範例逾時",
          email,
        },
      });
      const membership = await db.membership.create({
        data: {
          id: randomUUID(),
          organizationId: "org_horizon",
          personId: person.id,
          role: "VIEWER",
          active: true,
          invitationStatus: "INVITED",
        },
      });
      const auth = createRealAuth(db, env, { schedule: () => {}, mail: { send: async () => {} } });
      const dependencies = {
        handler: (request: Request) => auth.handler(request),
        counter: { consume: async () => true },
        secret: env.STRIDEBRAIN_AUTH_SECRET,
        origin: env.STRIDEBRAIN_APP_ORIGIN,
        hosted: false,
      };
      const start = await guardedAuthHandler(
        new Request(`${dependencies.origin}/api/auth/sign-in/social`, {
          method: "POST",
          headers: { origin: dependencies.origin, "content-type": "application/json" },
          body: JSON.stringify({ locale }),
        }),
        dependencies,
      );
      const authorization = new URL((await start.json()).url);
      const cookie = start.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
      let aborted = false;
      const network = vi.spyOn(globalThis, "fetch").mockImplementation(async (value, options) => {
        const url = String(value instanceof Request ? value.url : value);
        expect(url).toBe(
          endpoint === "token"
            ? "https://oauth2.googleapis.com/token"
            : "https://www.googleapis.com/oauth2/v3/certs",
        );
        return new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => {
              aborted = true;
              reject(new DOMException("Synthetic stalled provider", "AbortError"));
            },
            { once: true },
          );
        });
      });
      try {
        const started = performance.now();
        if (endpoint === "certs") {
          // The authorization-code callback consumes Google's HTTPS token response
          // without fetching JWKs. Exercise the actual separate JWK fetch directly.
          await expect(getGooglePublicKey("synthetic-kid")).rejects.toBeDefined();
        } else {
          const response = await guardedAuthHandler(
            new Request(
              `${dependencies.origin}/api/auth/callback/google?code=synthetic&state=${encodeURIComponent(authorization.searchParams.get("state")!)}`,
              { headers: { cookie } },
            ),
            dependencies,
          );
          const destination = new URL(response.headers.get("location")!, dependencies.origin);
          expect(destination.pathname).toBe(`/${locale}/sign-in`);
          expect(destination.searchParams.get("google")).toBe("1");
          expect(signInCopy(locale).googleUnavailable).toBe(
            locale === "en"
              ? "Google did not respond. Try again, or sign in with an email code."
              : "Google 沒有回應。請再試一次，或改用驗證碼登入。",
          );
        }
        expect(aborted).toBe(true);
        expect(performance.now() - started).toBeLessThan(12_000);
        expect(await db.authUser.count()).toBe(0);
        expect(await db.authSession.count()).toBe(0);
        expect(await db.identityLink.count()).toBe(0);
        expect(
          (await db.membership.findUniqueOrThrow({ where: { id: membership.id } }))
            .invitationStatus,
        ).toBe("INVITED");
      } finally {
        network.mockRestore();
      }
    },
    15_000,
  );
});
