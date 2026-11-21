-- Keep historical policy-1 receipts/proposals intact; allow new policy-2 proposals.
-- Every other completeness, scope, evidence and immutability constraint is unchanged.
BEGIN;
ALTER TABLE "ProposedAction" DROP CONSTRAINT "ProposedAction_stage8_complete_check";
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_stage8_complete_check" CHECK (
  "snapshotVersion" IS NULL OR (
    "snapshotVersion" = 'internal-review-proposal-snapshot.v1'
    AND "type" = 'INTERNAL_REVIEW'
    AND "policyVersion" IN ('INTERNAL-REVIEW-ACTION-1.0', 'INTERNAL-REVIEW-ACTION-2.0')
    AND "createdBy" = 'SYSTEM'
    AND "businessKey" IS NOT NULL AND length("businessKey") BETWEEN 1 AND 120
    AND "enrichmentRunId" IS NOT NULL AND "preparedByMembershipId" IS NOT NULL
    AND "preparationKey" IS NOT NULL AND "preparationKey" ~ '^[0-9a-f]{64}$'
    AND "confirmationKey" IS NOT NULL AND "confirmationKey" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND "contentSnapshot" IS NOT NULL
    AND jsonb_typeof("contentSnapshot") = 'object'
    AND ("contentSnapshot" ->> 'version') IS NOT DISTINCT FROM "snapshotVersion"
    AND octet_length("contentSnapshot"::text) <= 1048576
    AND "expiresAt" IS NOT NULL AND "expiresAt" > "createdAt"
    AND "evidenceReferenceIds" IS NOT NULL AND cardinality("evidenceReferenceIds") > 0
    AND length("title") BETWEEN 1 AND 200
    AND length("rationale") BETWEEN 1 AND 8000
    AND (("suggestedAssigneeMembershipId" IS NULL AND "suggestedAssigneeId" IS NULL)
      OR ("suggestedAssigneeMembershipId" IS NOT NULL AND "suggestedAssigneeId" IS NOT NULL))
    AND (("status" = 'PREPARED' AND "consumedAt" IS NULL)
      OR ("status" = 'CONFIRMED' AND "consumedAt" IS NOT NULL))
  )
);
COMMIT;
