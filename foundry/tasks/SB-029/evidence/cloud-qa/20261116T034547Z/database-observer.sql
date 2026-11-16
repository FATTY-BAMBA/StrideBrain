BEGIN READ ONLY;
SELECT current_database() AS database, current_setting('server_version') AS postgres_version;
SELECT "businessKey", "dataClassification" FROM "Organization" ORDER BY "businessKey";
SELECT count(*) AS applied_migrations FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;
SELECT 'Action' AS entity, count(*) FROM "Action"
UNION ALL SELECT 'ProposedAction', count(*) FROM "ProposedAction"
UNION ALL SELECT 'InternalReviewReceipt', count(*) FROM "InternalReviewReceipt"
UNION ALL SELECT 'AuditEvent', count(*) FROM "AuditEvent"
UNION ALL SELECT 'ConsumedProposal', count(*) FROM "ProposedAction" WHERE "status" = 'CONFIRMED'
UNION ALL SELECT 'ActionWithEvidenceSnapshot', count(*) FROM "Action" WHERE "evidenceSnapshot" IS NOT NULL;
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname IN ('AuditEvent_append_only', 'Action_stage8_immutable', 'ProposedAction_stage8_immutable', 'InternalReviewReceipt_immutable') ORDER BY tgname;
COMMIT;
