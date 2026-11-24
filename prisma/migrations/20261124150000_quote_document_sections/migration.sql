-- Additive document storage. Existing items, financial figures and issued snapshots are retained.
ALTER TABLE "Project" ADD COLUMN "siteAddress" VARCHAR(200);
ALTER TABLE "QuoteVersion"
  ADD COLUMN "documentFormatVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "discountAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN "discountLabel" VARCHAR(40) NOT NULL DEFAULT '';
CREATE TABLE "QuoteSection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "quoteVersionId" TEXT NOT NULL,
  "position" INTEGER NOT NULL CHECK ("position" BETWEEN 1 AND 30),
  "title" VARCHAR(80) NOT NULL,
  "categoryId" TEXT,
  CONSTRAINT "QuoteSection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QuoteSection_quoteVersionId_organizationId_fkey" FOREIGN KEY ("quoteVersionId", "organizationId") REFERENCES "QuoteVersion"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QuoteSection_organizationId_categoryId_fkey" FOREIGN KEY ("organizationId", "categoryId") REFERENCES "FirmWorkCategory"("organizationId", "key") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "QuoteSection_id_organizationId_key" ON "QuoteSection"("id", "organizationId");
CREATE UNIQUE INDEX "QuoteSection_id_quoteVersionId_organizationId_key" ON "QuoteSection"("id", "quoteVersionId", "organizationId");
CREATE UNIQUE INDEX "QuoteSection_organizationId_quoteVersionId_position_key" ON "QuoteSection"("organizationId", "quoteVersionId", "position");
CREATE INDEX "QuoteSection_organizationId_categoryId_idx" ON "QuoteSection"("organizationId", "categoryId");
ALTER TABLE "QuoteItem"
  ADD COLUMN "sectionId" TEXT,
  ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'ITEM' CHECK ("kind" IN ('ITEM', 'PERCENTAGE', 'NOTE')),
  ADD COLUMN "description" VARCHAR(500),
  ADD COLUMN "remark" VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN "percentage" DECIMAL(8,2),
  ALTER COLUMN "categoryId" DROP NOT NULL,
  ADD CONSTRAINT "QuoteItem_sectionId_quoteVersionId_organizationId_fkey" FOREIGN KEY ("sectionId", "quoteVersionId", "organizationId") REFERENCES "QuoteSection"("id", "quoteVersionId", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "QuoteItem_sectionId_quoteVersionId_organizationId_idx" ON "QuoteItem"("sectionId", "quoteVersionId", "organizationId");
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_document_discount_check" CHECK ("documentFormatVersion" IN (1, 2) AND "discountAmount" >= 0);
