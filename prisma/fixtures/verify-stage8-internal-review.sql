-- Stage 8 SQL invariant verification. This checks the live database, not
-- migration text, and leaves no fabricated Action or successful receipt.
DO $$
DECLARE
  missing_count integer;
  bad_count integer;
BEGIN
  SELECT count(*) INTO missing_count
  FROM (VALUES
    ('ProposedAction', 'ProposedAction_stage8_complete_check', 'c'),
    ('Action', 'Action_stage8_complete_check', 'c'),
    ('InternalReviewReceipt', 'InternalReviewReceipt_key_check', 'c'),
    ('InternalReviewReceipt', 'InternalReviewReceipt_payload_check', 'c'),
    ('ComparisonRun', 'ComparisonRun_project_tenant_fkey', 'f'),
    ('EconomicsEnrichmentRun', 'EconomicsEnrichmentRun_comparison_scope_fkey', 'f'),
    ('ProposedAction', 'ProposedAction_comparison_scope_fkey', 'f'),
    ('Action', 'Action_comparison_scope_fkey', 'f'),
    ('Action', 'Action_proposal_lineage_fkey', 'f'),
    ('InternalReviewReceipt', 'InternalReviewReceipt_action_lineage_fkey', 'f'),
    ('AuditEvent', 'AuditEvent_actor_tenant_fkey', 'f'),
    ('AuditEvent', 'AuditEvent_comparison_tenant_fkey', 'f'),
    ('AuditEvent', 'AuditEvent_proposal_tenant_fkey', 'f'),
    ('AuditEvent', 'AuditEvent_action_tenant_fkey', 'f')
  ) AS required(table_name, constraint_name, constraint_type)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = required.table_name
      AND c.conname = required.constraint_name
      AND c.contype::text = required.constraint_type
      AND c.convalidated
  );
  IF missing_count <> 0 THEN RAISE EXCEPTION 'STAGE8_REQUIRED_CONSTRAINT_MISSING'; END IF;

  SELECT count(*) INTO missing_count
  FROM (VALUES
    ('ProposedAction_business_key'),
    ('ProposedAction_preparation_key'),
    ('Action_business_key'),
    ('Action_proposal_once_key'),
    ('InternalReviewReceipt_idempotency_key'),
    ('InternalReviewReceipt_proposal_key'),
    ('InternalReviewReceipt_action_key')
  ) AS required(index_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = current_schema() AND c.relname = required.index_name
      AND i.indisunique AND i.indisvalid AND i.indisready
  );
  IF missing_count <> 0 THEN RAISE EXCEPTION 'STAGE8_REQUIRED_UNIQUENESS_MISSING'; END IF;

  SELECT count(*) INTO missing_count
  FROM (VALUES
    ('AuditEvent', 'AuditEvent_append_only'),
    ('Action', 'Action_stage8_immutable'),
    ('ProposedAction', 'ProposedAction_stage8_immutable'),
    ('InternalReviewReceipt', 'InternalReviewReceipt_immutable')
  ) AS required(table_name, trigger_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger g
    JOIN pg_class c ON c.oid = g.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = current_schema() AND c.relname = required.table_name
      AND g.tgname = required.trigger_name AND g.tgenabled = 'O' AND NOT g.tgisinternal
  );
  IF missing_count <> 0 THEN RAISE EXCEPTION 'STAGE8_IMMUTABILITY_TRIGGER_DISABLED'; END IF;

  SELECT count(*) INTO bad_count
  FROM "Action" a
  LEFT JOIN "ProposedAction" p ON p."id" = a."proposedActionId"
  LEFT JOIN "InternalReviewReceipt" r ON r."actionId" = a."id" AND r."organizationId" = a."organizationId"
  WHERE a."snapshotVersion" = 'internal-review-action-snapshot.v1'
    AND (p."id" IS NULL OR p."status" <> 'CONFIRMED' OR p."consumedAt" IS NULL
      OR p."organizationId" <> a."organizationId" OR p."projectId" <> a."projectId"
      OR p."comparisonRunId" <> a."comparisonRunId"
      OR p."enrichmentRunId" IS DISTINCT FROM a."enrichmentRunId"
      OR p."preparedByMembershipId" IS DISTINCT FROM a."createdByMembershipId"
      OR r."id" IS NULL
      OR r."proposedActionId" <> p."id"
      OR r."idempotencyKey" IS DISTINCT FROM p."confirmationKey"
      OR (SELECT count(*) FROM "AuditEvent" e
          WHERE e."organizationId" = a."organizationId" AND e."actionId" = a."id"
            AND e."proposedActionId" = p."id" AND e."comparisonRunId" = a."comparisonRunId"
            AND e."actorMembershipId" = a."createdByMembershipId"
            AND e."eventType" = 'INTERNAL_REVIEW_CREATED' AND e."result" = 'SUCCESS') <> 1);
  IF bad_count <> 0 THEN RAISE EXCEPTION 'STAGE8_ATOMIC_LINEAGE_INVARIANT_FAILED'; END IF;

  SELECT count(*) INTO bad_count
  FROM "ProposedAction" p
  WHERE p."snapshotVersion" = 'internal-review-proposal-snapshot.v1'
    AND p."status" = 'CONFIRMED'
    AND (SELECT count(*) FROM "Action" a
         WHERE a."organizationId" = p."organizationId" AND a."proposedActionId" = p."id") <> 1;
  IF bad_count <> 0 THEN RAISE EXCEPTION 'STAGE8_CONSUMPTION_INVARIANT_FAILED'; END IF;
END $$;

-- Exercise the append-only trigger on an operator probe inside a subtransaction.
-- The deliberate final exception rolls the probe back; no row remains.
DO $$
DECLARE
  probe_id text := 'sb029_audit_probe_' || md5(clock_timestamp()::text);
BEGIN
  BEGIN
    INSERT INTO "AuditEvent" ("id", "organizationId", "eventType", "requestId", "payload", "result")
    VALUES (probe_id, 'org_horizon', 'SCHEMA_INVARIANT_PROBE', probe_id, '{}'::jsonb, 'PROBE');
    BEGIN
      UPDATE "AuditEvent" SET "result" = 'MUTATED' WHERE "id" = probe_id;
      RAISE EXCEPTION 'STAGE8_AUDIT_UPDATE_WAS_ALLOWED';
    EXCEPTION WHEN check_violation THEN
      IF SQLERRM <> 'IMMUTABLE_RECORD' THEN RAISE; END IF;
    END;
    BEGIN
      DELETE FROM "AuditEvent" WHERE "id" = probe_id;
      RAISE EXCEPTION 'STAGE8_AUDIT_DELETE_WAS_ALLOWED';
    EXCEPTION WHEN check_violation THEN
      IF SQLERRM <> 'IMMUTABLE_RECORD' THEN RAISE; END IF;
    END;
    RAISE EXCEPTION 'SB029_PROBE_ROLLBACK' USING ERRCODE = 'P0002';
  EXCEPTION WHEN no_data_found THEN
    IF SQLERRM <> 'SB029_PROBE_ROLLBACK' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM "AuditEvent" WHERE "id" = probe_id) THEN
    RAISE EXCEPTION 'STAGE8_AUDIT_PROBE_NOT_ROLLED_BACK';
  END IF;
END $$;
