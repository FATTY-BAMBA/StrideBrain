-- Stage 4 deterministic comparison facets.
--
-- These are explicit synthetic fixture facts required to make the accepted
-- CPI-SIM-1.0 canonical ranking derive from stored project relationships.
-- No score or rank is stored here.

UPDATE "Project"
SET "subtype" = 'RETAIL_FLAGSHIP'
WHERE "id" = 'prj_daan_016'
  AND "organizationId" = 'org_horizon';

INSERT INTO "ProjectMaterial" (
  "id",
  "organizationId",
  "projectId",
  "materialId",
  "relationship",
  "createdAt"
)
VALUES
  (
    'pm_zhongshan_018_signage_stage4',
    'org_horizon',
    'prj_zhongshan_018',
    'material_signage',
    'USED',
    '2026-11-14T00:00:00Z'
  ),
  (
    'pm_nanjing_023_signage_stage4',
    'org_horizon',
    'prj_nanjing_023',
    'material_signage',
    'USED',
    '2026-11-14T00:00:00Z'
  ),
  (
    'pm_songshan_020_millwork_stage4',
    'org_horizon',
    'prj_songshan_020',
    'material_custom_millwork',
    'USED',
    '2026-11-14T00:00:00Z'
  ),
  (
    'pm_banqiao_015_millwork_stage4',
    'org_horizon',
    'prj_banqiao_015',
    'material_custom_millwork',
    'USED',
    '2026-11-14T00:00:00Z'
  )
ON CONFLICT DO NOTHING;
