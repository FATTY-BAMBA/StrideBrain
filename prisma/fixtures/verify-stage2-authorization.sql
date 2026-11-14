DO $$
DECLARE
  value_count integer;
  relation_mismatches integer;
BEGIN
  SELECT count(*) INTO value_count
  FROM "MembershipCapabilityGrant"
  WHERE "organizationId" = 'org_horizon';
  IF value_count <> 5 THEN
    RAISE EXCEPTION 'Expected five Horizon explicit capability grants, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM "MembershipCapabilityGrant"
  WHERE "membershipId" = 'membership_horizon_mei'
    AND "capability" = 'commercial:actual-read'
    AND "effect" = 'ALLOW';
  IF value_count <> 1 THEN
    RAISE EXCEPTION 'Mei must have one explicit actual-read ALLOW grant';
  END IF;

  SELECT count(*) INTO value_count
  FROM "MembershipCapabilityGrant"
  WHERE "membershipId" = 'membership_horizon_viewer'
    AND "effect" = 'DENY'
    AND "capability" IN (
      'commercial:actual-read',
      'action:internal-review:propose',
      'action:internal-review:create',
      'action:assign'
    );
  IF value_count <> 4 THEN
    RAISE EXCEPTION 'Viewer must have explicit DENY grants for actual costs and action writes';
  END IF;

  SELECT count(*) INTO value_count
  FROM "ProjectAssignment"
  WHERE "membershipId" = 'membership_horizon_finance'
    AND "organizationId" = 'org_horizon';
  IF value_count <> 29 THEN
    RAISE EXCEPTION 'Financial Reviewer must be assigned to all 29 Horizon projects, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM "DemoSession"
  WHERE "organizationId" = 'org_horizon';
  IF value_count <> 2 THEN
    RAISE EXCEPTION 'Expected two deliberately invalid fixture sessions, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM "DemoSession"
  WHERE "id" = 'fixture_expired_session'
    AND "expiresAt" < TIMESTAMP '2026-11-14 00:00:00'
    AND "revokedAt" IS NULL;
  IF value_count <> 1 THEN
    RAISE EXCEPTION 'Expected one expired fixture session';
  END IF;

  SELECT count(*) INTO value_count
  FROM "DemoSession"
  WHERE "id" = 'fixture_revoked_session'
    AND "revokedAt" IS NOT NULL
    AND "expiresAt" > "revokedAt";
  IF value_count <> 1 THEN
    RAISE EXCEPTION 'Expected one revoked fixture session';
  END IF;

  SELECT count(*) INTO value_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'DemoSession'
    AND lower(column_name) IN ('token', 'rawtoken', 'secret', 'credential');
  IF value_count <> 0 THEN
    RAISE EXCEPTION 'DemoSession must not persist raw token or credential columns';
  END IF;

  SELECT count(*) INTO value_count
  FROM "DemoSession"
  WHERE "tokenHash" !~ '^[0-9a-f]{64}$';
  IF value_count <> 0 THEN
    RAISE EXCEPTION 'All stored session credentials must be SHA-256 hashes';
  END IF;

  SELECT count(*) INTO value_count
  FROM pg_constraint
  WHERE conname IN (
    'MembershipCapabilityGrant_capability_check',
    'DemoSession_tokenHash_check',
    'DemoSession_locale_check',
    'DemoSession_expiry_check',
    'DemoSession_revocation_check'
  );
  IF value_count <> 5 THEN
    RAISE EXCEPTION 'Expected five Stage 2 database constraints, found %', value_count;
  END IF;

  BEGIN
    INSERT INTO "MembershipCapabilityGrant" (
      "id", "organizationId", "membershipId", "capability", "effect", "createdAt", "updatedAt"
    ) VALUES (
      'verify_invalid_capability', 'org_horizon', 'membership_horizon_mei',
      'browser:choose-role', 'ALLOW', NOW(), NOW()
    );
    RAISE EXCEPTION 'Database accepted an unrecognized capability';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO "DemoSession" (
      "id", "organizationId", "membershipId", "tokenHash", "preferredLocale",
      "issuedAt", "expiresAt"
    ) VALUES (
      'verify_raw_token', 'org_horizon', 'membership_horizon_mei', 'raw-secret-token',
      'zh-TW', NOW(), NOW() + INTERVAL '1 hour'
    );
    RAISE EXCEPTION 'Database accepted a raw/non-hash session credential';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  SELECT count(*) INTO relation_mismatches FROM (
    SELECT grant_row."id"
    FROM "MembershipCapabilityGrant" grant_row
    JOIN "Membership" m ON m."id" = grant_row."membershipId"
    WHERE grant_row."organizationId" <> m."organizationId"

    UNION ALL

    SELECT session_row."id"
    FROM "DemoSession" session_row
    JOIN "Membership" m ON m."id" = session_row."membershipId"
    WHERE session_row."organizationId" <> m."organizationId"
  ) mismatches;

  IF relation_mismatches <> 0 THEN
    RAISE EXCEPTION 'Cross-organization Stage 2 authorization relations found: %', relation_mismatches;
  END IF;

  RAISE NOTICE 'Stage 2 authorization fixture verified: explicit grants, bounded assignments, and hash-only invalid sessions are valid.';
END $$;
