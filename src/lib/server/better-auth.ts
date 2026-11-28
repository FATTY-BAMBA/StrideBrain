import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { emailOTP } from "better-auth/plugins/email-otp";
import { after } from "next/server";
import { getPrismaClient } from "./prisma";
import { realSignInSettings } from "@/lib/env/sign-in";
import { PrismaRealIdentity } from "@/repositories/prisma/prisma-real-identity";
import { ResendSignInMail } from "@/modules/sign-in/infrastructure/resend-mail";
import { googleMailboxAuthority } from "@/modules/sign-in/domain/google-mailbox";
import { codeMail } from "@/modules/sign-in/domain/mail";
import type { SignInMailPort } from "@/repositories/ports/sign-in-mail";
import type { PrismaClient } from "../../../.generated/prisma/client";

/** The injected sender/scheduler are for local tests; production always uses Resend and after. */
export function createRealAuth(
  db: PrismaClient,
  env: Record<string, string | undefined>,
  overrides?: { mail?: SignInMailPort; schedule?: (work: () => Promise<void>) => void },
) {
  const settings = realSignInSettings(env);
  const identity = new PrismaRealIdentity(db);
  const mail =
    overrides?.mail ?? new ResendSignInMail(settings.resendKey, settings.sender, settings.replyTo);
  const schedule = overrides?.schedule ?? after;
  async function requireKnownUser(userId: string) {
    const user = await db.authUser.findUnique({
      where: { id: userId },
      include: { identityLinks: { select: { id: true } } },
    });
    // Retain stored identity when the person's email changes; an old unlinked user is not an invitation.
    if (
      !user?.emailVerified ||
      (!user.identityLinks.length && !(await identity.eligible(user.email)))
    )
      throw new APIError("FORBIDDEN", { code: "NO_FIRM_ACCESS", message: "No firm access." });
  }
  return betterAuth({
    baseURL: settings.origin,
    secret: settings.secret,
    database: prismaAdapter(db, { provider: "postgresql" }),
    user: { modelName: "AuthUser", changeEmail: { enabled: false } },
    session: {
      modelName: "AuthSession",
      expiresIn: 30 * 86400,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    account: {
      modelName: "AuthAccount",
      storeAccountCookie: false,
      accountLinking: { enabled: true, trustedProviders: [] },
    },
    verification: { modelName: "AuthVerification" },
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: settings.googleClientId,
        clientSecret: settings.googleClientSecret,
        disableDefaultScope: true,
        scope: ["openid", "email"],
        accessType: "online",
        includeGrantedScopes: false,
        mapProfileToUser: (profile) => {
          if (profile.email_verified !== true)
            throw new APIError("UNAUTHORIZED", {
              code: "VERIFIED_EMAIL_REQUIRED",
              message: "Verified email required.",
            });
          if (!googleMailboxAuthority(profile))
            throw new APIError("UNAUTHORIZED", {
              code: "GOOGLE_MAILBOX_AUTHORITY",
              message: "Use an email code.",
            });
          return { emailVerified: true };
        },
      },
    },
    advanced: {
      useSecureCookies: true,
      defaultCookieAttributes: { httpOnly: true, secure: true, sameSite: "lax" },
      ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for"] },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "AuthRateLimit",
      window: 60,
      max: 60,
      customRules: {
        "/email-otp/send-verification-otp": { window: 60, max: 10 },
        "/sign-in/email-otp": { window: 600, max: 30 },
      },
    },
    logger: { disabled: true },
    onAPIError: { errorURL: `${settings.origin}/zh-TW/sign-in?google=1` },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!(await identity.eligible(user.email)))
              throw new APIError("FORBIDDEN", {
                code: "NO_FIRM_ACCESS",
                message: "No firm access.",
              });
          },
        },
      },
      account: {
        create: {
          before: async (account) => {
            await requireKnownUser(account.userId);
            return {
              data: {
                ...account,
                accessToken: null,
                refreshToken: null,
                idToken: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
                scope: null,
              },
            };
          },
        },
        update: {
          before: async (account) => ({
            data: {
              ...account,
              accessToken: null,
              refreshToken: null,
              idToken: null,
              accessTokenExpiresAt: null,
              refreshTokenExpiresAt: null,
              scope: null,
            },
          }),
        },
      },
      session: {
        create: {
          before: async (session) => {
            await requireKnownUser(session.userId);
          },
          after: async (session) => {
            await identity.acceptInvitations(session.userId);
          },
        },
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        allowedAttempts: 5,
        storeOTP: "hashed",
        resendStrategy: "rotate",
        sendVerificationOTP: async ({ email, otp, type }, context) => {
          if (type !== "sign-in") return;
          const locale =
            context?.headers?.get("x-stridebrain-sign-in-locale") === "en" ? "en" : "zh-TW";
          schedule(async () => {
            try {
              if (await identity.eligible(email))
                await mail.send({ to: email, ...codeMail(locale, otp) });
            } catch {
              /* No address/provider response is logged; the neutral resend flow remains available. */
            }
          });
        },
      }),
    ],
  });
}
let instance: ReturnType<typeof createRealAuth> | undefined;
export function getRealAuth() {
  return (instance ??= createRealAuth(getPrismaClient(), process.env));
}
