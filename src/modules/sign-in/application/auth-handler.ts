import { sameSiteReturn } from "@/modules/sign-in/domain/policy";
import { guardEmail } from "./email-guard";
import type { SignInCounterPort } from "@/repositories/ports/sign-in-counter";

const paths = new Map([
  ["/sign-in/social", "POST"],
  ["/callback/google", "GET"],
  ["/email-otp/send-verification-otp", "POST"],
  ["/sign-in/email-otp", "POST"],
]);
export async function guardedAuthHandler(
  request: Request,
  dependencies: {
    handler: (request: Request) => Promise<Response>;
    counter: SignInCounterPort;
    secret: string;
    origin: string;
    hosted: boolean;
  },
) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/auth/, "");
  if (paths.get(path) !== request.method) return new Response(null, { status: 404 });
  if (request.method === "POST" && request.headers.get("origin") !== dependencies.origin)
    return new Response(null, { status: 403 });
  const headers = new Headers(request.headers);
  headers.delete("x-forwarded-for");
  headers.delete("x-real-ip");
  if (!dependencies.hosted) headers.set("x-vercel-forwarded-for", "127.0.0.1");
  let body: string | undefined;
  let socialLocale: "en" | "zh-TW" | undefined;
  if (request.method === "POST") {
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(part.value);
    }
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    } catch {
      return new Response(null, { status: 400 });
    }
    if (path === "/email-otp/send-verification-otp" || path === "/sign-in/email-otp") {
      const operation = path === "/sign-in/email-otp" ? "entry" : "request";
      try {
        const result = await guardEmail(
          dependencies.counter,
          dependencies.secret,
          operation,
          data.email,
        );
        if (result.kind !== "ALLOWED")
          return Response.json(
            { code: result.kind },
            { status: result.kind === "LIMITED" ? 429 : 400 },
          );
        const locale = data.locale === "en" ? "en" : "zh-TW";
        headers.set("x-stridebrain-sign-in-locale", locale);
        data =
          operation === "request"
            ? { email: result.email, type: "sign-in" }
            : { email: result.email, otp: data.otp };
      } catch {
        return Response.json({ code: "UNAVAILABLE" }, { status: 503 });
      }
    } else if (path === "/sign-in/social") {
      socialLocale = data.locale === "en" ? "en" : "zh-TW";
      // Ignore client-selected provider, scopes and redirect hosts.
      const locale = data.locale === "en" ? "en" : "zh-TW";
      data = {
        provider: "google",
        errorCallbackURL: `${dependencies.origin}/${locale}/sign-in?google=1&returnTo=${encodeURIComponent(sameSiteReturn(data.returnTo, locale))}`,
        callbackURL: `${dependencies.origin}/${locale}/sign-in/complete?returnTo=${encodeURIComponent(sameSiteReturn(data.returnTo, locale))}`,
      };
    } else data = {};
    body = JSON.stringify(data);
    headers.set("content-type", "application/json");
    headers.delete("content-length");
  }
  const result = await dependencies.handler(
    new Request(request.url, {
      method: request.method,
      headers,
      ...(body === undefined ? {} : { body }),
    }),
  );
  if (socialLocale)
    result.headers.append(
      "set-cookie",
      `sb-sign-in-locale=${socialLocale}; Path=/api/auth; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    );
  if (path === "/callback/google") {
    // This cookie selects copy only; it confers no identity, provider or redirect authority.
    const locale = /(?:^|;\s*)sb-sign-in-locale=en(?:;|$)/.test(request.headers.get("cookie") ?? "")
      ? "en"
      : "zh-TW";
    const location = result.headers.get("location");
    const redirect = location ? new URL(location, dependencies.origin) : null;
    let code = redirect?.searchParams.get("error");
    if (result.status >= 400) {
      const error = (await result
        .clone()
        .json()
        .catch(() => null)) as { code?: string } | null;
      code = error?.code ?? code;
    }
    if (code === "NO_FIRM_ACCESS" || code === "GOOGLE_MAILBOX_AUTHORITY" || result.status >= 400) {
      return new Response(null, {
        status: 303,
        headers: {
          Location:
            code === "NO_FIRM_ACCESS"
              ? `/${locale}/no-access`
              : `/${locale}/sign-in?error=${code === "GOOGLE_MAILBOX_AUTHORITY" ? "google-account" : "1"}`,
          "set-cookie":
            "sb-sign-in-locale=; Path=/api/auth; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
        },
      });
    }
  }
  return result;
}
