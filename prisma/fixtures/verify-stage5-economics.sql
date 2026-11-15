-- Independently verify Stage 5 canonical economics from stored fixture facts.

DO $$
DECLARE
  quote_variance numeric;
  actual_variance numeric;
  stone_variance numeric;
  lighting_quote_variance numeric;
  lighting_actual_count integer;
  stale_offer_count integer;
  forecast_line_count integer;
  forecast_evidence_count integer;
  programme_evidence_count integer;
BEGIN
  WITH selected(project_id) AS (
    VALUES ('prj_neihu_021'), ('prj_zhongshan_018'), ('prj_nanjing_023')
  ),
  rates AS (
    SELECT qv."amountBeforeTax" / p."areaQuantity" AS rate
    FROM "QuoteVersion" qv
    JOIN "Quote" q ON q."id" = qv."quoteId"
    JOIN "Project" p ON p."id" = q."projectId"
    JOIN selected s ON s.project_id = p."id"
    WHERE qv."organizationId" = 'org_horizon'
      AND qv."observationType" = 'QUOTED_PRICE'
      AND qv."authorityState" = 'APPROVED_COMMERCIAL'
      AND qv."supersededById" IS NULL
  ),
  baseline AS (
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY rate) AS median_rate
    FROM rates
  ),
  current_value AS (
    SELECT qv."amountBeforeTax" / p."areaQuantity" AS current_rate
    FROM "QuoteVersion" qv
    JOIN "Quote" q ON q."id" = qv."quoteId"
    JOIN "Project" p ON p."id" = q."projectId"
    WHERE qv."id" = 'qv_xinyi_026_v3'
  )
  SELECT ((c.current_rate - b.median_rate) / b.median_rate) * 100
  INTO quote_variance
  FROM current_value c CROSS JOIN baseline b;

  WITH selected(project_id) AS (
    VALUES ('prj_neihu_021'), ('prj_zhongshan_018'), ('prj_nanjing_023')
  ),
  rates AS (
    SELECT pcv."totalDirectCost" / p."areaQuantity" AS rate
    FROM "ProjectCostVersion" pcv
    JOIN "Project" p ON p."id" = pcv."projectId"
    JOIN selected s ON s.project_id = p."id"
    WHERE pcv."organizationId" = 'org_horizon'
      AND pcv."observationType" = 'RECONCILED_ACTUAL_COST'
      AND pcv."authorityState" = 'RECONCILED_ACTUAL'
      AND pcv."supersededById" IS NULL
  ),
  baseline AS (
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY rate) AS median_rate
    FROM rates
  ),
  current_value AS (
    SELECT fcv."totalDirectCost" / p."areaQuantity" AS current_rate
    FROM "ForecastCostVersion" fcv
    JOIN "Project" p ON p."id" = fcv."projectId"
    WHERE fcv."id" = 'fcv_xinyi_026_v1'
  )
  SELECT ((c.current_rate - b.median_rate) / b.median_rate) * 100
  INTO actual_variance
  FROM current_value c CROSS JOIN baseline b;

  WITH selected(project_id) AS (
    VALUES ('prj_neihu_021'), ('prj_zhongshan_018'), ('prj_nanjing_023')
  ),
  rates AS (
    SELECT cl."amount" / p."areaQuantity" AS rate
    FROM "CostLine" cl
    JOIN "ProjectCostVersion" pcv ON pcv."id" = cl."projectCostVersionId"
    JOIN "Project" p ON p."id" = pcv."projectId"
    JOIN selected s ON s.project_id = p."id"
    WHERE cl."organizationId" = 'org_horizon'
      AND cl."categoryId" = 'IMPORTED_STONE'
      AND cl."authorityState" = 'RECONCILED_ACTUAL'
      AND pcv."authorityState" = 'RECONCILED_ACTUAL'
      AND pcv."supersededById" IS NULL
  ),
  baseline AS (
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY rate) AS median_rate
    FROM rates
  ),
  current_value AS (
    SELECT fcl."amount" / p."areaQuantity" AS current_rate
    FROM "ForecastCostLine" fcl
    JOIN "ForecastCostVersion" fcv ON fcv."id" = fcl."forecastCostVersionId"
    JOIN "Project" p ON p."id" = fcv."projectId"
    WHERE fcv."id" = 'fcv_xinyi_026_v1'
      AND fcl."categoryId" = 'IMPORTED_STONE'
  )
  SELECT ((c.current_rate - b.median_rate) / b.median_rate) * 100
  INTO stone_variance
  FROM current_value c CROSS JOIN baseline b;

  WITH selected(project_id) AS (
    VALUES ('prj_neihu_021'), ('prj_zhongshan_018'), ('prj_nanjing_023')
  ),
  rates AS (
    SELECT qi."amount" / p."areaQuantity" AS rate
    FROM "QuoteItem" qi
    JOIN "QuoteVersion" qv ON qv."id" = qi."quoteVersionId"
    JOIN "Quote" q ON q."id" = qv."quoteId"
    JOIN "Project" p ON p."id" = q."projectId"
    JOIN selected s ON s.project_id = p."id"
    WHERE qi."organizationId" = 'org_horizon'
      AND qi."categoryId" = 'LIGHTING_ELECTRICAL'
      AND qv."authorityState" = 'APPROVED_COMMERCIAL'
      AND qv."supersededById" IS NULL
  ),
  baseline AS (
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY rate) AS median_rate
    FROM rates
  ),
  current_value AS (
    SELECT qi."amount" / p."areaQuantity" AS current_rate
    FROM "QuoteItem" qi
    JOIN "QuoteVersion" qv ON qv."id" = qi."quoteVersionId"
    JOIN "Quote" q ON q."id" = qv."quoteId"
    JOIN "Project" p ON p."id" = q."projectId"
    WHERE qv."id" = 'qv_xinyi_026_v3'
      AND qi."categoryId" = 'LIGHTING_ELECTRICAL'
  )
  SELECT ((c.current_rate - b.median_rate) / b.median_rate) * 100
  INTO lighting_quote_variance
  FROM current_value c CROSS JOIN baseline b;

  SELECT count(*)
  INTO lighting_actual_count
  FROM "CostLine" cl
  JOIN "ProjectCostVersion" pcv ON pcv."id" = cl."projectCostVersionId"
  WHERE pcv."projectId" IN ('prj_neihu_021', 'prj_zhongshan_018', 'prj_nanjing_023')
    AND cl."categoryId" = 'LIGHTING_ELECTRICAL'
    AND cl."authorityState" = 'RECONCILED_ACTUAL'
    AND pcv."authorityState" = 'RECONCILED_ACTUAL'
    AND pcv."supersededById" IS NULL;

  SELECT count(*)
  INTO stale_offer_count
  FROM "SupplierOffer"
  WHERE "organizationId" = 'org_horizon'
    AND "validUntil" < DATE '2026-11-14';

  SELECT count(*)
  INTO forecast_line_count
  FROM "ForecastCostLine"
  WHERE "organizationId" = 'org_horizon'
    AND "forecastCostVersionId" = 'fcv_xinyi_026_v1';

  SELECT count(*)
  INTO forecast_evidence_count
  FROM "EvidenceReference"
  WHERE "organizationId" = 'org_horizon'
    AND "subjectType" = 'FORECAST_COST_LINE'
    AND "subjectId" IN (
      SELECT "id" FROM "ForecastCostLine"
      WHERE "forecastCostVersionId" = 'fcv_xinyi_026_v1'
    );

  SELECT count(*)
  INTO programme_evidence_count
  FROM "EvidenceReference"
  WHERE "organizationId" = 'org_horizon'
    AND "subjectType" = 'PROJECT'
    AND "claimKey" = 'project:programmeWeeks'
    AND "subjectId" IN (
      'prj_xinyi_026',
      'prj_neihu_021',
      'prj_zhongshan_018',
      'prj_nanjing_023'
    );

  IF quote_variance NOT BETWEEN 7.16 AND 7.18 THEN
    RAISE EXCEPTION 'Stage 5 quote variance mismatch: %', quote_variance;
  END IF;
  IF actual_variance NOT BETWEEN 6.04 AND 6.06 THEN
    RAISE EXCEPTION 'Stage 5 actual variance mismatch: %', actual_variance;
  END IF;
  IF stone_variance NOT BETWEEN 18.37 AND 18.40 THEN
    RAISE EXCEPTION 'Stage 5 stone variance mismatch: %', stone_variance;
  END IF;
  IF lighting_quote_variance NOT BETWEEN 9.42 AND 9.45 THEN
    RAISE EXCEPTION 'Stage 5 lighting quote variance mismatch: %', lighting_quote_variance;
  END IF;
  IF lighting_actual_count <> 2 THEN
    RAISE EXCEPTION 'Stage 5 lighting actual evidence must abstain at 2/3, found %', lighting_actual_count;
  END IF;
  IF stale_offer_count < 1 THEN
    RAISE EXCEPTION 'Stage 5 stale supplier-offer fixture missing';
  END IF;
  IF forecast_evidence_count <> forecast_line_count THEN
    RAISE EXCEPTION 'Stage 5 forecast evidence mismatch: % of %', forecast_evidence_count, forecast_line_count;
  END IF;
  IF programme_evidence_count <> 4 THEN
    RAISE EXCEPTION 'Stage 5 programme evidence mismatch: %', programme_evidence_count;
  END IF;
  IF to_regclass('"EconomicsEnrichmentRun"') IS NULL
     OR to_regclass('"EconomicsObservationDecision"') IS NULL THEN
    RAISE EXCEPTION 'Stage 5 persistence tables missing';
  END IF;
END $$;
