-- Canonical indexed keys change; immutable historical snapshots and their links do not.
BEGIN;
ALTER TABLE "ComparisonClaim" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "ComparisonClaim" ADD COLUMN "originalClaimKey" TEXT;

CREATE TEMP TABLE sb044_category_identity ON COMMIT DROP AS
SELECT c."id", category->>'categoryId' AS "categoryId"
FROM "ComparisonClaim" c
JOIN "EconomicsEnrichmentRun" e
  ON e."id" = c."enrichmentRunId" AND e."organizationId" = c."organizationId"
CROSS JOIN LATERAL jsonb_array_elements(e."resultSnapshot" #> '{result,categories}') category
WHERE c."claimType" IN ('CATEGORY_QUOTED_VARIANCE', 'CATEGORY_FORECAST_ACTUAL_VARIANCE', 'CATEGORY_ACTUAL_INSUFFICIENT')
  AND c."claimKey" IN (
    (category->>'categoryId') || '_' || substring(c."claimType" from 10),
    'XINYI_' || (category->>'categoryId') || '_' || substring(c."claimType" from 10)
  );
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sb044_category_identity GROUP BY "id" HAVING count(*) <> 1)
    OR EXISTS (
      SELECT 1 FROM "ComparisonClaim" c
      WHERE c."claimType" IN ('CATEGORY_QUOTED_VARIANCE','CATEGORY_FORECAST_ACTUAL_VARIANCE','CATEGORY_ACTUAL_INSUFFICIENT')
        AND NOT EXISTS (SELECT 1 FROM sb044_category_identity i WHERE i."id" = c."id")
    ) THEN RAISE EXCEPTION 'CATEGORY_CLAIM_IDENTITY_UNAVAILABLE'; END IF;
END $$;
UPDATE "ComparisonClaim" c SET "categoryId" = i."categoryId"
FROM sb044_category_identity i WHERE c."id" = i."id";
UPDATE "ComparisonClaim"
SET "originalClaimKey" = "claimKey", "claimKey" = substring("claimKey" from 7)
WHERE left("claimKey", 6) = 'XINYI_';
UPDATE "EvidenceReference" SET "claimKey" = substring("claimKey" from 7)
WHERE left("claimKey", 6) = 'XINYI_';
COMMIT;
