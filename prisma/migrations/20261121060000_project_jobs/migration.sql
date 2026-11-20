-- Existing projects retain their quote-derived categories. New intake records
-- can carry comparison context before a quote has been authored.
ALTER TABLE "Project" ADD COLUMN "commercialCategoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "AuditEvent" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "AuditEvent_organizationId_idempotencyKey_key"
  ON "AuditEvent"("organizationId", "idempotencyKey");
