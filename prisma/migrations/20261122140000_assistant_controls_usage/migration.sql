-- Forward-only controls and metadata. Existing tenants remain opted out.
ALTER TABLE "Organization" ADD COLUMN "assistantEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "aiExcluded" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "AssistantUsage" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "toolNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sourceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "estimatedUsd" DECIMAL(18,9),
  "outcome" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssistantUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT,
  CONSTRAINT "AssistantUsage_membershipId_organizationId_fkey" FOREIGN KEY ("membershipId", "organizationId") REFERENCES "Membership"("id", "organizationId") ON DELETE RESTRICT,
  CONSTRAINT "AssistantUsage_nonnegative" CHECK (("inputTokens" IS NULL OR "inputTokens" >= 0) AND ("outputTokens" IS NULL OR "outputTokens" >= 0) AND ("estimatedUsd" IS NULL OR "estimatedUsd" >= 0)),
  CONSTRAINT "AssistantUsage_outcome" CHECK ("outcome" IN ('PENDING', 'ANSWERED', 'FALLBACK_UNAVAILABLE', 'FALLBACK_TIMEOUT', 'FALLBACK_DAILY_CAP', 'FALLBACK_TOOL_CAP', 'FALLBACK_OUTPUT_CAP', 'FALLBACK_INVALID_OUTPUT', 'FALLBACK_UNGROUNDED', 'FALLBACK_ACCESS_CHANGED', 'FALLBACK_DISABLED'))
);
CREATE UNIQUE INDEX "AssistantUsage_id_organizationId_key" ON "AssistantUsage"("id", "organizationId");
CREATE INDEX "AssistantUsage_organizationId_createdAt_idx" ON "AssistantUsage"("organizationId", "createdAt");
CREATE INDEX "AssistantUsage_organizationId_requestId_idx" ON "AssistantUsage"("organizationId", "requestId");
