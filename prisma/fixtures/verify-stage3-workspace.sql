DO $$
DECLARE
  quote_current_count integer;
  quote_current_version integer;
  forecast_current_count integer;
  forecast_current_version integer;
  viewer_assignment_count integer;
  finance_assignment_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "Project"
    WHERE "id" = 'prj_xinyi_026'
      AND "organizationId" = 'org_horizon'
      AND "businessKey" = 'PRJ-XINYI-026'
      AND "deletedAt" IS NULL
  ) THEN
    RAISE EXCEPTION 'Stage 3 fixture requires the authorized Xinyi project';
  END IF;

  SELECT count(*), max(qv."versionNumber")
  INTO quote_current_count, quote_current_version
  FROM "QuoteVersion" qv
  JOIN "Quote" q ON q."id" = qv."quoteId"
  WHERE q."organizationId" = 'org_horizon'
    AND q."projectId" = 'prj_xinyi_026'
    AND qv."organizationId" = 'org_horizon'
    AND qv."supersededById" IS NULL
    AND qv."authorityState" <> 'SUPERSEDED';

  IF quote_current_count <> 1 OR quote_current_version <> 3 THEN
    RAISE EXCEPTION
      'Stage 3 expected exactly one current Xinyi quote at version 3; found count %, version %',
      quote_current_count,
      quote_current_version;
  END IF;

  SELECT count(*), max(fcv."versionNumber")
  INTO forecast_current_count, forecast_current_version
  FROM "ForecastCostVersion" fcv
  WHERE fcv."organizationId" = 'org_horizon'
    AND fcv."projectId" = 'prj_xinyi_026'
    AND fcv."supersededById" IS NULL
    AND fcv."authorityState" <> 'SUPERSEDED';

  IF forecast_current_count <> 1 OR forecast_current_version <> 1 THEN
    RAISE EXCEPTION
      'Stage 3 expected exactly one current Xinyi forecast at version 1; found count %, version %',
      forecast_current_count,
      forecast_current_version;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "ForecastCostVersion" fcv
    WHERE fcv."organizationId" = 'org_horizon'
      AND fcv."projectId" = 'prj_xinyi_026'
      AND fcv."versionNumber" = 1
      AND fcv."authorityState" = 'HUMAN_REVIEWED'
      AND fcv."observationType" = 'FORECAST_DIRECT_COST'
      AND fcv."currency" = 'TWD'
      AND fcv."totalDirectCost" = 12650000.00
  ) THEN
    RAISE EXCEPTION 'Stage 3 Xinyi forecast must preserve the canonical human-reviewed TWD 12,650,000 value';
  END IF;

  SELECT count(*)
  INTO viewer_assignment_count
  FROM "ProjectAssignment" pa
  WHERE pa."organizationId" = 'org_horizon'
    AND pa."projectId" = 'prj_xinyi_026'
    AND pa."membershipId" = 'membership_horizon_viewer'
    AND pa."canReadActuals" = false
    AND pa."canCreateAction" = false;

  IF viewer_assignment_count <> 1 THEN
    RAISE EXCEPTION 'Stage 3 Viewer assignment must deny actual-cost and action-write access';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "MembershipCapabilityGrant"
    WHERE "organizationId" = 'org_horizon'
      AND "membershipId" = 'membership_horizon_viewer'
      AND "capability" IN (
        'commercial:actual-read',
        'action:internal-review:propose',
        'action:internal-review:create',
        'action:assign'
      )
      AND "effect" <> 'DENY'
  ) THEN
    RAISE EXCEPTION 'Stage 3 Viewer fixture contains an unexpected commercial/action allow grant';
  END IF;

  SELECT count(*)
  INTO finance_assignment_count
  FROM "ProjectAssignment" pa
  WHERE pa."organizationId" = 'org_horizon'
    AND pa."projectId" = 'prj_xinyi_026'
    AND pa."membershipId" = 'membership_horizon_finance'
    AND pa."canReadActuals" = true
    AND pa."canCreateAction" = true;

  IF finance_assignment_count <> 1 THEN
    RAISE EXCEPTION 'Stage 3 Financial Reviewer must be explicitly assigned to Xinyi';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ProjectAssignment" pa
    JOIN "Project" p ON p."id" = pa."projectId"
    WHERE pa."organizationId" <> p."organizationId"
  ) THEN
    RAISE EXCEPTION 'Stage 3 fixture contains a cross-organization project assignment';
  END IF;
END
$$;
