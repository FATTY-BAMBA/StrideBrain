-- Multiple immutable economics selections share one immutable structural ranking.
-- Never rewrite historical migrations, snapshots, claim content, action or receipt history.
BEGIN;
ALTER TABLE "ComparisonClaim" ADD COLUMN "enrichmentRunId" TEXT;

-- Validate both directions before assigning any historical claim ownership.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "EconomicsEnrichmentRun" e
    WHERE e."resultSnapshot"->>'schemaVersion' IS DISTINCT FROM 'economics-enrichment-snapshot.v1'
       OR e."resultSnapshot" #>> '{result,run,id}' IS DISTINCT FROM e."id"
       OR e."resultSnapshot" #>> '{result,run,comparisonRunId}' IS DISTINCT FROM e."comparisonRunId"
       OR jsonb_typeof(e."resultSnapshot" #> '{result,claims}') IS DISTINCT FROM 'array'
  ) THEN
    RAISE EXCEPTION 'ECONOMICS_SNAPSHOT_IDENTITY_MISMATCH';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "EconomicsEnrichmentRun" e
    CROSS JOIN LATERAL jsonb_array_elements(e."resultSnapshot" #> '{result,claims}') j(claim)
    WHERE NOT EXISTS (
      SELECT 1 FROM "ComparisonClaim" c
      WHERE c."organizationId" = e."organizationId"
        AND c."comparisonRunId" = e."comparisonRunId"
        AND c."claimKey" = j.claim->>'claimKey'
    )
  ) THEN
    RAISE EXCEPTION 'ECONOMICS_PERSISTED_CLAIM_MISSING';
  END IF;
END $$;


-- The old one-to-one constraint makes ownership unique. Match the authoritative
-- snapshot, not a fixture business key or a guessed claim type.
CREATE TEMP TABLE stage9_claim_owners ON COMMIT DROP AS
SELECT c."id" AS "claimId", e."id" AS "enrichmentRunId", j.claim
FROM "ComparisonClaim" c
JOIN "EconomicsEnrichmentRun" e
  ON e."comparisonRunId" = c."comparisonRunId" AND e."organizationId" = c."organizationId"
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e."resultSnapshot" #> '{result,claims}', '[]'::jsonb)) j(claim)
WHERE j.claim->>'claimKey' = c."claimKey";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM stage9_claim_owners GROUP BY "claimId" HAVING count(*) <> 1) THEN
    RAISE EXCEPTION 'AMBIGUOUS_ECONOMICS_CLAIM_OWNER';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "ComparisonClaim" c
    WHERE left(c."id", 10) = 'econclaim_'
      AND NOT EXISTS (SELECT 1 FROM stage9_claim_owners o WHERE o."claimId" = c."id")
  ) THEN
    RAISE EXCEPTION 'ECONOMICS_CLAIM_OWNER_MISSING';
  END IF;
  IF EXISTS (
    SELECT 1 FROM stage9_claim_owners o JOIN "ComparisonClaim" c ON c."id" = o."claimId"
    WHERE c."claimType" IS DISTINCT FROM o.claim->>'kind'
       OR c."titleEn" IS DISTINCT FROM o.claim->>'titleEn'
       OR c."titleZhTw" IS DISTINCT FROM o.claim->>'titleZhTw'
       OR c."value" IS DISTINCT FROM o.claim->'value'
       OR c."observationType"::text IS DISTINCT FROM o.claim->>'observationType'
       OR c."authorityState"::text IS DISTINCT FROM o.claim->>'authorityState'
       OR c."sufficiencyCode" IS DISTINCT FROM o.claim->>'sufficiencyCode'
       OR to_jsonb(c."evidenceReferenceIds") IS DISTINCT FROM o.claim->'evidenceReferenceIds'
  ) THEN
    RAISE EXCEPTION 'ECONOMICS_CLAIM_SNAPSHOT_MISMATCH';
  END IF;
END $$;
UPDATE "ComparisonClaim" c SET "enrichmentRunId" = o."enrichmentRunId"
FROM stage9_claim_owners o WHERE c."id" = o."claimId";

CREATE UNIQUE INDEX "EconomicsEnrichmentRun_claim_scope_key"
ON "EconomicsEnrichmentRun"("id", "organizationId", "comparisonRunId");
ALTER TABLE "ComparisonClaim" ADD CONSTRAINT "ComparisonClaim_enrichment_lineage_fkey"
FOREIGN KEY ("enrichmentRunId", "organizationId", "comparisonRunId")
REFERENCES "EconomicsEnrichmentRun"("id", "organizationId", "comparisonRunId")
ON DELETE NO ACTION ON UPDATE NO ACTION;

DROP INDEX "ComparisonClaim_organizationId_comparisonRunId_claimKey_key";
CREATE UNIQUE INDEX "ComparisonClaim_enrichment_claim_key"
ON "ComparisonClaim"("organizationId", "enrichmentRunId", "claimKey");
CREATE UNIQUE INDEX "ComparisonClaim_structural_claim_key"
ON "ComparisonClaim"("organizationId", "comparisonRunId", "claimKey")
WHERE "enrichmentRunId" IS NULL;

DROP INDEX "EconomicsEnrichmentRun_comparisonRunId_key";
CREATE INDEX "EconomicsEnrichmentRun_comparison_idx" ON "EconomicsEnrichmentRun"("comparisonRunId");
COMMIT;
