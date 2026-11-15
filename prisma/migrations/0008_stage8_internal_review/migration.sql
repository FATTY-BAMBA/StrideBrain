-- Stage 8: governed internal review persistence. Additive, roll-forward migration.
-- Existing unversioned rows remain intact and unavailable to Stage 8 commands.

-- AlterTable
ALTER TABLE "ProposedAction" ADD COLUMN     "businessKey" TEXT,
ADD COLUMN     "confirmationKey" TEXT,
ADD COLUMN     "consumedAt" TIMESTAMP(3),
ADD COLUMN     "contentSnapshot" JSONB,
ADD COLUMN     "enrichmentRunId" TEXT,
ADD COLUMN     "preparationKey" TEXT,
ADD COLUMN     "preparedByMembershipId" TEXT,
ADD COLUMN     "snapshotVersion" TEXT,
ADD COLUMN     "suggestedAssigneeMembershipId" TEXT;

-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "assigneeMembershipId" TEXT,
ADD COLUMN     "businessKey" TEXT,
ADD COLUMN     "contentSnapshot" JSONB,
ADD COLUMN     "createdByMembershipId" TEXT,
ADD COLUMN     "enrichmentRunId" TEXT,
ADD COLUMN     "evidenceSnapshot" JSONB,
ADD COLUMN     "snapshotVersion" TEXT;

-- CreateTable
CREATE TABLE "InternalReviewReceipt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "proposedActionId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "comparisonRunId" TEXT NOT NULL,
    "enrichmentRunId" TEXT NOT NULL,
    "actorMembershipId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payloadFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalReviewReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternalReviewReceipt_project_created_idx" ON "InternalReviewReceipt"("organizationId", "projectId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalReviewReceipt_actor_idx" ON "InternalReviewReceipt"("organizationId", "actorMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalReviewReceipt_idempotency_key" ON "InternalReviewReceipt"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "InternalReviewReceipt_proposal_key" ON "InternalReviewReceipt"("organizationId", "proposedActionId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalReviewReceipt_action_key" ON "InternalReviewReceipt"("organizationId", "actionId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalReviewReceipt_lineage_key" ON "InternalReviewReceipt"("actionId", "organizationId", "projectId", "proposedActionId", "comparisonRunId", "enrichmentRunId", "actorMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_person_scope_key" ON "Membership"("id", "organizationId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonRun_project_scope_key" ON "ComparisonRun"("id", "organizationId", "activeProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicsEnrichmentRun_scope_key" ON "EconomicsEnrichmentRun"("id", "organizationId", "comparisonRunId", "activeProjectId");

-- CreateIndex
CREATE INDEX "ProposedAction_enrichment_idx" ON "ProposedAction"("organizationId", "enrichmentRunId");

-- CreateIndex
CREATE INDEX "ProposedAction_preparer_idx" ON "ProposedAction"("organizationId", "preparedByMembershipId");

-- CreateIndex
CREATE INDEX "ProposedAction_assignee_idx" ON "ProposedAction"("organizationId", "suggestedAssigneeMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposedAction_business_key" ON "ProposedAction"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProposedAction_preparation_key" ON "ProposedAction"("organizationId", "preparationKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProposedAction_lineage_key" ON "ProposedAction"("id", "organizationId", "projectId", "comparisonRunId", "enrichmentRunId", "preparedByMembershipId");

-- CreateIndex
CREATE INDEX "Action_enrichment_idx" ON "Action"("organizationId", "enrichmentRunId");

-- CreateIndex
CREATE INDEX "Action_creator_idx" ON "Action"("organizationId", "createdByMembershipId");

-- CreateIndex
CREATE INDEX "Action_assignee_idx" ON "Action"("organizationId", "assigneeMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Action_business_key" ON "Action"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Action_proposal_once_key" ON "Action"("organizationId", "proposedActionId");

-- CreateIndex
CREATE UNIQUE INDEX "Action_receipt_lineage_key" ON "Action"("id", "organizationId", "projectId", "proposedActionId", "comparisonRunId", "enrichmentRunId", "createdByMembershipId");

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_enrichmentRunId_organizationId_comparisonRu_fkey" FOREIGN KEY ("enrichmentRunId", "organizationId", "comparisonRunId", "projectId") REFERENCES "EconomicsEnrichmentRun"("id", "organizationId", "comparisonRunId", "activeProjectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_preparedByMembershipId_organizationId_fkey" FOREIGN KEY ("preparedByMembershipId", "organizationId") REFERENCES "Membership"("id", "organizationId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_suggestedAssigneeMembershipId_organizationI_fkey" FOREIGN KEY ("suggestedAssigneeMembershipId", "organizationId", "suggestedAssigneeId") REFERENCES "Membership"("id", "organizationId", "personId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_proposal_lineage_fkey" FOREIGN KEY ("proposedActionId", "organizationId", "projectId", "comparisonRunId", "enrichmentRunId", "createdByMembershipId") REFERENCES "ProposedAction"("id", "organizationId", "projectId", "comparisonRunId", "enrichmentRunId", "preparedByMembershipId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_enrichmentRunId_organizationId_comparisonRunId_proj_fkey" FOREIGN KEY ("enrichmentRunId", "organizationId", "comparisonRunId", "projectId") REFERENCES "EconomicsEnrichmentRun"("id", "organizationId", "comparisonRunId", "activeProjectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_createdByMembershipId_organizationId_createdByUserI_fkey" FOREIGN KEY ("createdByMembershipId", "organizationId", "createdByUserId") REFERENCES "Membership"("id", "organizationId", "personId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_assigneeMembershipId_organizationId_assigneePersonI_fkey" FOREIGN KEY ("assigneeMembershipId", "organizationId", "assigneePersonId") REFERENCES "Membership"("id", "organizationId", "personId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "InternalReviewReceipt" ADD CONSTRAINT "InternalReviewReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "InternalReviewReceipt" ADD CONSTRAINT "InternalReviewReceipt_actorMembershipId_organizationId_fkey" FOREIGN KEY ("actorMembershipId", "organizationId") REFERENCES "Membership"("id", "organizationId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "InternalReviewReceipt" ADD CONSTRAINT "InternalReviewReceipt_action_lineage_fkey" FOREIGN KEY ("actionId", "organizationId", "projectId", "proposedActionId", "comparisonRunId", "enrichmentRunId", "actorMembershipId") REFERENCES "Action"("id", "organizationId", "projectId", "proposedActionId", "comparisonRunId", "enrichmentRunId", "createdByMembershipId") ON DELETE NO ACTION ON UPDATE NO ACTION;


-- Additional tenant/run scope constraints intentionally strengthen existing
-- legacy single-column relations without dropping or rewriting any data.
ALTER TABLE "ComparisonRun"
  ADD CONSTRAINT "ComparisonRun_project_tenant_fkey"
  FOREIGN KEY ("activeProjectId", "organizationId")
  REFERENCES "Project" ("id", "organizationId") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "EconomicsEnrichmentRun"
  ADD CONSTRAINT "EconomicsEnrichmentRun_comparison_scope_fkey"
  FOREIGN KEY ("comparisonRunId", "organizationId", "activeProjectId")
  REFERENCES "ComparisonRun" ("id", "organizationId", "activeProjectId")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ProposedAction"
  ADD CONSTRAINT "ProposedAction_comparison_scope_fkey"
  FOREIGN KEY ("comparisonRunId", "organizationId", "projectId")
  REFERENCES "ComparisonRun" ("id", "organizationId", "activeProjectId")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "Action"
  ADD CONSTRAINT "Action_comparison_scope_fkey"
  FOREIGN KEY ("comparisonRunId", "organizationId", "projectId")
  REFERENCES "ComparisonRun" ("id", "organizationId", "activeProjectId")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "AuditEvent"
  ADD CONSTRAINT "AuditEvent_actor_tenant_fkey"
  FOREIGN KEY ("actorMembershipId", "organizationId")
  REFERENCES "Membership" ("id", "organizationId") ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT "AuditEvent_comparison_tenant_fkey"
  FOREIGN KEY ("comparisonRunId", "organizationId")
  REFERENCES "ComparisonRun" ("id", "organizationId") ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT "AuditEvent_proposal_tenant_fkey"
  FOREIGN KEY ("proposedActionId", "organizationId")
  REFERENCES "ProposedAction" ("id", "organizationId") ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT "AuditEvent_action_tenant_fkey"
  FOREIGN KEY ("actionId", "organizationId")
  REFERENCES "Action" ("id", "organizationId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Stage 8 is identified by an explicit version. Nullable additions preserve
-- legacy rows; the Stage 8 application does not treat them as executable state.
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_stage8_complete_check" CHECK (
  "snapshotVersion" IS NULL OR (
    "snapshotVersion" = 'internal-review-proposal-snapshot.v1'
    AND "type" = 'INTERNAL_REVIEW'
    AND "policyVersion" = 'INTERNAL-REVIEW-ACTION-1.0'
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

ALTER TABLE "Action" ADD CONSTRAINT "Action_stage8_complete_check" CHECK (
  "snapshotVersion" IS NULL OR (
    "snapshotVersion" = 'internal-review-action-snapshot.v1'
    AND "type" = 'INTERNAL_REVIEW' AND "status" = 'OPEN'
    AND "businessKey" IS NOT NULL AND length("businessKey") BETWEEN 1 AND 120
    AND "proposedActionId" IS NOT NULL AND "enrichmentRunId" IS NOT NULL
    AND "createdByMembershipId" IS NOT NULL
    AND "contentSnapshot" IS NOT NULL AND "evidenceSnapshot" IS NOT NULL
    AND jsonb_typeof("contentSnapshot") = 'object'
    AND ("contentSnapshot" ->> 'version') IS NOT DISTINCT FROM "snapshotVersion"
    AND jsonb_typeof("evidenceSnapshot") = 'object'
    AND ("evidenceSnapshot" ->> 'version') IS NOT DISTINCT FROM 'internal-review-evidence-snapshot.v1'
    AND octet_length("contentSnapshot"::text) <= 1048576
    AND octet_length("evidenceSnapshot"::text) <= 1048576
    AND "evidenceReferenceIds" IS NOT NULL AND cardinality("evidenceReferenceIds") > 0
    AND length("title") BETWEEN 1 AND 200
    AND length("rationale") BETWEEN 1 AND 8000
    AND (("assigneeMembershipId" IS NULL AND "assigneePersonId" IS NULL)
      OR ("assigneeMembershipId" IS NOT NULL AND "assigneePersonId" IS NOT NULL))
  )
);

ALTER TABLE "InternalReviewReceipt"
  ADD CONSTRAINT "InternalReviewReceipt_key_check" CHECK (
    "idempotencyKey" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  ADD CONSTRAINT "InternalReviewReceipt_payload_check" CHECK (
    "payloadFingerprint" ~ '^[0-9a-f]{64}$'
  );

-- No application bypass switch exists. Only the guarded owner-operated
-- synthetic fixture reset temporarily disables these named triggers within
-- its own transaction and verifies re-enablement before commit.
CREATE FUNCTION stridebrain_reject_immutable_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_RECORD' USING ERRCODE = '23514';
END;
$$;

CREATE FUNCTION stridebrain_guard_internal_review_action() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."snapshotVersion" IS NOT NULL THEN
    RAISE EXCEPTION 'IMMUTABLE_INTERNAL_REVIEW_ACTION' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION stridebrain_guard_internal_review_proposal() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."snapshotVersion" IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE'
    OR OLD."status" <> 'PREPARED'
    OR NEW."status" <> 'CONFIRMED'
    OR NEW."consumedAt" IS NULL
    OR (to_jsonb(NEW) - ARRAY['status', 'consumedAt', 'updatedAt'])
       IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status', 'consumedAt', 'updatedAt']) THEN
    RAISE EXCEPTION 'IMMUTABLE_INTERNAL_REVIEW_PROPOSAL' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "AuditEvent_append_only"
  BEFORE UPDATE OR DELETE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION stridebrain_reject_immutable_change();

CREATE TRIGGER "Action_stage8_immutable"
  BEFORE UPDATE OR DELETE ON "Action"
  FOR EACH ROW EXECUTE FUNCTION stridebrain_guard_internal_review_action();

CREATE TRIGGER "ProposedAction_stage8_immutable"
  BEFORE UPDATE OR DELETE ON "ProposedAction"
  FOR EACH ROW EXECUTE FUNCTION stridebrain_guard_internal_review_proposal();

CREATE TRIGGER "InternalReviewReceipt_immutable"
  BEFORE UPDATE OR DELETE ON "InternalReviewReceipt"
  FOR EACH ROW EXECUTE FUNCTION stridebrain_reject_immutable_change();
