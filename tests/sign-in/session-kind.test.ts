import { afterEach, expect, it, vi } from "vitest";
import { issueSignedSessionToken } from "@/modules/runtime-context/session-token";
import { DEMO_SESSION_COOKIE_NAME } from "@/modules/runtime-context/session-cookie";
const f = vi.hoisted(() => ({
  revoke: vi.fn(async () => ({ count: 1 })),
  signOut: vi.fn(
    async () =>
      new Response(null, {
        headers: {
          "Set-Cookie":
            "__Secure-better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax",
        },
      }),
  ),
}));
vi.mock("@/lib/server/prisma", () => ({
  getPrismaClient: () => ({ demoSession: { updateMany: f.revoke } }),
}));
vi.mock("@/lib/server/better-auth", () => ({
  getRealAuth: () => ({ api: { signOut: f.signOut } }),
}));
import { clearDemoIdentity, clearRealIdentity } from "@/lib/server/switch-sign-in-kind";
afterEach(() => vi.unstubAllEnvs());
it("real entry revokes the signed demo session and expires its cookie", async () => {
  const secret = "synthetic-test-secret-at-least-32-characters";
  vi.stubEnv("STRIDEBRAIN_DEMO_SESSION_SECRET", secret);
  const token = issueSignedSessionToken(secret);
  const response = await clearDemoIdentity(
    new Request("https://signin.example.invalid", {
      headers: { cookie: `${DEMO_SESSION_COOKIE_NAME}=${token.token}` },
    }),
    new Response(),
  );
  expect(f.revoke).toHaveBeenCalledWith({
    where: { id: token.sessionId, tokenHash: token.tokenHash },
    data: { revokedAt: expect.any(Date) },
  });
  expect(response.headers.get("set-cookie")).toContain(`${DEMO_SESSION_COOKIE_NAME}=;`);
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
});
it("demo entry ends real auth through the SDK and forwards its cleared cookies", async () => {
  const request = new Request("https://signin.example.invalid", {
    headers: { cookie: "synthetic-real-cookie" },
  });
  const response = await clearRealIdentity(request, new Response());
  expect(f.signOut).toHaveBeenCalledWith({ headers: request.headers, asResponse: true });
  expect(response.headers.get("set-cookie")).toContain("session_token=; Max-Age=0");
});
it("real-only sign-in can clear an old demo cookie without configuring the demo secret", async () => {
  vi.stubEnv("STRIDEBRAIN_DEMO_SESSION_SECRET", "");
  const response = await clearDemoIdentity(
    new Request("https://signin.example.invalid", {
      headers: { cookie: `${DEMO_SESSION_COOKIE_NAME}=old-token` },
    }),
    new Response(),
  );
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  expect(f.revoke).not.toHaveBeenCalled();
});
