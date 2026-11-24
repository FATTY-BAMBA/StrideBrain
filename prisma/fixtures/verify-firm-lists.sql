DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM "Project" p LEFT JOIN "FirmJobType" t
      ON t."organizationId"=p."organizationId" AND t."key"=p."subtype"
    WHERE t."id" IS NULL
  ) THEN RAISE EXCEPTION 'FIRM_JOB_TYPE_BACKFILL_REQUIRED'; END IF;
  IF EXISTS (
    SELECT 1 FROM "ProjectScope" s LEFT JOIN "FirmWorkCategory" c
      ON c."organizationId"=s."organizationId" AND c."key"=s."categoryId"
    WHERE c."id" IS NULL
  ) THEN RAISE EXCEPTION 'FIRM_SCOPE_BACKFILL_REQUIRED'; END IF;
  IF EXISTS (
    SELECT 1 FROM "QuoteItem" q LEFT JOIN "FirmQuoteUnit" u
      ON u."organizationId"=q."organizationId" AND u."key"=q."unit"
    WHERE u."id" IS NULL
  ) THEN RAISE EXCEPTION 'FIRM_UNIT_BACKFILL_REQUIRED'; END IF;
  IF (SELECT count(*) FROM "FirmJobType" WHERE "organizationId"='org_horizon' AND "active") <> 4
    THEN RAISE EXCEPTION 'FIRM_JOB_TYPES_CHANGED'; END IF;
  IF (SELECT count(*) FROM "FirmJobTypeRelation" WHERE "organizationId"='org_horizon') <> 8
    THEN RAISE EXCEPTION 'FIRM_RELATED_TYPES_CHANGED'; END IF;
  IF (SELECT count(*) FROM "FirmWorkCategory" c JOIN "FirmWorkCategory" parent
    ON parent."id"=c."pricedUnderId" AND parent."organizationId"=c."organizationId"
    WHERE c."organizationId"='org_horizon' AND c."key" IN ('SELECTIVE_DEMOLITION','PARTITIONS_CEILINGS')
      AND parent."key"='DEMOLITION_CEILING') <> 2
    THEN RAISE EXCEPTION 'FIRM_PRICING_MAP_CHANGED'; END IF;
  IF EXISTS (SELECT 1 FROM "Organization" WHERE "areaDisplayUnit" <> 'm2')
    THEN RAISE EXCEPTION 'FIXTURE_AREA_UNIT_CHANGED'; END IF;
END $$;
