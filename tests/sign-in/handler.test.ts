import { describe, expect, it, vi } from "vitest";
import { guardedAuthHandler } from "@/modules/sign-in/application/auth-handler";
const origin = "https://signin.example.invalid";
function request(path: string, data: unknown, extra: Record<string, string> = {}) {
  return new Request(`${origin}/api/auth${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...extra },
    body: JSON.stringify(data),
  });
}
function setup(allowed = true) {
  return {
    origin,
    hosted: false,
    secret: "synthetic-test-secret",
    counter: { consume: vi.fn(async () => allowed) },
    handler: vi.fn(async (request: Request) => {
      void request;
      return Response.json({ success: true });
    }),
  };
}
describe("all auth entry points", () => {
  it.each([
    "/email-otp/check-verification-otp",
    "/email-otp/get-verification-otp",
    "/email-otp/verify-email",
    "/sign-up/email",
    "/change-email",
    "/forget-password",
  ])("closes unused route %s", async (path) => {
    const d = setup();
    expect((await guardedAuthHandler(request(path, {}), d)).status).toBe(404);
    expect(d.handler).not.toHaveBeenCalled();
  });
  it.each(["/email-otp/send-verification-otp", "/sign-in/email-otp"])(
    "cannot bypass the guard through %s",
    async (path) => {
      const d = setup(false);
      expect(
        (
          await guardedAuthHandler(
            request(path, { email: "sample@example.invalid", otp: "123456" }),
            d,
          )
        ).status,
      ).toBe(429);
      expect(d.handler).not.toHaveBeenCalled();
    },
  );
  it("returns the same refusal for known and unknown addresses", async () => {
    const d = setup(false);
    const a = await guardedAuthHandler(
      request("/sign-in/email-otp", { email: "known@example.invalid" }),
      d,
    );
    const b = await guardedAuthHandler(
      request("/sign-in/email-otp", { email: "unknown@example.invalid" }),
      d,
    );
    expect(a.status).toBe(b.status);
    expect(await a.text()).toBe(await b.text());
  });
  it("does not call auth or mail if counters fail", async () => {
    const d = setup();
    d.counter.consume.mockRejectedValueOnce(new Error("db"));
    expect(
      (
        await guardedAuthHandler(
          request("/email-otp/send-verification-otp", { email: "sample@example.invalid" }),
          d,
        )
      ).status,
    ).toBe(503);
    expect(d.handler).not.toHaveBeenCalled();
  });
  it("ignores spoofed local IP headers and non-sign-in OTP types", async () => {
    const d = setup();
    await guardedAuthHandler(
      request(
        "/email-otp/send-verification-otp",
        { email: "sample@example.invalid", type: "forget-password" },
        { "x-vercel-forwarded-for": "203.0.113.10", "x-forwarded-for": "203.0.113.11" },
      ),
      d,
    );
    const forwarded = d.handler.mock.calls[0]![0] as Request;
    expect(forwarded.headers.get("x-vercel-forwarded-for")).toBe("127.0.0.1");
    expect(forwarded.headers.has("x-forwarded-for")).toBe(false);
    expect(await forwarded.json()).toEqual({ email: "sample@example.invalid", type: "sign-in" });
  });
});

it("chooses localized, same-site Google success and error returns on the server", async () => {
  const d = setup();
  await guardedAuthHandler(
    request("/sign-in/social", {
      locale: "en",
      returnTo: "/en/projects/PRJ-XINYI-026",
      provider: "unknown",
      errorCallbackURL: "https://evil.invalid",
    }),
    d,
  );
  const sent = await d.handler.mock.calls[0]![0].json();
  expect(sent.provider).toBe("google");
  const error = new URL(sent.errorCallbackURL);
  expect(error.origin).toBe(origin);
  expect(error.pathname).toBe("/en/sign-in");
  expect(error.searchParams.get("returnTo")).toBe("/en/projects/PRJ-XINYI-026");
});
