import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createAttemptBudget, handlePreviewSession } from "@/modules/preview-session/handoff";
import { previewInvitation, previewSessionOrigin } from "@/modules/preview-session/config";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import type {
  DemoSessionRepositoryPort,
  ResolvedDemoSessionRecord,
} from "@/modules/runtime-context/session-repository";

const NOW = new Date("2026-11-19T10:00:00Z");
const ORIGIN = "https://sb034-preview.example.test";
// Deliberately public test-only values; never deployed credentials.
const CODE = "STRIDEBRAIN2026-01-K7M4";
const SECRET = "sb034-public-test-only-signing-secret-32-bytes";
const ENV = {
  VERCEL_ENV: "preview",
  NEXT_PUBLIC_STRIDEBRAIN_ENV: "preview",
  STRIDEBRAIN_DATA_MODE: "DEMO_SYNTHETIC",
  STRIDEBRAIN_APP_ORIGIN: ORIGIN,
  STRIDEBRAIN_PREVIEW_HANDOFF_ENABLED: "true",
  STRIDEBRAIN_PREVIEW_INVITE_SHA256: createHash("sha256").update(CODE).digest("hex"),
  STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT: "2026-11-19T12:00:00Z",
};
function fixture(env: Record<string, string | undefined> = {}) {
  const records: ResolvedDemoSessionRecord[] = [];
  const membership = {
    organizationId: "org_horizon",
    organizationDataClassification: "DEMO_SYNTHETIC" as const,
    membershipId: "membership_horizon_mei",
    membershipActive: true,
    personId: "person_horizon_mei",
    personActive: true,
  };
  const repository: DemoSessionRepositoryPort = {
    getIssuableMembership: vi.fn().mockResolvedValue(membership),
    createSession: vi.fn(async (record) => {
      records.push({
        ...record,
        ...membership,
        organizationPrimaryLocale: "zh-TW",
        role: "PROJECT_MANAGER_ESTIMATOR",
        revokedAt: null,
        grants: [],
        assignments: [],
      });
    }),
    findByTokenHash: vi.fn(async (hash) => records.find((item) => item.tokenHash === hash) ?? null),
    revokeSession: vi.fn(async (id, at) => {
      const index = records.findIndex((item) => item.sessionId === id);
      if (index < 0) return false;
      records[index] = { ...records[index]!, revokedAt: at };
      return true;
    }),
  };
  return {
    repository,
    records,
    membership,
    dependencies: {
      env: { ...ENV, ...env },
      repository: () => repository,
      signingSecret: () => SECRET,
      now: () => NOW,
      allowAttempt: createAttemptBudget(),
    },
  };
}
function request(
  body = `locale=en&invitation=${CODE}`,
  options: { headers?: Record<string, string>; url?: string; method?: string } = {},
) {
  return new Request(options.url ?? `${ORIGIN}/api/preview-session`, {
    method: options.method ?? "POST",
    headers: {
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      "content-type": "application/x-www-form-urlencoded",
      ...options.headers,
    },
    ...(options.method === "GET" ? {} : { body }),
  });
}
function cookie(response: Response) {
  return response.headers.get("set-cookie")!.split(";")[0]!;
}
async function denied(response: Response, locale = "en") {
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe(`/${locale}/preview?unavailable=1`);
  expect(response.headers.has("set-cookie")).toBe(false);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).toBe("");
}

describe("controlled Preview session handoff", () => {
  it.each(["en", "zh-TW"])(
    "issues an existing trusted session and returns only to %s Home",
    async (locale) => {
      const f = fixture();
      const result = await handlePreviewSession(
        request(`locale=${locale}&invitation=${CODE}`, {
          headers: { "x-role": "ORGANIZATION_ADMIN", "x-organization-id": "org_northern" },
        }),
        "enter",
        f.dependencies,
      );
      expect(result.headers.get("location")).toBe(`/${locale}`);
      const identity = new SignedDemoIdentityContext(f.repository, SECRET, () => NOW);
      const context = await identity.resolve(
        new Request(ORIGIN, { headers: { cookie: cookie(result) } }),
      );
      expect(context).toMatchObject({
        organizationId: "org_horizon",
        membershipId: "membership_horizon_mei",
        role: "PROJECT_MANAGER_ESTIMATOR",
        locale,
        dataMode: "DEMO_SYNTHETIC",
      });
      expect(f.records[0]!.expiresAt.toISOString()).toBe("2026-11-19T11:00:00.000Z");
      expect(f.records[0]).not.toHaveProperty("token");
      const setCookie = result.headers.get("set-cookie")!;
      for (const flag of [
        "__Host-stridebrain_demo_session=",
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Max-Age=3600",
        "Expires=",
      ])
        expect(setCookie).toContain(flag);
      expect(setCookie).not.toContain("Domain=");
      expect(setCookie).not.toContain("org_horizon");
      expect(await result.text()).toBe("");
    },
  );

  it.each([
    ["invalid invitation", "locale=en&invitation=wrong"],
    ["missing invitation", "locale=en"],
    ["duplicate invitation", `locale=en&invitation=${CODE}&invitation=${CODE}`],
    ["role selector", `locale=en&invitation=${CODE}&role=ORGANIZATION_ADMIN`],
    ["organization selector", `locale=en&invitation=${CODE}&organizationId=org_northern`],
    ["membership selector", `locale=en&invitation=${CODE}&membershipId=membership_horizon_admin`],
    ["open redirect", `locale=en&invitation=${CODE}&returnTo=https://attacker.test`],
    ["duplicate locale", `locale=en&locale=zh-TW&invitation=${CODE}`],
    ["unsafe locale", `locale=//attacker.test&invitation=${CODE}`],
    ["invalid human-readable format", "locale=en&invitation=STRIDEBRAIN2026-1-K7M4"],
    ["lowercase pilot code", "locale=en&invitation=stridebrain2026-01-k7m4"],
    ["oversized body", `locale=en&invitation=${"x".repeat(2048)}`],
  ])("denies %s without issuing a session", async (_, body) => {
    const f = fixture();
    await denied(await handlePreviewSession(request(body), "enter", f.dependencies));
    expect(f.repository.createSession).not.toHaveBeenCalled();
  });

  it.each([
    { headers: { origin: "https://attacker.test" } },
    { headers: { origin: "null" } },
    { headers: { origin: "" } },
    { headers: { "sec-fetch-site": "cross-site" } },
    { headers: { "sec-fetch-site": "same-site" } },
    { headers: { "content-type": "application/json" } },
    { url: `${ORIGIN}/api/preview-session?invitation=anything` },
    { url: "https://other-preview.example.test/api/preview-session" },
    { url: "http://sb034-preview.example.test/api/preview-session" },
    { method: "GET" },
  ])("denies unsafe transport/origin/method input %#", async (options) => {
    for (const operation of ["enter", "leave"] as const) {
      const f = fixture();
      await denied(
        await handlePreviewSession(request(undefined, options), operation, f.dependencies),
      );
      expect(f.repository.createSession).not.toHaveBeenCalled();
      expect(f.repository.revokeSession).not.toHaveBeenCalled();
    }
  });

  it.each([
    { VERCEL_ENV: "production" },
    { VERCEL_ENV: undefined },
    { NEXT_PUBLIC_STRIDEBRAIN_ENV: "development" },
    { STRIDEBRAIN_DATA_MODE: "TENANT_PRIVATE" },
    { STRIDEBRAIN_DATA_MODE: undefined },
    { STRIDEBRAIN_PREVIEW_HANDOFF_ENABLED: "false" },
    { STRIDEBRAIN_PREVIEW_INVITE_SHA256: "bad" },
    { STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT: "2026-11-19T09:59:59Z" },
    { STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT: "2026-11-19T10:00:59Z" },
    { STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT: "invalid" },
    { NEXT_PUBLIC_STRIDEBRAIN_PREVIEW_INVITE_SHA256: "exposed" },
  ])("fails closed for unsupported or expired configuration %#", async (env) => {
    const f = fixture(env);
    await denied(await handlePreviewSession(request(), "enter", f.dependencies));
    expect(f.repository.createSession).not.toHaveBeenCalled();
  });

  it.each([
    "http://localhost:3000",
    "https://localhost",
    "https://x.localhost",
    "https://127.0.0.1",
    "https://[::1]",
    `${ORIGIN}/path`,
    `${ORIGIN}?code=x`,
    "https://user:password@preview.test",
    "bad",
  ])("rejects unpinned/insecure origin %s", (origin) => {
    expect(previewSessionOrigin({ ...ENV, STRIDEBRAIN_APP_ORIGIN: origin })).toBeNull();
  });

  it.each([
    { organizationId: "org_northern" },
    { personId: "person_horizon_admin" },
    { membershipId: "membership_horizon_admin" },
    { membershipActive: false },
    { personActive: false },
    { organizationDataClassification: "TENANT_PRIVATE" as const },
  ])("denies non-allowlisted or inactive server identity %#", async (overrides) => {
    const f = fixture();
    vi.mocked(f.repository.getIssuableMembership).mockResolvedValue({
      ...f.membership,
      ...overrides,
    });
    await denied(await handlePreviewSession(request(), "enter", f.dependencies));
    expect(f.repository.createSession).not.toHaveBeenCalled();
  });

  it("caps expiry to invitation validity, including the issuer's 60-second floor", async () => {
    const f = fixture({ STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT: "2026-11-19T10:01:00Z" });
    await handlePreviewSession(request(), "enter", f.dependencies);
    expect(f.records[0]!.expiresAt.toISOString()).toBe("2026-11-19T10:01:00.000Z");
    expect(previewInvitation(f.dependencies.env, new Date(NOW.getTime() + 1))).toBeNull();
  });

  it("denies missing, tampered, wrongly signed, expired and revoked sessions through the unchanged resolver", async () => {
    const f = fixture();
    const result = await handlePreviewSession(request(), "enter", f.dependencies);
    const valid = cookie(result);
    const identity = new SignedDemoIdentityContext(f.repository, SECRET, () => NOW);
    expect(await identity.resolve(new Request(ORIGIN))).toBeNull();
    expect(
      await identity.resolve(
        new Request(ORIGIN, { headers: { cookie: `${valid.slice(0, -5)}xxxxx` } }),
      ),
    ).toBeNull();
    expect(
      await new SignedDemoIdentityContext(
        f.repository,
        "other-test-signing-secret-at-least-32-bytes",
        () => NOW,
      ).resolve(new Request(ORIGIN, { headers: { cookie: valid } })),
    ).toBeNull();
    expect(
      await new SignedDemoIdentityContext(
        f.repository,
        SECRET,
        () => new Date("2026-11-19T11:00:00Z"),
      ).resolve(new Request(ORIGIN, { headers: { cookie: valid } })),
    ).toBeNull();
    const logout = await handlePreviewSession(
      request("locale=zh-TW", { headers: { cookie: valid } }),
      "leave",
      f.dependencies,
    );
    expect(logout.headers.get("location")).toBe("/zh-TW/preview");
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(logout.headers.get("set-cookie")).toContain("HttpOnly; Secure; SameSite=Lax");
    expect(await identity.resolve(new Request(ORIGIN, { headers: { cookie: valid } }))).toBeNull();
  });

  it("allows logout when login is disabled, expired or rate-limited, but denies browser session selectors", async () => {
    const f = fixture();
    const issued = await handlePreviewSession(request(), "enter", f.dependencies);
    f.dependencies.env.STRIDEBRAIN_PREVIEW_HANDOFF_ENABLED = "false";
    f.dependencies.env.STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT = "expired";
    f.dependencies.allowAttempt = () => false;
    await denied(
      await handlePreviewSession(
        request("locale=en&sessionId=other", { headers: { cookie: cookie(issued) } }),
        "leave",
        f.dependencies,
      ),
    );
    expect(
      (
        await handlePreviewSession(
          request("locale=en", { headers: { cookie: cookie(issued) } }),
          "leave",
          f.dependencies,
        )
      ).headers.get("location"),
    ).toBe("/en/preview");
  });

  it("never claims successful logout on a repository failure", async () => {
    const f = fixture();
    const issued = await handlePreviewSession(request(), "enter", f.dependencies);
    vi.mocked(f.repository.revokeSession).mockRejectedValueOnce(new Error("database detail"));
    await denied(
      await handlePreviewSession(
        request("locale=en", { headers: { cookie: cookie(issued) } }),
        "leave",
        f.dependencies,
      ),
    );
    vi.mocked(f.repository.revokeSession).mockResolvedValueOnce(false);
    await denied(
      await handlePreviewSession(
        request("locale=en", { headers: { cookie: cookie(issued) } }),
        "leave",
        f.dependencies,
      ),
    );
  });

  it("bounds attempts in constant space and resets after a minute", async () => {
    const f = fixture();
    f.dependencies.allowAttempt = createAttemptBudget(2);
    await handlePreviewSession(request("locale=en&invitation=bad"), "enter", f.dependencies);
    await handlePreviewSession(request("locale=en&invitation=bad"), "enter", f.dependencies);
    await denied(await handlePreviewSession(request(), "enter", f.dependencies));
    await denied(
      await handlePreviewSession(
        request(`locale=zh-TW&invitation=${CODE}`),
        "enter",
        f.dependencies,
      ),
      "zh-TW",
    );
    f.dependencies.now = () => new Date(NOW.getTime() + 60_000);
    expect(
      (await handlePreviewSession(request(), "enter", f.dependencies)).headers.get("location"),
    ).toBe("/en");
  });

  it("does not reflect or log credentials or errors", async () => {
    const spies = [vi.spyOn(console, "log"), vi.spyOn(console, "error"), vi.spyOn(console, "warn")];
    const f = fixture();
    vi.mocked(f.repository.createSession).mockRejectedValue(
      new Error(`${CODE} ${SECRET} database details`),
    );
    const result = await handlePreviewSession(request(), "enter", f.dependencies);
    const content = JSON.stringify([...result.headers]) + (await result.text());
    for (const secret of [CODE, SECRET, ENV.STRIDEBRAIN_PREVIEW_INVITE_SHA256, "database details"])
      expect(content).not.toContain(secret);
    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it("checks invitation freshness after a delayed body has arrived", async () => {
    const f = fixture({ STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT: "2026-11-19T10:01:01Z" });
    let current = NOW;
    f.dependencies.now = () => current;
    let enqueue: ((value: Uint8Array) => void) | undefined;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        enqueue = (value) => {
          controller.enqueue(value);
          controller.close();
        };
      },
    });
    const input = new Request(`${ORIGIN}/api/preview-session`, {
      method: "POST",
      headers: { origin: ORIGIN, "content-type": "application/x-www-form-urlencoded" },
      body,
      duplex: "half",
    } as RequestInit);
    const pending = handlePreviewSession(input, "enter", f.dependencies);
    current = new Date(NOW.getTime() + 2_000);
    enqueue!(new TextEncoder().encode(`locale=zh-TW&invitation=${CODE}`));
    await denied(await pending, "zh-TW");
    expect(f.repository.createSession).not.toHaveBeenCalled();
  });

  it("caps actual streamed bytes even with a misleading Content-Length", async () => {
    const f = fixture();
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1025));
      },
      cancel() {
        cancelled = true;
      },
    });
    const input = new Request(`${ORIGIN}/api/preview-session`, {
      method: "POST",
      headers: {
        origin: ORIGIN,
        "content-type": "application/x-www-form-urlencoded",
        "content-length": "10",
      },
      body,
      duplex: "half",
    } as RequestInit);
    await denied(await handlePreviewSession(input, "enter", f.dependencies));
    expect(cancelled).toBe(true);
    expect(f.repository.createSession).not.toHaveBeenCalled();
  });
});
