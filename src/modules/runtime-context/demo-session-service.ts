import type { Locale } from "@/modules/localization/config";
import { serializeDemoSessionCookie } from "@/modules/runtime-context/session-cookie";
import type { DemoSessionRepositoryPort } from "@/modules/runtime-context/session-repository";
import { issueSignedSessionToken } from "@/modules/runtime-context/session-token";

const DEFAULT_TTL_SECONDS = 60 * 60 * 4;
const MAX_TTL_SECONDS = 60 * 60 * 24;

export type IssuedDemoSession = Readonly<{
  sessionId: string;
  expiresAt: Date;
  setCookie: string;
}>;

/**
 * Server-only issuer for the L1 synthetic demo. It accepts a membership ID
 * only from trusted server code, validates that the target is an active
 * synthetic fixture membership, stores only a token hash, and returns the raw
 * credential solely through the secure response cookie.
 */
export class DemoSessionService {
  constructor(
    private readonly repository: DemoSessionRepositoryPort,
    private readonly signingSecret: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async issueForMembership(
    membershipId: string,
    options: Readonly<{
      locale?: Locale;
      ttlSeconds?: number;
    }> = {},
  ): Promise<IssuedDemoSession | null> {
    const membership = await this.repository.getIssuableMembership(membershipId);
    if (!membership) return null;
    if (!membership.membershipActive || !membership.personActive) return null;
    if (membership.organizationDataClassification !== "DEMO_SYNTHETIC") return null;

    const ttlSeconds = Math.max(
      60,
      Math.min(MAX_TTL_SECONDS, options.ttlSeconds ?? DEFAULT_TTL_SECONDS),
    );
    const issuedAt = this.now();
    const expiresAt = new Date(issuedAt.getTime() + ttlSeconds * 1000);
    const credential = issueSignedSessionToken(this.signingSecret);

    await this.repository.createSession({
      sessionId: credential.sessionId,
      organizationId: membership.organizationId,
      membershipId: membership.membershipId,
      tokenHash: credential.tokenHash,
      preferredLocale: options.locale ?? "zh-TW",
      issuedAt,
      expiresAt,
    });

    return Object.freeze({
      sessionId: credential.sessionId,
      expiresAt,
      setCookie: serializeDemoSessionCookie(credential.token, expiresAt, issuedAt),
    });
  }

  async revoke(sessionId: string): Promise<boolean> {
    return this.repository.revokeSession(sessionId, this.now());
  }
}
