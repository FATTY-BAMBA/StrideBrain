DO $$
DECLARE
  value_count integer;
  combined_lines integer;
  mismatches integer;
  actual_value numeric;
BEGIN
  SELECT count(*) INTO value_count
  FROM "Project"
  WHERE "organizationId" = 'org_horizon' AND "status" IN ('COMPLETED', 'CLOSED');
  IF value_count <> 24 THEN
    RAISE EXCEPTION 'Expected 24 completed Horizon projects, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM "Project"
  WHERE "organizationId" = 'org_horizon' AND "status" = 'ACTIVE';
  IF value_count <> 5 THEN
    RAISE EXCEPTION 'Expected 5 active Horizon projects, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM "Membership"
  WHERE "organizationId" = 'org_horizon' AND "active" = true;
  IF value_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 active Horizon memberships, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM "Supplier"
  WHERE "organizationId" = 'org_horizon';
  IF value_count < 18 OR value_count > 24 THEN
    RAISE EXCEPTION 'Expected 18-24 suppliers, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM "QuoteVersion"
  WHERE "organizationId" = 'org_horizon';
  IF value_count < 40 THEN
    RAISE EXCEPTION 'Expected at least 40 quote versions, found %', value_count;
  END IF;

  SELECT (SELECT count(*) FROM "QuoteItem" WHERE "organizationId" = 'org_horizon')
       + (SELECT count(*) FROM "CostLine" WHERE "organizationId" = 'org_horizon')
  INTO combined_lines;
  IF combined_lines < 300 OR combined_lines > 500 THEN
    RAISE EXCEPTION 'Expected 300-500 quote + actual cost lines, found %', combined_lines;
  END IF;

  SELECT count(*) INTO value_count
  FROM "EvidenceReference"
  WHERE "organizationId" = 'org_horizon';
  IF value_count < 100 THEN
    RAISE EXCEPTION 'Expected at least 100 evidence references, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM pg_constraint
  WHERE conname IN (
    'QuoteVersion_observationType_check',
    'QuoteVersion_authorityState_check',
    'QuoteVersion_supersession_check',
    'QuoteVersion_not_self_superseded_check',
    'QuoteVersion_amounts_check',
    'ForecastCostVersion_observationType_check',
    'ForecastCostVersion_authorityState_check',
    'ForecastCostVersion_supersession_check',
    'ForecastCostVersion_not_self_superseded_check',
    'ForecastCostVersion_amount_check',
    'ProjectCostVersion_observationType_check',
    'ProjectCostVersion_supersession_check',
    'ProjectCostVersion_not_self_superseded_check',
    'ProjectCostVersion_amount_check',
    'ProjectCostVersion_reconciledAt_check',
    'SupplierOffer_observationType_check',
    'SupplierOffer_authorityState_check',
    'SupplierOffer_amount_check',
    'SupplierOffer_validity_check',
    'DocumentVersion_supersession_check',
    'DocumentVersion_not_self_superseded_check',
    'Project_areaQuantity_check',
    'Project_programmeWeeks_check',
    'Project_completedAt_check',
    'QuoteItem_amount_check',
    'ForecastCostLine_amount_check',
    'CostLine_amount_check',
    'SupplierOfferItem_amount_check',
    'ComparisonCandidate_score_check',
    'ComparisonCandidate_evidenceCoverage_check',
    'ComparisonCandidate_rank_check',
    'ComparisonFactor_weight_check',
    'ComparisonFactor_normalizedValue_check',
    'ComparisonFactor_contribution_check'
  );
  IF value_count <> 34 THEN
    RAISE EXCEPTION 'Expected 34 Stage 1 authority/financial constraints, found %', value_count;
  END IF;

  BEGIN
    INSERT INTO "QuoteVersion" (
      "id", "organizationId", "quoteId", "versionNumber", "status", "observationType",
      "authorityState", "currency", "amountBeforeTax", "taxAmount", "totalAmount", "createdAt"
    ) VALUES (
      'verify_invalid_quote_type', 'org_horizon', 'quote_prj_xinyi_026', 999, 'VERIFY',
      'RECONCILED_ACTUAL_COST', 'HUMAN_REVIEWED', 'TWD', 1.00, 0.05, 1.05, NOW()
    );
    RAISE EXCEPTION 'QuoteVersion accepted a non-quoted observation type';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO "ProjectCostVersion" (
      "id", "organizationId", "projectId", "versionNumber", "authorityState",
      "observationType", "currency", "totalDirectCost", "createdAt"
    ) VALUES (
      'verify_invalid_actual_type', 'org_horizon', 'prj_neihu_021', 999,
      'HUMAN_REVIEWED', 'FORECAST_DIRECT_COST', 'TWD', 1.00, NOW()
    );
    RAISE EXCEPTION 'ProjectCostVersion accepted a non-actual observation type';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO "QuoteItem" (
      "id", "organizationId", "quoteVersionId", "lineNumber", "categoryId",
      "descriptionEn", "descriptionZhTw", "quantity", "unit", "unitPrice", "amount",
      "authorityState", "createdAt"
    ) VALUES (
      'verify_invalid_quote_line', 'org_horizon', 'qv_xinyi_026_v3', 999,
      'VERIFY', 'Invalid line', '無效測試列', 2.000, 'unit', 10.000000, 19.99,
      'HUMAN_REVIEWED', NOW()
    );
    RAISE EXCEPTION 'QuoteItem accepted an unreconciled line amount';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  SELECT "amountBeforeTax" INTO actual_value
  FROM "QuoteVersion"
  WHERE "id" = 'qv_xinyi_026_v3';
  IF actual_value IS DISTINCT FROM 16480000.00 THEN
    RAISE EXCEPTION 'Unexpected Xinyi quote v3 amount: %', actual_value;
  END IF;

  SELECT "totalDirectCost" INTO actual_value
  FROM "ForecastCostVersion"
  WHERE "id" = 'fcv_xinyi_026_v1';
  IF actual_value IS DISTINCT FROM 12650000.00 THEN
    RAISE EXCEPTION 'Unexpected Xinyi forecast direct cost: %', actual_value;
  END IF;

  SELECT count(*) INTO value_count
  FROM "CostLine" cl
  JOIN "ProjectCostVersion" pcv ON pcv."id" = cl."projectCostVersionId"
  JOIN "Project" p ON p."id" = pcv."projectId"
  WHERE p."businessKey" IN (
    'PRJ-NEIHU-021','PRJ-ZHONGSHAN-018','PRJ-NANJING-023',
    'PRJ-DAAN-016','PRJ-SONGSHAN-020','PRJ-BANQIAO-015'
  )
    AND pcv."authorityState" = 'RECONCILED_ACTUAL'
    AND cl."authorityState" = 'RECONCILED_ACTUAL'
    AND cl."categoryId" = 'LIGHTING_ELECTRICAL';
  IF value_count <> 2 THEN
    RAISE EXCEPTION 'Lighting must have exactly two eligible actual observations, found %', value_count;
  END IF;

  SELECT count(*) INTO value_count
  FROM "SupplierOffer"
  WHERE "id" = 'offer_stone_2025_041'
    AND "validUntil" < DATE '2026-11-14';
  IF value_count <> 1 THEN
    RAISE EXCEPTION 'Expected the canonical stale supplier offer';
  END IF;

  SELECT count(*) INTO value_count
  FROM "EvidenceConflict"
  WHERE "organizationId" = 'org_horizon' AND "status" = 'OPEN';
  IF value_count < 1 THEN
    RAISE EXCEPTION 'Expected at least one open evidence conflict';
  END IF;

  SELECT count(*) INTO value_count
  FROM "Project"
  WHERE "organizationId" = 'org_northern' AND "businessKey" = 'PRJ-NORTH-001';
  IF value_count <> 1 THEN
    RAISE EXCEPTION 'Expected one inaccessible separate-organization project';
  END IF;

  SELECT count(*) INTO mismatches FROM (
    SELECT p."id"
    FROM "Project" p
    JOIN "Client" c ON c."id" = p."clientId"
    WHERE p."organizationId" <> c."organizationId"

    UNION ALL

    SELECT pa."id"
    FROM "ProjectAssignment" pa
    JOIN "Project" p ON p."id" = pa."projectId"
    JOIN "Membership" m ON m."id" = pa."membershipId"
    WHERE pa."organizationId" <> p."organizationId"
       OR pa."organizationId" <> m."organizationId"

    UNION ALL

    SELECT q."id"
    FROM "Quote" q
    JOIN "Project" p ON p."id" = q."projectId"
    WHERE q."organizationId" <> p."organizationId"

    UNION ALL

    SELECT qv."id"
    FROM "QuoteVersion" qv
    JOIN "Quote" q ON q."id" = qv."quoteId"
    WHERE qv."organizationId" <> q."organizationId"

    UNION ALL

    SELECT qi."id"
    FROM "QuoteItem" qi
    JOIN "QuoteVersion" qv ON qv."id" = qi."quoteVersionId"
    WHERE qi."organizationId" <> qv."organizationId"

    UNION ALL

    SELECT pcv."id"
    FROM "ProjectCostVersion" pcv
    JOIN "Project" p ON p."id" = pcv."projectId"
    WHERE pcv."organizationId" <> p."organizationId"

    UNION ALL

    SELECT cl."id"
    FROM "CostLine" cl
    JOIN "ProjectCostVersion" pcv ON pcv."id" = cl."projectCostVersionId"
    WHERE cl."organizationId" <> pcv."organizationId"

    UNION ALL

    SELECT er."id"
    FROM "EvidenceReference" er
    LEFT JOIN "DocumentVersion" dv ON dv."id" = er."documentVersionId"
    WHERE er."documentVersionId" IS NOT NULL
      AND er."organizationId" <> dv."organizationId"
  ) cross_org;
  IF mismatches <> 0 THEN
    RAISE EXCEPTION 'Cross-organization relationship mismatches found: %', mismatches;
  END IF;

  SELECT count(*) INTO mismatches
  FROM "QuoteVersion" qv
  JOIN (
    SELECT "quoteVersionId", round(sum("amount"), 2) AS item_total
    FROM "QuoteItem"
    GROUP BY "quoteVersionId"
  ) totals ON totals."quoteVersionId" = qv."id"
  WHERE abs(totals.item_total - qv."amountBeforeTax") > 0.01;
  IF mismatches <> 0 THEN
    RAISE EXCEPTION 'Quote line reconciliation failures: %', mismatches;
  END IF;

  SELECT count(*) INTO mismatches
  FROM "ProjectCostVersion" pcv
  JOIN (
    SELECT "projectCostVersionId", round(sum("amount"), 2) AS line_total
    FROM "CostLine"
    GROUP BY "projectCostVersionId"
  ) totals ON totals."projectCostVersionId" = pcv."id"
  WHERE pcv."authorityState" = 'RECONCILED_ACTUAL'
    AND abs(totals.line_total - pcv."totalDirectCost") > 0.01;
  IF mismatches <> 0 THEN
    RAISE EXCEPTION 'Reconciled actual line failures: %', mismatches;
  END IF;

  SELECT count(*) INTO mismatches
  FROM "CostLine" cl
  JOIN "ProjectCostVersion" pcv ON pcv."id" = cl."projectCostVersionId"
  WHERE pcv."authorityState" = 'RECONCILED_ACTUAL'
    AND cl."authorityState" = 'RECONCILED_ACTUAL'
    AND NOT EXISTS (
      SELECT 1
      FROM "EvidenceReference" er
      WHERE er."organizationId" = cl."organizationId"
        AND er."subjectType" = 'COST_LINE'
        AND er."subjectId" = cl."id"
        AND er."observationType" = 'RECONCILED_ACTUAL_COST'
    );
  IF mismatches <> 0 THEN
    RAISE EXCEPTION 'Eligible actual cost lines without evidence: %', mismatches;
  END IF;

  SELECT count(*) INTO mismatches
  FROM "QuoteItem" qi
  WHERE qi."organizationId" = 'org_horizon'
    AND NOT EXISTS (
      SELECT 1
      FROM "EvidenceReference" er
      WHERE er."organizationId" = qi."organizationId"
        AND er."subjectType" = 'QUOTE_ITEM'
        AND er."subjectId" = qi."id"
        AND er."observationType" = 'QUOTED_PRICE'
    );
  IF mismatches <> 0 THEN
    RAISE EXCEPTION 'Quote items without quoted-price evidence: %', mismatches;
  END IF;

  SELECT count(*) INTO value_count
  FROM "QuoteVersion"
  WHERE "quoteId" = 'quote_prj_xinyi_026'
    AND "authorityState" = 'SUPERSEDED'
    AND "supersededById" IS NOT NULL;
  IF value_count <> 2 THEN
    RAISE EXCEPTION 'Expected two superseded Xinyi quote versions, found %', value_count;
  END IF;

  RAISE NOTICE 'Horizon Atelier fixture verified: % projects, % quote/cost lines, % evidence references.',
    (SELECT count(*) FROM "Project" WHERE "organizationId" = 'org_horizon'),
    combined_lines,
    (SELECT count(*) FROM "EvidenceReference" WHERE "organizationId" = 'org_horizon');
END $$;
