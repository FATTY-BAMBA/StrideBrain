-- Stage 2 trusted demo-session and explicit capability-grant persistence.
-- Raw session credentials are never stored; only SHA-256 hashes are persisted.

CREATE TYPE "CapabilityEffect" AS ENUM ('ALLOW', 'DENY');

CREATE TABLE "MembershipCapabilityGrant" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "effect" "CapabilityEffect" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MembershipCapabilityGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MembershipCapabilityGrant_capability_check" CHECK (
    "capability" IN (
      'project:read',
      'project:compare',
      'quote:read',
      'commercial:forecast-read',
      'commercial:actual-read',
      'evidence:read',
      'action:internal-review:propose',
      'action:internal-review:create',
      'action:assign',
      'authority:financial-conflict:resolve',
      'settings:manage'
    )
  )
);

CREATE TABLE "DemoSession" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "preferredLocale" TEXT NOT NULL DEFAULT 'zh-TW',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3),

  CONSTRAINT "DemoSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DemoSession_tokenHash_check" CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "DemoSession_locale_check" CHECK ("preferredLocale" IN ('zh-TW', 'en')),
  CONSTRAINT "DemoSession_expiry_check" CHECK ("expiresAt" > "issuedAt"),
  CONSTRAINT "DemoSession_revocation_check" CHECK ("revokedAt" IS NULL OR "revokedAt" >= "issuedAt")
);

CREATE UNIQUE INDEX "MembershipCapabilityGrant_organizationId_membershipId_capability_key"
  ON "MembershipCapabilityGrant"("organizationId", "membershipId", "capability");
CREATE UNIQUE INDEX "MembershipCapabilityGrant_id_organizationId_key"
  ON "MembershipCapabilityGrant"("id", "organizationId");
CREATE INDEX "MembershipCapabilityGrant_organizationId_membershipId_effect_idx"
  ON "MembershipCapabilityGrant"("organizationId", "membershipId", "effect");

CREATE UNIQUE INDEX "DemoSession_tokenHash_key" ON "DemoSession"("tokenHash");
CREATE UNIQUE INDEX "DemoSession_id_organizationId_key" ON "DemoSession"("id", "organizationId");
CREATE INDEX "DemoSession_organizationId_membershipId_expiresAt_idx"
  ON "DemoSession"("organizationId", "membershipId", "expiresAt");
CREATE INDEX "DemoSession_expiresAt_revokedAt_idx"
  ON "DemoSession"("expiresAt", "revokedAt");

ALTER TABLE "MembershipCapabilityGrant"
  ADD CONSTRAINT "MembershipCapabilityGrant_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MembershipCapabilityGrant_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DemoSession"
  ADD CONSTRAINT "DemoSession_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DemoSession_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
