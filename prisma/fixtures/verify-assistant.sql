DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Organization" WHERE "id" = 'org_horizon' AND "assistantEnabled") THEN RAISE EXCEPTION 'Sample assistant preference missing'; END IF;
  IF EXISTS (SELECT 1 FROM "AssistantUsage" u LEFT JOIN "Membership" m ON m."id" = u."membershipId" AND m."organizationId" = u."organizationId" WHERE m."id" IS NULL) THEN RAISE EXCEPTION 'Assistant usage tenant mismatch'; END IF;
END $$;
