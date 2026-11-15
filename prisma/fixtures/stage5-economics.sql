-- Stage 5 evidence fixtures. These rows expose source locators for current
-- forecast lines and structured programme facts without storing conclusions.

INSERT INTO "EvidenceReference" (
  "id", "organizationId", "subjectType", "subjectId", "documentVersionId", "locator",
  "claimKey", "supportedValue", "authorityState", "observationType",
  "dataClassification", "effectiveAt", "createdAt"
)
SELECT
  'evid_forecast_' || fcl."id",
  'org_horizon',
  'FORECAST_COST_LINE',
  fcl."id",
  'dv_prj_xinyi_026_3',
  jsonb_build_object(
    'kind', 'forecast-cost-line',
    'lineNumber', fcl."lineNumber",
    'categoryId', fcl."categoryId"
  ),
  'forecast-cost:' || fcl."categoryId",
  jsonb_build_object(
    'amount', fcl."amount",
    'currency', fcv."currency",
    'unit', fcl."unit"
  ),
  fcl."authorityState",
  'FORECAST_DIRECT_COST',
  'DEMO_SYNTHETIC',
  fcv."effectiveAt",
  NOW()
FROM "ForecastCostLine" fcl
JOIN "ForecastCostVersion" fcv ON fcv."id" = fcl."forecastCostVersionId"
WHERE fcl."organizationId" = 'org_horizon'
  AND fcv."projectId" = 'prj_xinyi_026'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "EvidenceReference" (
  "id", "organizationId", "subjectType", "subjectId", "documentVersionId", "locator",
  "claimKey", "supportedValue", "authorityState", "observationType",
  "dataClassification", "effectiveAt", "createdAt"
)
SELECT
  'evid_forecast_version_' || fcv."id",
  'org_horizon',
  'FORECAST_COST_VERSION',
  fcv."id",
  'dv_prj_xinyi_026_3',
  jsonb_build_object('kind', 'forecast-cost-version', 'versionNumber', fcv."versionNumber"),
  'forecast-cost:total',
  jsonb_build_object('amount', fcv."totalDirectCost", 'currency', fcv."currency"),
  fcv."authorityState",
  'FORECAST_DIRECT_COST',
  'DEMO_SYNTHETIC',
  fcv."effectiveAt",
  NOW()
FROM "ForecastCostVersion" fcv
WHERE fcv."organizationId" = 'org_horizon'
  AND fcv."projectId" = 'prj_xinyi_026'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "EvidenceReference" (
  "id", "organizationId", "subjectType", "subjectId", "documentVersionId", "locator",
  "claimKey", "supportedValue", "authorityState", "dataClassification",
  "effectiveAt", "createdAt"
)
SELECT
  'evid_programme_' || p."id",
  'org_horizon',
  'PROJECT',
  p."id",
  'dv_' || lower(replace(p."businessKey", '-', '_')) || '_1',
  jsonb_build_object('kind', 'structured-field', 'field', 'programmeWeeks'),
  'project:programmeWeeks',
  jsonb_build_object('value', p."programmeWeeks", 'unit', 'weeks'),
  p."metadataAuthority",
  p."dataClassification",
  COALESCE(p."completedAt", DATE '2026-11-14'),
  NOW()
FROM "Project" p
WHERE p."organizationId" = 'org_horizon'
  AND p."programmeWeeks" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
