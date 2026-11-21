-- Read-only migration checks; SB-041's integration tests create synthetic jobs
-- through the application and verify the transaction, rather than seeding them.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Project'
      AND column_name = 'commercialCategoryIds' AND is_nullable = 'NO'
      AND data_type = 'ARRAY' AND column_default IS NOT NULL
  ) THEN RAISE EXCEPTION 'Project comparison categories must have a non-null default'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'AuditEvent'
      AND indexname = 'AuditEvent_organizationId_idempotencyKey_key'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ) THEN RAISE EXCEPTION 'Tenant-scoped audit idempotency constraint is missing'; END IF;
END $$;
