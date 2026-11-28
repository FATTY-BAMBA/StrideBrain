DO $$
DECLARE
  mismatches integer;
BEGIN
  SELECT count(*) INTO mismatches FROM (
    SELECT m."id"
    FROM "Membership" m
    JOIN "Person" p ON p."id" = m."personId"
    WHERE m."organizationId" <> p."organizationId"

    UNION ALL

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

    SELECT ps."id"
    FROM "ProjectScope" ps
    JOIN "Project" p ON p."id" = ps."projectId"
    WHERE ps."organizationId" <> p."organizationId"

    UNION ALL

    SELECT ps."id"
    FROM "ProjectSupplier" ps
    JOIN "Project" p ON p."id" = ps."projectId"
    JOIN "Supplier" s ON s."id" = ps."supplierId"
    WHERE ps."organizationId" <> p."organizationId"
       OR ps."organizationId" <> s."organizationId"

    UNION ALL

    SELECT pm."id"
    FROM "ProjectMaterial" pm
    JOIN "Project" p ON p."id" = pm."projectId"
    JOIN "Material" m ON m."id" = pm."materialId"
    WHERE pm."organizationId" <> p."organizationId"
       OR pm."organizationId" <> m."organizationId"

    UNION ALL

    SELECT d."id"
    FROM "Document" d
    JOIN "Project" p ON p."id" = d."projectId"
    WHERE d."projectId" IS NOT NULL
      AND d."organizationId" <> p."organizationId"

    UNION ALL

    SELECT dv."id"
    FROM "DocumentVersion" dv
    JOIN "Document" d ON d."id" = dv."documentId"
    LEFT JOIN "DocumentVersion" next_dv ON next_dv."id" = dv."supersededById"
    WHERE dv."organizationId" <> d."organizationId"
       OR (dv."supersededById" IS NOT NULL AND dv."organizationId" <> next_dv."organizationId")

    UNION ALL

    SELECT er."id"
    FROM "EvidenceReference" er
    JOIN "DocumentVersion" dv ON dv."id" = er."documentVersionId"
    WHERE er."documentVersionId" IS NOT NULL
      AND er."organizationId" <> dv."organizationId"

    UNION ALL

    SELECT ec."id"
    FROM "EvidenceConflict" ec
    JOIN "EvidenceReference" primary_er ON primary_er."id" = ec."primaryEvidenceId"
    JOIN "EvidenceReference" conflict_er ON conflict_er."id" = ec."conflictingEvidenceId"
    WHERE ec."organizationId" <> primary_er."organizationId"
       OR ec."organizationId" <> conflict_er."organizationId"

    UNION ALL

    SELECT q."id"
    FROM "Quote" q
    JOIN "Project" p ON p."id" = q."projectId"
    WHERE q."organizationId" <> p."organizationId"

    UNION ALL

    SELECT qv."id"
    FROM "QuoteVersion" qv
    JOIN "Quote" q ON q."id" = qv."quoteId"
    LEFT JOIN "QuoteVersion" next_qv ON next_qv."id" = qv."supersededById"
    WHERE qv."organizationId" <> q."organizationId"
       OR (qv."supersededById" IS NOT NULL AND qv."organizationId" <> next_qv."organizationId")

    UNION ALL

    SELECT qi."id"
    FROM "QuoteItem" qi
    JOIN "QuoteVersion" qv ON qv."id" = qi."quoteVersionId"
    LEFT JOIN "Supplier" s ON s."id" = qi."supplierId"
    LEFT JOIN "Material" m ON m."id" = qi."materialId"
    WHERE qi."organizationId" <> qv."organizationId"
       OR (qi."supplierId" IS NOT NULL AND qi."organizationId" <> s."organizationId")
       OR (qi."materialId" IS NOT NULL AND qi."organizationId" <> m."organizationId")

    UNION ALL

    SELECT fcv."id"
    FROM "ForecastCostVersion" fcv
    JOIN "Project" p ON p."id" = fcv."projectId"
    LEFT JOIN "ForecastCostVersion" next_fcv ON next_fcv."id" = fcv."supersededById"
    WHERE fcv."organizationId" <> p."organizationId"
       OR (fcv."supersededById" IS NOT NULL AND fcv."organizationId" <> next_fcv."organizationId")

    UNION ALL

    SELECT fcl."id"
    FROM "ForecastCostLine" fcl
    JOIN "ForecastCostVersion" fcv ON fcv."id" = fcl."forecastCostVersionId"
    LEFT JOIN "Supplier" s ON s."id" = fcl."supplierId"
    LEFT JOIN "Material" m ON m."id" = fcl."materialId"
    WHERE fcl."organizationId" <> fcv."organizationId"
       OR (fcl."supplierId" IS NOT NULL AND fcl."organizationId" <> s."organizationId")
       OR (fcl."materialId" IS NOT NULL AND fcl."organizationId" <> m."organizationId")

    UNION ALL

    SELECT pcv."id"
    FROM "ProjectCostVersion" pcv
    JOIN "Project" p ON p."id" = pcv."projectId"
    LEFT JOIN "ProjectCostVersion" next_pcv ON next_pcv."id" = pcv."supersededById"
    WHERE pcv."organizationId" <> p."organizationId"
       OR (pcv."supersededById" IS NOT NULL AND pcv."organizationId" <> next_pcv."organizationId")

    UNION ALL

    SELECT cl."id"
    FROM "CostLine" cl
    JOIN "ProjectCostVersion" pcv ON pcv."id" = cl."projectCostVersionId"
    LEFT JOIN "Supplier" s ON s."id" = cl."supplierId"
    LEFT JOIN "Material" m ON m."id" = cl."materialId"
    WHERE cl."organizationId" <> pcv."organizationId"
       OR (cl."supplierId" IS NOT NULL AND cl."organizationId" <> s."organizationId")
       OR (cl."materialId" IS NOT NULL AND cl."organizationId" <> m."organizationId")

    UNION ALL

    SELECT so."id"
    FROM "SupplierOffer" so
    JOIN "Supplier" s ON s."id" = so."supplierId"
    LEFT JOIN "Project" p ON p."id" = so."projectId"
    WHERE so."organizationId" <> s."organizationId"
       OR (so."projectId" IS NOT NULL AND so."organizationId" <> p."organizationId")

    UNION ALL

    SELECT soi."id"
    FROM "SupplierOfferItem" soi
    JOIN "SupplierOffer" so ON so."id" = soi."supplierOfferId"
    LEFT JOIN "Material" m ON m."id" = soi."materialId"
    WHERE soi."organizationId" <> so."organizationId"
       OR (soi."materialId" IS NOT NULL AND soi."organizationId" <> m."organizationId")

    UNION ALL

    SELECT ir."id"
    FROM "IntelligenceRun" ir
    LEFT JOIN "Project" p ON p."id" = ir."projectId"
    WHERE ir."projectId" IS NOT NULL
      AND ir."organizationId" <> p."organizationId"

    UNION ALL

    SELECT cr."id"
    FROM "ComparisonRun" cr
    JOIN "IntelligenceRun" ir ON ir."id" = cr."intelligenceRunId"
    JOIN "Project" p ON p."id" = cr."activeProjectId"
    LEFT JOIN "QuoteVersion" qv ON qv."id" = cr."activeQuoteVersionId"
    WHERE cr."organizationId" <> ir."organizationId"
       OR cr."organizationId" <> p."organizationId"
       OR (cr."activeQuoteVersionId" IS NOT NULL AND cr."organizationId" <> qv."organizationId")

    UNION ALL

    SELECT cc."id"
    FROM "ComparisonCandidate" cc
    JOIN "ComparisonRun" cr ON cr."id" = cc."comparisonRunId"
    JOIN "Project" p ON p."id" = cc."candidateProjectId"
    WHERE cc."organizationId" <> cr."organizationId"
       OR cc."organizationId" <> p."organizationId"

    UNION ALL

    SELECT cf."id"
    FROM "ComparisonFactor" cf
    JOIN "ComparisonCandidate" cc ON cc."id" = cf."comparisonCandidateId"
    WHERE cf."organizationId" <> cc."organizationId"

    UNION ALL

    SELECT cc."id"
    FROM "ComparisonClaim" cc
    JOIN "ComparisonRun" cr ON cr."id" = cc."comparisonRunId"
    WHERE cc."organizationId" <> cr."organizationId"

    UNION ALL

    SELECT pa."id"
    FROM "ProposedAction" pa
    JOIN "Project" p ON p."id" = pa."projectId"
    JOIN "ComparisonRun" cr ON cr."id" = pa."comparisonRunId"
    WHERE pa."organizationId" <> p."organizationId"
       OR pa."organizationId" <> cr."organizationId"

    UNION ALL

    SELECT a."id"
    FROM "Action" a
    JOIN "Project" p ON p."id" = a."projectId"
    JOIN "ComparisonRun" cr ON cr."id" = a."comparisonRunId"
    LEFT JOIN "ProposedAction" pa ON pa."id" = a."proposedActionId"
    WHERE a."organizationId" <> p."organizationId"
       OR a."organizationId" <> cr."organizationId"
       OR (a."proposedActionId" IS NOT NULL AND a."organizationId" <> pa."organizationId")

    UNION ALL

    SELECT ae."id"
    FROM "AuditEvent" ae
    LEFT JOIN "Membership" m ON m."id" = ae."actorMembershipId"
    LEFT JOIN "ComparisonRun" cr ON cr."id" = ae."comparisonRunId"
    LEFT JOIN "ProposedAction" pa ON pa."id" = ae."proposedActionId"
    LEFT JOIN "Action" a ON a."id" = ae."actionId"
    WHERE (ae."actorMembershipId" IS NOT NULL AND ae."organizationId" <> m."organizationId")
       OR (ae."comparisonRunId" IS NOT NULL AND ae."organizationId" <> cr."organizationId")
       OR (ae."proposedActionId" IS NOT NULL AND ae."organizationId" <> pa."organizationId")
       OR (ae."actionId" IS NOT NULL AND ae."organizationId" <> a."organizationId")
  ) cross_organization_relations;

  IF mismatches <> 0 THEN
    RAISE EXCEPTION 'Cross-organization relationship mismatches found: %', mismatches;
  END IF;

  SELECT count(*) INTO mismatches
  FROM "EvidenceReference" er
  WHERE
    (er."subjectType" = 'PROJECT' AND NOT EXISTS (
      SELECT 1 FROM "Project" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'PROJECT_SCOPE' AND NOT EXISTS (
      SELECT 1 FROM "ProjectScope" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'DOCUMENT_VERSION' AND NOT EXISTS (
      SELECT 1 FROM "DocumentVersion" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'QUOTE_VERSION' AND NOT EXISTS (
      SELECT 1 FROM "QuoteVersion" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'QUOTE_ITEM' AND NOT EXISTS (
      SELECT 1 FROM "QuoteItem" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'FORECAST_COST_VERSION' AND NOT EXISTS (
      SELECT 1 FROM "ForecastCostVersion" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'FORECAST_COST_LINE' AND NOT EXISTS (
      SELECT 1 FROM "ForecastCostLine" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'PROJECT_COST_VERSION' AND NOT EXISTS (
      SELECT 1 FROM "ProjectCostVersion" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'COST_LINE' AND NOT EXISTS (
      SELECT 1 FROM "CostLine" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'SUPPLIER_OFFER' AND NOT EXISTS (
      SELECT 1 FROM "SupplierOffer" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'SUPPLIER_OFFER_ITEM' AND NOT EXISTS (
      SELECT 1 FROM "SupplierOfferItem" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'COMPARISON_CLAIM' AND NOT EXISTS (
      SELECT 1 FROM "ComparisonClaim" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ))
    OR (er."subjectType" = 'ACTION' AND NOT EXISTS (
      SELECT 1 FROM "Action" subject
      WHERE subject."id" = er."subjectId" AND subject."organizationId" = er."organizationId"
    ));

  IF mismatches <> 0 THEN
    RAISE EXCEPTION 'Evidence references with missing or cross-organization subjects: %', mismatches;
  END IF;

  RAISE NOTICE 'All organization-scoped fixture relationships and evidence subjects are valid.';
END $$;

-- This verifies schema relationships without requiring private accounts or changing sample addresses.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "IdentityLink" l JOIN "Person" p ON p.id=l."personId" WHERE p."organizationId"<>l."organizationId") THEN
    RAISE EXCEPTION 'Cross-organization identity link';
  END IF;
  IF EXISTS (SELECT 1 FROM "Membership" WHERE "invitationStatus" NOT IN ('JOINED','INVITED','CANCELLED') OR "invitationEmailStatus" NOT IN ('NOT_SENT','SENT','FAILED')) THEN
    RAISE EXCEPTION 'Invalid invitation state';
  END IF;
  IF EXISTS (SELECT 1 FROM "AuthAccount" WHERE "accessToken" IS NOT NULL OR "refreshToken" IS NOT NULL OR "idToken" IS NOT NULL OR password IS NOT NULL) THEN
    RAISE EXCEPTION 'Unexpected persisted provider token/password';
  END IF;
END $$;
