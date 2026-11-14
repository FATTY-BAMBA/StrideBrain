import { describe, expect, it } from "vitest";

import {
  DEMO_SESSION_COOKIE_NAME,
  readCookieValue,
  serializeClearedDemoSessionCookie,
  serializeDemoSessionCookie,
} from "@/modules/runtime-context/session-cookie";

describe("demo session cookie", () => {
  it("serializes an HTTP-only Secure __Host cookie", () => {
    const cookie = serializeDemoSessionCookie(
      "sb1.session.nonce.signature",
      new Date(Date.now() + 3_600_000),
    );
    expect(cookie).toContain(`${DEMO_SESSION_COOKIE_NAME}=`);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toContain("Domain=");
  });

  it("reads only the named bounded cookie value", () => {
    const request = new Request("https://demo.primestrideai.com/", {
      headers: {
        cookie: `other=value; ${DEMO_SESSION_COOKIE_NAME}=sb1.test.token.signature; last=1`,
      },
    });
    expect(readCookieValue(request)).toBe("sb1.test.token.signature");
  });

  it("rejects malformed encoding and oversized values", () => {
    const malformed = new Request("https://demo.primestrideai.com/", {
      headers: { cookie: `${DEMO_SESSION_COOKIE_NAME}=%E0%A4%A` },
    });
    const oversized = new Request("https://demo.primestrideai.com/", {
      headers: { cookie: `${DEMO_SESSION_COOKIE_NAME}=${"a".repeat(221)}` },
    });
    expect(readCookieValue(malformed)).toBeNull();
    expect(readCookieValue(oversized)).toBeNull();
  });

  it("clears using the same secure host cookie contract", () => {
    const cookie = serializeClearedDemoSessionCookie();
    expect(cookie).toContain(`${DEMO_SESSION_COOKIE_NAME}=`);
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("HttpOnly");
  });
});
