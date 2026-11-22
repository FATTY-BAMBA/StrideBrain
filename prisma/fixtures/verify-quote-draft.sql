DO $$
BEGIN
  IF (SELECT count(*) FROM "MembershipCapabilityGrant" WHERE "organizationId" = 'org_horizon'
      AND "capability" = 'quote:draft' AND "effect" = 'DENY'
      AND "membershipId" IN ('membership_horizon_viewer','membership_horizon_finance')) <> 2 THEN
    RAISE EXCEPTION 'Viewer and finance must explicitly deny quote drafting';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "EvidenceConflict" c JOIN "EvidenceReference" er ON er."id" = c."primaryEvidenceId"
    WHERE c."id" = 'conflict_quote_draft' AND c."status" = 'OPEN' AND er."subjectType" = 'QUOTE_ITEM'
    AND c."organizationId" = er."organizationId") THEN
    RAISE EXCEPTION 'A synthetic past quoted-price source must have an open conflict';
  END IF;
END $$;
