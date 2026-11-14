export const DEMO_SESSION_COOKIE_NAME = "__Host-stridebrain_demo_session";

const MAX_COOKIE_TOKEN_LENGTH = 220;

export function readCookieValue(
  request: Request,
  name = DEMO_SESSION_COOKIE_NAME,
): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const raw = part.slice(separator + 1).trim();
    if (!raw || raw.length > MAX_COOKIE_TOKEN_LENGTH) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export function serializeDemoSessionCookie(
  token: string,
  expiresAt: Date,
  issuedAt: Date = new Date(),
): string {
  return [
    `${DEMO_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - issuedAt.getTime()) / 1000))}`,
  ].join("; ");
}

export function serializeClearedDemoSessionCookie(): string {
  return [
    `${DEMO_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
  ].join("; ");
}
