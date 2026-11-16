BEGIN READ ONLY;
SELECT a."businessKey", a."status", cardinality(a."evidenceReferenceIds") AS evidence_references,
  a."evidenceSnapshot" IS NOT NULL AS has_evidence_snapshot,
  a."contentSnapshot" IS NOT NULL AS has_content_snapshot,
  p."status" AS proposal_status, p."consumedAt" IS NOT NULL AS proposal_consumed,
  (SELECT count(*) FROM "AuditEvent" au WHERE au."actionId" = a."id" AND au."organizationId" = a."organizationId" AND au."eventType" = 'INTERNAL_REVIEW_CREATED') AS success_audit_count,
  (SELECT count(*) FROM "InternalReviewReceipt" ir WHERE ir."actionId" = a."id" AND ir."organizationId" = a."organizationId" AND ir."projectId" = a."projectId" AND ir."proposedActionId" = a."proposedActionId" AND ir."comparisonRunId" = a."comparisonRunId" AND ir."enrichmentRunId" = a."enrichmentRunId" AND ir."actorMembershipId" = a."createdByMembershipId") AS matching_receipt_count
FROM "Action" a
JOIN "ProposedAction" p ON p."id" = a."proposedActionId" AND p."organizationId" = a."organizationId"
ORDER BY a."createdAt";
SELECT count(*) AS actions_without_receipt FROM "Action" a LEFT JOIN "InternalReviewReceipt" r ON r."actionId" = a."id" WHERE r."id" IS NULL;
SELECT count(*) AS receipts_without_action FROM "InternalReviewReceipt" r LEFT JOIN "Action" a ON a."id" = r."actionId" WHERE a."id" IS NULL;
COMMIT;
