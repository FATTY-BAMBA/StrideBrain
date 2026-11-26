-- Nullable metadata only. Existing usage and issued documents are unchanged.
ALTER TABLE "AssistantUsage"
  ADD COLUMN "providerHttpStatus" INTEGER,
  ADD COLUMN "failureCode" TEXT;
ALTER TABLE "AssistantUsage" ADD CONSTRAINT "AssistantUsage_providerHttpStatus_check"
  CHECK ("providerHttpStatus" IS NULL OR "providerHttpStatus" BETWEEN 100 AND 599);
