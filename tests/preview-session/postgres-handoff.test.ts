import { createHash, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getPrismaClient } from "@/lib/server/prisma";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { createAttemptBudget, handlePreviewSession } from "@/modules/preview-session/handoff";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeDatabase("Preview handoff with existing PostgreSQL session and authorization", () => {
  it.each(
    (
      [
        ["owner", "admin", "ORGANIZATION_ADMIN"],
        ["project-manager", "mei", "PROJECT_MANAGER_ESTIMATOR"],
        ["finance", "finance", "FINANCIAL_REVIEWER"],
        ["viewer", "viewer", "VIEWER"],
      ] as const
    ).flatMap(([person, suffix, role]) =>
      (["en", "zh-TW"] as const).map((locale) => ({ person, suffix, role, locale })),
    ),
  )(
    "$person enters, resolves Xinyi, denies cross-tenant access, and revokes in $locale",
    async ({ person, suffix, role, locale }) => {
      const database = getPrismaClient();
      const repository = new PrismaDemoSessionRepository(
        database as unknown as PrismaDemoSessionDatabase,
      );
      const code = `STRIDEBRAIN2026-01-${randomBytes(2).toString("hex").toUpperCase()}`;
      const secret = randomBytes(32).toString("base64url");
      const origin = "https://sb034-preview.example.test";
      const dependencies = {
        env: {
          VERCEL_ENV: "preview",
          NEXT_PUBLIC_STRIDEBRAIN_ENV: "preview",
          STRIDEBRAIN_DATA_MODE: "DEMO_SYNTHETIC",
          STRIDEBRAIN_APP_ORIGIN: origin,
          STRIDEBRAIN_PREVIEW_HANDOFF_ENABLED: "true",
          STRIDEBRAIN_PREVIEW_INVITE_SHA256: createHash("sha256").update(code).digest("hex"),
          STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT: new Date(Date.now() + 3_600_000).toISOString(),
        },
        repository: () => repository,
        signingSecret: () => secret,
        allowAttempt: createAttemptBudget(),
      };
      const result = await handlePreviewSession(
        new Request(`${origin}/api/preview-session`, {
          method: "POST",
          headers: { origin, "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ locale, invitation: code, person }),
        }),
        "enter",
        dependencies,
      );
      expect(result.headers.get("location")).toBe(`/${locale}`);
      const cookie = result.headers.get("set-cookie")!.split(";")[0]!;
      const identity = new SignedDemoIdentityContext(repository, secret);
      const protectedRequest = new Request(`${origin}/${locale}/projects/PRJ-XINYI-026`, {
        headers: { cookie, "x-organization-id": "org_northern", "x-role": "ORGANIZATION_ADMIN" },
      });
      const context = await identity.resolve(protectedRequest);
      expect(context?.organizationId).toBe("org_horizon");
      expect(context?.role).toBe(role);
      expect(context?.membershipId).toBe(`membership_horizon_${suffix}`);
      expect(context?.userId).toBe(`person_horizon_${suffix}`);
      expect(context?.locale).toBe(locale);
      const sessionId = context!.sessionId;
      if (!sessionId) throw new Error("TRUSTED_SESSION_REQUIRED");
      try {
        const workspace = createProjectWorkspaceService();
        expect((await workspace.execute(context!, "PRJ-XINYI-026")).kind).toBe("AVAILABLE");
        const foreign = await database.project.findFirstOrThrow({
          where: { organizationId: "org_northern" },
        });
        expect((await workspace.execute(context!, foreign.businessKey)).kind).not.toBe("AVAILABLE");
        expect(await identity.resolve(new Request(protectedRequest.url))).toBeNull();
        const leave = await handlePreviewSession(
          new Request(`${origin}/api/preview-session/logout`, {
            method: "POST",
            headers: { origin, cookie, "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ locale }),
          }),
          "leave",
          dependencies,
        );
        expect(leave.headers.get("location")).toBe(`/${locale}/preview`);
        expect(await identity.resolve(protectedRequest)).toBeNull();
        expect(
          (await database.demoSession.findUniqueOrThrow({ where: { id: sessionId } })).revokedAt,
        ).not.toBeNull();
      } finally {
        await repository.revokeSession(sessionId, new Date());
        await database.demoSession.delete({ where: { id: sessionId } });
      }
    },
  );
});
