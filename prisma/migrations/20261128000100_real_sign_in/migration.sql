ALTER TABLE "Membership" ADD COLUMN "invitationStatus" TEXT NOT NULL DEFAULT 'JOINED', ADD COLUMN "invitedAt" TIMESTAMP(3), ADD COLUMN "joinedAt" TIMESTAMP(3);
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_invitationStatus_check" CHECK ("invitationStatus" IN ('JOINED', 'INVITED', 'CANCELLED'));
CREATE TABLE "AuthUser" (
 "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE,
 "emailVerified" BOOLEAN NOT NULL DEFAULT false, "image" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "AuthSession" (
 "id" TEXT PRIMARY KEY, "token" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL REFERENCES "AuthUser"("id") ON DELETE CASCADE,
 "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL, "ipAddress" TEXT, "userAgent" TEXT, "selectedMembershipId" TEXT
);
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE TABLE "AuthAccount" (
 "id" TEXT PRIMARY KEY, "accountId" TEXT NOT NULL, "providerId" TEXT NOT NULL,
 "userId" TEXT NOT NULL REFERENCES "AuthUser"("id") ON DELETE CASCADE,
 "accessToken" TEXT, "refreshToken" TEXT, "idToken" TEXT,
 "accessTokenExpiresAt" TIMESTAMP(3), "refreshTokenExpiresAt" TIMESTAMP(3), "scope" TEXT, "password" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 UNIQUE("providerId", "accountId")
);
CREATE INDEX "AuthAccount_userId_idx" ON "AuthAccount"("userId");
CREATE TABLE "AuthVerification" (
 "id" TEXT PRIMARY KEY, "identifier" TEXT NOT NULL UNIQUE, "value" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "AuthRateLimit" ("id" TEXT PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "count" INTEGER NOT NULL, "lastRequest" BIGINT NOT NULL);
CREATE TABLE "SignInCounter" (
 "key" TEXT PRIMARY KEY, "shortStartedAt" TIMESTAMP(3) NOT NULL, "shortCount" INTEGER NOT NULL,
 "dayStartedAt" TIMESTAMP(3) NOT NULL, "dayCount" INTEGER NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "SignInCounter_expiresAt_idx" ON "SignInCounter"("expiresAt");
CREATE TABLE "IdentityLink" (
 "id" TEXT PRIMARY KEY, "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
 "personId" TEXT NOT NULL, "authUserId" TEXT NOT NULL REFERENCES "AuthUser"("id") ON DELETE CASCADE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("personId", "organizationId") REFERENCES "Person"("id", "organizationId") ON DELETE CASCADE,
 UNIQUE ("id", "organizationId"), UNIQUE ("organizationId", "personId"), UNIQUE ("authUserId", "organizationId")
);
