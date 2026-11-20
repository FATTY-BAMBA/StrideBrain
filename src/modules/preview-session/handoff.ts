import { createHash, timingSafeEqual } from "node:crypto";
import { isSupportedLocale, type Locale } from "@/modules/localization/config";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { serializeClearedDemoSessionCookie } from "@/modules/runtime-context/session-cookie";
import type { DemoSessionRepositoryPort } from "@/modules/runtime-context/session-repository";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import { previewInvitation, previewSessionOrigin } from "./config";

const PILOT_INVITATION_CODE = /^STRIDEBRAIN2026-\d{2}-[A-Z0-9]{4}$/;

/** Constant-space, per-instance backstop. Hosted edge limiting is also required. */
export function createAttemptBudget(limit = 20, windowMs = 60_000) {
  let started = 0;
  let attempts = 0;
  return (now: number) => {
    if (now - started >= windowMs || now < started) {
      started = now;
      attempts = 0;
    }
    attempts += 1;
    return attempts <= limit;
  };
}

type Dependencies = {
  env: Readonly<Record<string, string | undefined>>;
  repository: () => DemoSessionRepositoryPort;
  signingSecret: () => string;
  allowAttempt: (now: number) => boolean;
  now?: () => Date;
};

async function boundedForm(request: Request): Promise<URLSearchParams | null> {
  if (
    !/^application\/x-www-form-urlencoded(?:;\s*charset=utf-8)?$/i.test(
      request.headers.get("content-type") ?? "",
    )
  )
    return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  } finally {
    reader.releaseLock();
  }
}

function response(locale: Locale, destination: "home" | "entry" | "failure", cookie?: string) {
  const headers = new Headers({
    Location:
      destination === "home"
        ? `/${locale}`
        : `/${locale}/preview${destination === "failure" ? "?unavailable=1" : ""}`,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

/** Browser data never selects membership, tenant, role, TTL, or a return destination. */
export async function handlePreviewSession(
  request: Request,
  operation: "enter" | "leave",
  dependencies: Dependencies,
): Promise<Response> {
  let locale: Locale = "en";
  try {
    const origin = previewSessionOrigin(dependencies.env);
    const url = new URL(request.url);
    const site = request.headers.get("sec-fetch-site");
    if (
      request.method !== "POST" ||
      !origin ||
      url.origin !== origin ||
      url.search ||
      url.hash ||
      request.headers.get("origin") !== origin ||
      (site !== null && site !== "same-origin")
    )
      return response(locale, "failure");
    const form = await boundedForm(request);
    if (!form) return response(locale, "failure");
    const requestedLocale = form.get("locale");
    if (!requestedLocale || !isSupportedLocale(requestedLocale)) return response(locale, "failure");
    locale = requestedLocale;
    const now = dependencies.now?.() ?? new Date();
    // Logout is not blocked by an exhausted login budget or an expired/disabled invitation.
    if (operation === "enter" && !dependencies.allowAttempt(now.getTime()))
      return response(locale, "failure");
    const keys = operation === "enter" ? ["locale", "invitation"] : ["locale"];
    if (
      [...form.keys()].some((key) => !keys.includes(key)) ||
      keys.some((key) => form.getAll(key).length !== 1)
    )
      return response(locale, "failure");

    if (operation === "leave") {
      const repository = dependencies.repository();
      const secret = dependencies.signingSecret();
      const context = await new SignedDemoIdentityContext(repository, secret, () => now).resolve(
        request,
      );
      if (context && !context.sessionId) return response(locale, "failure");
      if (
        context &&
        !(await new DemoSessionService(repository, secret, () => now).revoke(context.sessionId!))
      )
        return response(locale, "failure");
      return response(locale, "entry", serializeClearedDemoSessionCookie());
    }

    const invitation = previewInvitation(dependencies.env, now);
    if (!invitation) return response(locale, "failure");
    const supplied = form.get("invitation") ?? "";
    const digest = createHash("sha256").update(supplied).digest();
    if (
      !timingSafeEqual(digest, Buffer.from(invitation.digest, "hex")) ||
      !PILOT_INVITATION_CODE.test(supplied)
    )
      return response(locale, "failure");
    const repository = dependencies.repository();
    // Validate the exact synthetic persona at the issuer's own membership lookup.
    const allowlisted: DemoSessionRepositoryPort = {
      findByTokenHash: (hash) => repository.findByTokenHash(hash),
      createSession: (record) => repository.createSession(record),
      revokeSession: (id, at) => repository.revokeSession(id, at),
      async getIssuableMembership(id) {
        const membership = await repository.getIssuableMembership(id);
        return membership?.membershipId === "membership_horizon_mei" &&
          membership.organizationId === "org_horizon" &&
          membership.personId === "person_horizon_mei"
          ? membership
          : null;
      },
    };
    // One clock ensures the issuer's minimum TTL cannot overrun invitation expiry.
    const issued = await new DemoSessionService(
      allowlisted,
      dependencies.signingSecret(),
      () => now,
    ).issueForMembership("membership_horizon_mei", { locale, ttlSeconds: invitation.ttlSeconds });
    return issued ? response(locale, "home", issued.setCookie) : response(locale, "failure");
  } catch {
    // Never log a credential, request body, database error, or identity detail.
    return response(locale, "failure");
  }
}
