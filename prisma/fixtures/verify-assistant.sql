DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "AssistantTurnTiming" t LEFT JOIN "Membership" m ON m.id=t."membershipId" AND m."organizationId"=t."organizationId" WHERE m.id IS NULL OR t."serverDurationMs" < 0 OR t."completedAt" < t."startedAt") THEN RAISE EXCEPTION 'Assistant timing tenant or duration mismatch'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "Organization" WHERE "id" = 'org_horizon' AND "assistantEnabled") THEN RAISE EXCEPTION 'Sample assistant preference missing'; END IF;
  IF EXISTS (SELECT 1 FROM "AssistantUsage" u LEFT JOIN "Membership" m ON m."id" = u."membershipId" AND m."organizationId" = u."organizationId" WHERE m."id" IS NULL) THEN RAISE EXCEPTION 'Assistant usage tenant mismatch'; END IF;
END $$;
