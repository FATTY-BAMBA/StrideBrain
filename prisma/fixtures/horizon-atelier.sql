BEGIN;

-- Operator-only reset of the two named fictional tenants. Stop the isolated
-- preview before reseeding. Organization is locked first, matching Stage 8's
-- confirmation lock order, so reset never waits on source locks while holding
-- an Action/AuditEvent lock required by an in-flight confirmation.
LOCK TABLE "Organization" IN ACCESS EXCLUSIVE MODE;
LOCK TABLE "ProposedAction", "Action", "AuditEvent", "InternalReviewReceipt"
  IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Organization"
    WHERE ("id" IN ('org_horizon', 'org_northern')
      OR "businessKey" IN ('HORIZON_ATELIER', 'NORTHERN_STUDIO'))
      AND NOT (
        "dataClassification" = 'DEMO_SYNTHETIC'
        AND (("id" = 'org_horizon' AND "businessKey" = 'HORIZON_ATELIER')
          OR ("id" = 'org_northern' AND "businessKey" = 'NORTHERN_STUDIO'))
      )
  ) THEN
    RAISE EXCEPTION 'SYNTHETIC_FIXTURE_RESET_REFUSED';
  END IF;
END $$;

-- Requires database-owner privileges. No application bypass flag or API exists.
-- All trigger changes and deletes roll back together if any seed statement fails.
ALTER TABLE "AuditEvent" DISABLE TRIGGER "AuditEvent_append_only";
ALTER TABLE "Action" DISABLE TRIGGER "Action_stage8_immutable";
ALTER TABLE "ProposedAction" DISABLE TRIGGER "ProposedAction_stage8_immutable";
ALTER TABLE "InternalReviewReceipt" DISABLE TRIGGER "InternalReviewReceipt_immutable";

DELETE FROM "InternalReviewReceipt" WHERE "organizationId" IN ('org_horizon', 'org_northern');
DELETE FROM "AuditEvent" WHERE "organizationId" IN ('org_horizon', 'org_northern');
DELETE FROM "Action" WHERE "organizationId" IN ('org_horizon', 'org_northern');
DELETE FROM "ProposedAction" WHERE "organizationId" IN ('org_horizon', 'org_northern');

DELETE FROM "Organization"
WHERE "id" IN ('org_horizon', 'org_northern')
   OR "businessKey" IN ('HORIZON_ATELIER', 'NORTHERN_STUDIO');

INSERT INTO "Organization" (
  "id", "businessKey", "nameEn", "nameZhTw", "primaryLocale", "timezone",
  "dataClassification", "createdAt", "updatedAt"
) VALUES
  ('org_horizon', 'HORIZON_ATELIER', 'Horizon Atelier', '禾序空間設計', 'zh-TW', 'Asia/Taipei', 'DEMO_SYNTHETIC', NOW(), NOW()),
  ('org_northern', 'NORTHERN_STUDIO', 'Northern Studio', '北境設計', 'zh-TW', 'Asia/Taipei', 'DEMO_SYNTHETIC', NOW(), NOW());

INSERT INTO "Person" (
  "id", "organizationId", "businessKey", "nameEn", "nameZhTw", "email", "active", "createdAt", "updatedAt"
) VALUES
  ('person_horizon_admin', 'org_horizon', 'PERSON-ADMIN', 'Alex Chen', '陳柏宇', 'alex.admin@example.invalid', true, NOW(), NOW()),
  ('person_horizon_mei', 'org_horizon', 'PERSON-MEI', 'Mei Lin', '林美玲', 'mei.lin@example.invalid', true, NOW(), NOW()),
  ('person_horizon_finance', 'org_horizon', 'PERSON-FINANCE', 'Iris Huang', '黃怡君', 'iris.huang@example.invalid', true, NOW(), NOW()),
  ('person_horizon_viewer', 'org_horizon', 'PERSON-VIEWER', 'Kai Wu', '吳凱', 'kai.wu@example.invalid', true, NOW(), NOW()),
  ('person_northern_owner', 'org_northern', 'PERSON-NORTH-OWNER', 'Northern Owner', '北境負責人', 'owner.northern@example.invalid', true, NOW(), NOW());

INSERT INTO "Membership" (
  "id", "organizationId", "personId", "role", "active", "createdAt", "updatedAt"
) VALUES
  ('membership_horizon_admin', 'org_horizon', 'person_horizon_admin', 'ORGANIZATION_ADMIN', true, NOW(), NOW()),
  ('membership_horizon_mei', 'org_horizon', 'person_horizon_mei', 'PROJECT_MANAGER_ESTIMATOR', true, NOW(), NOW()),
  ('membership_horizon_finance', 'org_horizon', 'person_horizon_finance', 'FINANCIAL_REVIEWER', true, NOW(), NOW()),
  ('membership_horizon_viewer', 'org_horizon', 'person_horizon_viewer', 'VIEWER', true, NOW(), NOW()),
  ('membership_northern_owner', 'org_northern', 'person_northern_owner', 'ORGANIZATION_ADMIN', true, NOW(), NOW());

INSERT INTO "Client" (
  "id", "organizationId", "businessKey", "nameEn", "nameZhTw", "clientType", "active", "createdAt", "updatedAt"
)
SELECT
  'client_horizon_' || lpad(g::text, 2, '0'),
  'org_horizon',
  'CLIENT-' || lpad(g::text, 2, '0'),
  CASE WHEN g = 1 THEN 'Aster Retail Taiwan' ELSE 'Horizon Client ' || lpad(g::text, 2, '0') END,
  CASE WHEN g = 1 THEN '星序零售台灣' ELSE '禾序客戶' || lpad(g::text, 2, '0') END,
  CASE WHEN g % 3 = 0 THEN 'CORPORATE' WHEN g % 3 = 1 THEN 'RETAIL' ELSE 'HOSPITALITY' END,
  true,
  NOW(),
  NOW()
FROM generate_series(1, 14) AS g;

INSERT INTO "Client" (
  "id", "organizationId", "businessKey", "nameEn", "nameZhTw", "clientType", "active", "createdAt", "updatedAt"
) VALUES
  ('client_northern_01', 'org_northern', 'CLIENT-NORTH-01', 'Restricted Client', '受限客戶', 'RETAIL', true, NOW(), NOW());

INSERT INTO "Project" (
  "id", "organizationId", "businessKey", "clientId", "nameEn", "nameZhTw",
  "comparisonClass", "subtype", "status", "stage", "locationCity", "locationDistrict",
  "areaQuantity", "areaUnit", "currency", "programmeWeeks", "startDate",
  "targetCompletionAt", "completedAt", "metadataAuthority", "dataClassification",
  "createdAt", "updatedAt"
) VALUES
  ('prj_xinyi_026', 'org_horizon', 'PRJ-XINYI-026', 'client_horizon_01', 'Xinyi Flagship Renovation', '信義旗艦店裝修', 'COMMERCIAL_INTERIOR_FIT_OUT', 'RETAIL_FLAGSHIP', 'ACTIVE', 'QUOTE_REVIEW', 'Taipei City', 'Xinyi District', 640.000, 'm2', 'TWD', 16.00, DATE '2026-10-20', DATE '2027-02-20', NULL, 'HUMAN_REVIEWED', 'DEMO_SYNTHETIC', NOW(), NOW()),
  ('prj_neihu_021', 'org_horizon', 'PRJ-NEIHU-021', 'client_horizon_02', 'Neihu Tech Flagship', '內湖科技旗艦店', 'COMMERCIAL_INTERIOR_FIT_OUT', 'RETAIL_FLAGSHIP', 'COMPLETED', 'COMPLETE', 'Taipei City', 'Neihu District', 610.000, 'm2', 'TWD', 20.00, DATE '2025-02-01', DATE '2025-06-30', DATE '2025-06-30', 'HUMAN_REVIEWED', 'DEMO_SYNTHETIC', NOW(), NOW()),
  ('prj_zhongshan_018', 'org_horizon', 'PRJ-ZHONGSHAN-018', 'client_horizon_03', 'Zhongshan Lifestyle Store', '中山生活概念店', 'COMMERCIAL_INTERIOR_FIT_OUT', 'RETAIL_FLAGSHIP', 'COMPLETED', 'COMPLETE', 'Taipei City', 'Zhongshan District', 590.000, 'm2', 'TWD', 19.00, DATE '2024-07-01', DATE '2024-11-15', DATE '2024-11-15', 'HUMAN_REVIEWED', 'DEMO_SYNTHETIC', NOW(), NOW()),
  ('prj_nanjing_023', 'org_horizon', 'PRJ-NANJING-023', 'client_horizon_04', 'Nanjing Brand Experience Center', '南京品牌體驗中心', 'COMMERCIAL_INTERIOR_FIT_OUT', 'RETAIL_FLAGSHIP', 'COMPLETED', 'COMPLETE', 'Taipei City', 'Songshan District', 720.000, 'm2', 'TWD', 22.00, DATE '2025-08-10', DATE '2026-02-10', DATE '2026-02-10', 'HUMAN_REVIEWED', 'DEMO_SYNTHETIC', NOW(), NOW()),
  ('prj_daan_016', 'org_horizon', 'PRJ-DAAN-016', 'client_horizon_05', 'Daan Premium Showroom', '大安精品展示中心', 'COMMERCIAL_INTERIOR_FIT_OUT', 'RETAIL_SHOWROOM', 'COMPLETED', 'COMPLETE', 'Taipei City', 'Daan District', 520.000, 'm2', 'TWD', 18.00, DATE '2023-12-01', DATE '2024-04-20', DATE '2024-04-20', 'HUMAN_REVIEWED', 'DEMO_SYNTHETIC', NOW(), NOW()),
  ('prj_songshan_020', 'org_horizon', 'PRJ-SONGSHAN-020', 'client_horizon_06', 'Songshan Retail Renewal', '松山門市改裝', 'COMMERCIAL_INTERIOR_FIT_OUT', 'RETAIL_RENOVATION', 'COMPLETED', 'COMPLETE', 'Taipei City', 'Songshan District', 680.000, 'm2', 'TWD', 18.00, DATE '2024-10-01', DATE '2025-02-28', DATE '2025-02-28', 'HUMAN_REVIEWED', 'DEMO_SYNTHETIC', NOW(), NOW()),
  ('prj_banqiao_015', 'org_horizon', 'PRJ-BANQIAO-015', 'client_horizon_07', 'Banqiao Concept Store', '板橋概念店', 'COMMERCIAL_INTERIOR_FIT_OUT', 'RETAIL_CONCEPT_STORE', 'COMPLETED', 'COMPLETE', 'New Taipei City', 'Banqiao District', 760.000, 'm2', 'TWD', 22.00, DATE '2023-04-01', DATE '2023-09-30', DATE '2023-09-30', 'HUMAN_REVIEWED', 'DEMO_SYNTHETIC', NOW(), NOW());

INSERT INTO "Project" (
  "id", "organizationId", "businessKey", "clientId", "nameEn", "nameZhTw",
  "comparisonClass", "subtype", "status", "stage", "locationCity", "locationDistrict",
  "areaQuantity", "areaUnit", "currency", "programmeWeeks", "startDate",
  "targetCompletionAt", "completedAt", "metadataAuthority", "dataClassification",
  "createdAt", "updatedAt"
)
SELECT
  'prj_hist_' || lpad(g::text, 3, '0'),
  'org_horizon',
  'PRJ-HIST-' || lpad(g::text, 3, '0'),
  'client_horizon_' || lpad((((g - 1) % 14) + 1)::text, 2, '0'),
  'Completed Workplace Project ' || lpad(g::text, 2, '0'),
  '已完工辦公專案' || lpad(g::text, 2, '0'),
  CASE WHEN g <= 9 THEN 'COMMERCIAL_OFFICE_FIT_OUT' ELSE 'HOSPITALITY_INTERIOR_FIT_OUT' END,
  CASE WHEN g % 2 = 0 THEN 'CORPORATE_OFFICE' ELSE 'WORKPLACE_RENOVATION' END,
  'COMPLETED',
  'COMPLETE',
  CASE WHEN g % 3 = 0 THEN 'New Taipei City' ELSE 'Taipei City' END,
  CASE WHEN g % 3 = 0 THEN 'Banqiao District' WHEN g % 3 = 1 THEN 'Nangang District' ELSE 'Daan District' END,
  (420 + g * 22)::numeric(18,3),
  'm2',
  'TWD',
  (17 + (g % 6))::numeric(8,2),
  (DATE '2021-01-01' + (g * 75))::date,
  (DATE '2021-05-01' + (g * 75))::date,
  (DATE '2021-05-01' + (g * 75))::date,
  'HUMAN_REVIEWED',
  'DEMO_SYNTHETIC',
  NOW(),
  NOW()
FROM generate_series(1, 18) AS g;

INSERT INTO "Project" (
  "id", "organizationId", "businessKey", "clientId", "nameEn", "nameZhTw",
  "comparisonClass", "subtype", "status", "stage", "locationCity", "locationDistrict",
  "areaQuantity", "areaUnit", "currency", "programmeWeeks", "startDate",
  "targetCompletionAt", "completedAt", "metadataAuthority", "dataClassification",
  "createdAt", "updatedAt"
)
SELECT
  'prj_active_' || lpad(g::text, 3, '0'),
  'org_horizon',
  'PRJ-ACTIVE-' || lpad(g::text, 3, '0'),
  'client_horizon_' || lpad((((g + 7) % 14) + 1)::text, 2, '0'),
  'Active Design Project ' || lpad(g::text, 2, '0'),
  '進行中設計專案' || lpad(g::text, 2, '0'),
  CASE WHEN g % 2 = 0 THEN 'COMMERCIAL_OFFICE_FIT_OUT' ELSE 'HOSPITALITY_INTERIOR_FIT_OUT' END,
  CASE WHEN g % 2 = 0 THEN 'CORPORATE_OFFICE' ELSE 'BOUTIQUE_HOSPITALITY' END,
  'ACTIVE',
  CASE WHEN g = 1 THEN 'DESIGN' WHEN g = 2 THEN 'PROCUREMENT' ELSE 'CONSTRUCTION' END::"ProjectStage",
  'Taipei City',
  CASE WHEN g % 2 = 0 THEN 'Nangang District' ELSE 'Daan District' END,
  (480 + g * 45)::numeric(18,3),
  'm2',
  'TWD',
  (18 + g)::numeric(8,2),
  (DATE '2026-08-01' + (g * 20))::date,
  (DATE '2027-01-15' + (g * 35))::date,
  NULL,
  'HUMAN_REVIEWED',
  'DEMO_SYNTHETIC',
  NOW(),
  NOW()
FROM generate_series(1, 4) AS g;

INSERT INTO "Project" (
  "id", "organizationId", "businessKey", "clientId", "nameEn", "nameZhTw",
  "comparisonClass", "subtype", "status", "stage", "locationCity", "locationDistrict",
  "areaQuantity", "areaUnit", "currency", "programmeWeeks", "completedAt",
  "metadataAuthority", "dataClassification", "createdAt", "updatedAt"
) VALUES
  ('prj_northern_restricted', 'org_northern', 'PRJ-NORTH-001', 'client_northern_01', 'Restricted Flagship', '受限旗艦店', 'COMMERCIAL_INTERIOR_FIT_OUT', 'RETAIL_FLAGSHIP', 'COMPLETED', 'COMPLETE', 'Taipei City', 'Xinyi District', 630.000, 'm2', 'TWD', 17.00, DATE '2026-06-30', 'HUMAN_REVIEWED', 'DEMO_SYNTHETIC', NOW(), NOW());

INSERT INTO "ProjectAssignment" (
  "id", "organizationId", "projectId", "membershipId", "canReadActuals", "canCreateAction", "createdAt"
) VALUES
  ('assign_admin_xinyi', 'org_horizon', 'prj_xinyi_026', 'membership_horizon_admin', true, true, NOW()),
  ('assign_mei_xinyi', 'org_horizon', 'prj_xinyi_026', 'membership_horizon_mei', true, true, NOW()),
  ('assign_finance_xinyi', 'org_horizon', 'prj_xinyi_026', 'membership_horizon_finance', true, true, NOW()),
  ('assign_viewer_xinyi', 'org_horizon', 'prj_xinyi_026', 'membership_horizon_viewer', false, false, NOW()),
  ('assign_northern_owner', 'org_northern', 'prj_northern_restricted', 'membership_northern_owner', true, true, NOW());

INSERT INTO "Supplier" (
  "id", "organizationId", "businessKey", "nameEn", "nameZhTw", "categoryId", "active", "createdAt", "updatedAt"
)
SELECT
  CASE
    WHEN g = 1 THEN 'supplier_stone_01'
    WHEN g = 2 THEN 'supplier_stone_02'
    WHEN g = 3 THEN 'supplier_lighting_01'
    WHEN g = 4 THEN 'supplier_lighting_02'
    WHEN g = 5 THEN 'supplier_millwork_01'
    WHEN g = 6 THEN 'supplier_millwork_02'
    WHEN g = 7 THEN 'supplier_signage_01'
    ELSE 'supplier_horizon_' || lpad(g::text, 2, '0')
  END,
  'org_horizon',
  'SUP-' || lpad(g::text, 2, '0'),
  CASE
    WHEN g = 1 THEN 'Stonefield Surfaces'
    WHEN g = 2 THEN 'Formosa Stone Works'
    WHEN g = 3 THEN 'Luma Systems'
    WHEN g = 4 THEN 'Taipei Domestic Lighting'
    WHEN g = 5 THEN 'Craftline Millwork'
    WHEN g = 6 THEN 'Northwood Joinery'
    WHEN g = 7 THEN 'SignLab Taiwan'
    ELSE 'Horizon Supplier ' || lpad(g::text, 2, '0')
  END,
  CASE
    WHEN g = 1 THEN '石界材料'
    WHEN g = 2 THEN '福爾摩沙石材'
    WHEN g = 3 THEN '光域系統'
    WHEN g = 4 THEN '台北在地燈具'
    WHEN g = 5 THEN '匠線木作'
    WHEN g = 6 THEN '北木製作'
    WHEN g = 7 THEN '標示實驗室'
    ELSE '禾序供應商' || lpad(g::text, 2, '0')
  END,
  CASE
    WHEN g IN (1,2) THEN 'IMPORTED_STONE'
    WHEN g IN (3,4) THEN 'LIGHTING_ELECTRICAL'
    WHEN g IN (5,6) THEN 'CUSTOM_MILLWORK'
    WHEN g = 7 THEN 'SIGNAGE'
    ELSE 'GENERAL_TRADES'
  END,
  true,
  NOW(),
  NOW()
FROM generate_series(1, 20) AS g;

INSERT INTO "Material" (
  "id", "organizationId", "businessKey", "categoryId", "nameEn", "nameZhTw", "active", "createdAt", "updatedAt"
) VALUES
  ('material_imported_stone', 'org_horizon', 'MAT-IMPORTED-STONE', 'IMPORTED_STONE', 'Imported natural stone', '進口天然石材', true, NOW(), NOW()),
  ('material_domestic_stone', 'org_horizon', 'MAT-DOMESTIC-STONE', 'IMPORTED_STONE', 'Domestic engineered stone', '國產人造石', true, NOW(), NOW()),
  ('material_premium_lighting', 'org_horizon', 'MAT-PREMIUM-LIGHTING', 'LIGHTING_ELECTRICAL', 'Premium architectural lighting', '高規格建築燈具', true, NOW(), NOW()),
  ('material_domestic_lighting', 'org_horizon', 'MAT-DOMESTIC-LIGHTING', 'LIGHTING_ELECTRICAL', 'Domestic lighting package', '國產燈具組', true, NOW(), NOW()),
  ('material_custom_millwork', 'org_horizon', 'MAT-CUSTOM-MILLWORK', 'CUSTOM_MILLWORK', 'Custom retail millwork', '客製展示木作', true, NOW(), NOW()),
  ('material_signage', 'org_horizon', 'MAT-SIGNAGE', 'SIGNAGE', 'Retail signage system', '門市標示系統', true, NOW(), NOW()),
  ('material_ceiling', 'org_horizon', 'MAT-CEILING', 'DEMOLITION_CEILING', 'Commercial ceiling system', '商業空間天花系統', true, NOW(), NOW()),
  ('material_coordination', 'org_horizon', 'MAT-COORDINATION', 'COORDINATION', 'Site coordination allowance', '現場協調管理', true, NOW(), NOW());

WITH categories(category_id, label_en, label_zh) AS (
  VALUES
    ('SELECTIVE_DEMOLITION', 'Selective demolition', '選擇性拆除'),
    ('PARTITIONS_CEILINGS', 'Partitions and ceilings', '隔間與天花'),
    ('CUSTOM_MILLWORK', 'Custom millwork', '客製木作'),
    ('LIGHTING_ELECTRICAL', 'Lighting and electrical', '照明與電氣'),
    ('IMPORTED_STONE', 'Imported stone and hard finishes', '進口石材與硬質面材'),
    ('SIGNAGE', 'Signage and display installation', '標示與展示安裝'),
    ('COORDINATION', 'Site coordination and handover', '現場協調與交付')
), eligible_projects AS (
  SELECT "id", "organizationId", "businessKey"
  FROM "Project"
  WHERE "organizationId" = 'org_horizon'
)
INSERT INTO "ProjectScope" (
  "id", "organizationId", "projectId", "categoryId", "labelEn", "labelZhTw", "sourceState", "createdAt"
)
SELECT
  'scope_' || lower(replace(p."businessKey", '-', '_')) || '_' || lower(c.category_id),
  p."organizationId", p."id", c.category_id, c.label_en, c.label_zh, 'HUMAN_REVIEWED', NOW()
FROM eligible_projects p
CROSS JOIN categories c
WHERE
  p."businessKey" IN ('PRJ-XINYI-026','PRJ-NEIHU-021')
  OR (p."businessKey" IN ('PRJ-ZHONGSHAN-018','PRJ-NANJING-023') AND c.category_id <> 'SELECTIVE_DEMOLITION')
  OR (p."businessKey" IN ('PRJ-DAAN-016','PRJ-SONGSHAN-020','PRJ-BANQIAO-015') AND c.category_id NOT IN ('SELECTIVE_DEMOLITION','SIGNAGE'))
  OR (p."businessKey" LIKE 'PRJ-HIST-%' AND c.category_id IN ('PARTITIONS_CEILINGS','CUSTOM_MILLWORK','LIGHTING_ELECTRICAL','COORDINATION'))
  OR (p."businessKey" LIKE 'PRJ-ACTIVE-%' AND c.category_id IN ('PARTITIONS_CEILINGS','CUSTOM_MILLWORK','LIGHTING_ELECTRICAL','COORDINATION'));

INSERT INTO "ProjectSupplier" (
  "id", "organizationId", "projectId", "supplierId", "relationship", "createdAt"
) VALUES
  ('ps_xinyi_stone', 'org_horizon', 'prj_xinyi_026', 'supplier_stone_01', 'PROPOSED', NOW()),
  ('ps_xinyi_light', 'org_horizon', 'prj_xinyi_026', 'supplier_lighting_01', 'PROPOSED', NOW()),
  ('ps_xinyi_mill', 'org_horizon', 'prj_xinyi_026', 'supplier_millwork_01', 'PROPOSED', NOW()),
  ('ps_neihu_stone', 'org_horizon', 'prj_neihu_021', 'supplier_stone_01', 'USED', NOW()),
  ('ps_neihu_light', 'org_horizon', 'prj_neihu_021', 'supplier_lighting_02', 'USED', NOW()),
  ('ps_neihu_mill', 'org_horizon', 'prj_neihu_021', 'supplier_millwork_01', 'USED', NOW()),
  ('ps_zhongshan_stone', 'org_horizon', 'prj_zhongshan_018', 'supplier_stone_02', 'USED', NOW()),
  ('ps_zhongshan_light', 'org_horizon', 'prj_zhongshan_018', 'supplier_lighting_01', 'USED', NOW()),
  ('ps_nanjing_stone', 'org_horizon', 'prj_nanjing_023', 'supplier_stone_01', 'USED', NOW()),
  ('ps_daan_mill', 'org_horizon', 'prj_daan_016', 'supplier_millwork_02', 'USED', NOW()),
  ('ps_songshan_stone', 'org_horizon', 'prj_songshan_020', 'supplier_stone_02', 'USED', NOW()),
  ('ps_banqiao_light', 'org_horizon', 'prj_banqiao_015', 'supplier_lighting_02', 'USED', NOW());

INSERT INTO "ProjectSupplier" (
  "id", "organizationId", "projectId", "supplierId", "relationship", "createdAt"
)
SELECT
  'ps_' || lower(replace(p."businessKey", '-', '_')) || '_' || lpad((((g - 1) % 13) + 8)::text, 2, '0'),
  'org_horizon', p."id", 'supplier_horizon_' || lpad((((g - 1) % 13) + 8)::text, 2, '0'), 'USED', NOW()
FROM "Project" p
JOIN LATERAL generate_series(1, 2) g ON true
WHERE p."organizationId" = 'org_horizon'
  AND p."businessKey" LIKE 'PRJ-HIST-%';

INSERT INTO "ProjectMaterial" (
  "id", "organizationId", "projectId", "materialId", "relationship", "createdAt"
) VALUES
  ('pm_xinyi_stone', 'org_horizon', 'prj_xinyi_026', 'material_imported_stone', 'SPECIFIED', NOW()),
  ('pm_xinyi_light', 'org_horizon', 'prj_xinyi_026', 'material_premium_lighting', 'SPECIFIED', NOW()),
  ('pm_xinyi_mill', 'org_horizon', 'prj_xinyi_026', 'material_custom_millwork', 'SPECIFIED', NOW()),
  ('pm_neihu_stone', 'org_horizon', 'prj_neihu_021', 'material_imported_stone', 'INSTALLED', NOW()),
  ('pm_neihu_light', 'org_horizon', 'prj_neihu_021', 'material_domestic_lighting', 'INSTALLED', NOW()),
  ('pm_neihu_mill', 'org_horizon', 'prj_neihu_021', 'material_custom_millwork', 'INSTALLED', NOW()),
  ('pm_zhongshan_stone', 'org_horizon', 'prj_zhongshan_018', 'material_imported_stone', 'INSTALLED', NOW()),
  ('pm_zhongshan_light', 'org_horizon', 'prj_zhongshan_018', 'material_premium_lighting', 'INSTALLED', NOW()),
  ('pm_nanjing_stone', 'org_horizon', 'prj_nanjing_023', 'material_imported_stone', 'INSTALLED', NOW()),
  ('pm_daan_mill', 'org_horizon', 'prj_daan_016', 'material_custom_millwork', 'INSTALLED', NOW()),
  ('pm_songshan_stone', 'org_horizon', 'prj_songshan_020', 'material_domestic_stone', 'INSTALLED', NOW()),
  ('pm_banqiao_light', 'org_horizon', 'prj_banqiao_015', 'material_domestic_lighting', 'INSTALLED', NOW());

INSERT INTO "Document" (
  "id", "organizationId", "businessKey", "projectId", "titleEn", "titleZhTw", "documentType", "dataClassification", "createdAt", "updatedAt"
)
SELECT
  'doc_' || lower(replace(p."businessKey", '-', '_')) || '_' || d,
  'org_horizon',
  'DOC-' || p."businessKey" || '-' || d,
  p."id",
  CASE d WHEN 1 THEN p."nameEn" || ' project summary' WHEN 2 THEN p."nameEn" || ' quotation register' WHEN 3 THEN p."nameEn" || ' cost closeout' ELSE p."nameEn" || ' programme and handover' END,
  CASE d WHEN 1 THEN p."nameZhTw" || '專案摘要' WHEN 2 THEN p."nameZhTw" || '報價紀錄' WHEN 3 THEN p."nameZhTw" || '成本結案' ELSE p."nameZhTw" || '工期與交付' END,
  CASE d WHEN 1 THEN 'PROJECT_SUMMARY' WHEN 2 THEN 'QUOTE_REGISTER' WHEN 3 THEN 'COST_CLOSEOUT' ELSE 'PROGRAMME_RECORD' END,
  'DEMO_SYNTHETIC',
  NOW(), NOW()
FROM "Project" p
CROSS JOIN generate_series(1, 4) AS d
WHERE p."organizationId" = 'org_horizon';

INSERT INTO "DocumentVersion" (
  "id", "organizationId", "documentId", "versionLabel", "authorityState", "effectiveAt", "checksum", "metadata", "createdAt"
)
SELECT
  'dv_' || lower(replace(p."businessKey", '-', '_')) || '_' || d,
  'org_horizon',
  'doc_' || lower(replace(p."businessKey", '-', '_')) || '_' || d,
  'v1',
  CASE WHEN d = 3 AND p."status" = 'COMPLETED' THEN 'RECONCILED_ACTUAL'::"AuthorityState" ELSE 'HUMAN_REVIEWED'::"AuthorityState" END,
  COALESCE(p."completedAt", DATE '2026-11-14'),
  md5(p."businessKey" || ':' || d::text || ':v1'),
  jsonb_build_object('fixture', true, 'projectKey', p."businessKey", 'documentOrdinal', d),
  NOW()
FROM "Project" p
CROSS JOIN generate_series(1, 4) AS d
WHERE p."organizationId" = 'org_horizon';

INSERT INTO "Quote" (
  "id", "organizationId", "businessKey", "projectId", "createdAt"
)
SELECT
  'quote_' || lower(replace(p."businessKey", '-', '_')),
  'org_horizon',
  'Q-' || p."businessKey",
  p."id",
  NOW()
FROM "Project" p
WHERE p."organizationId" = 'org_horizon';

INSERT INTO "QuoteVersion" (
  "id", "organizationId", "quoteId", "versionNumber", "status", "observationType", "authorityState",
  "currency", "amountBeforeTax", "taxAmount", "totalAmount", "approvedAt", "createdAt"
) VALUES
  ('qv_xinyi_026_v3', 'org_horizon', 'quote_prj_xinyi_026', 3, 'INTERNAL_REVIEW', 'QUOTED_PRICE', 'HUMAN_REVIEWED', 'TWD', 16480000.00, 824000.00, 17304000.00, NULL, NOW()),
  ('qv_neihu_021_v2', 'org_horizon', 'quote_prj_neihu_021', 2, 'FINAL', 'QUOTED_PRICE', 'APPROVED_COMMERCIAL', 'TWD', 15120000.00, 756000.00, 15876000.00, DATE '2025-02-01', NOW()),
  ('qv_zhongshan_018_v2', 'org_horizon', 'quote_prj_zhongshan_018', 2, 'FINAL', 'QUOTED_PRICE', 'APPROVED_COMMERCIAL', 'TWD', 13950000.00, 697500.00, 14647500.00, DATE '2024-07-01', NOW()),
  ('qv_nanjing_023_v2', 'org_horizon', 'quote_prj_nanjing_023', 2, 'FINAL', 'QUOTED_PRICE', 'APPROVED_COMMERCIAL', 'TWD', 17300000.00, 865000.00, 18165000.00, DATE '2025-08-10', NOW()),
  ('qv_daan_016_v2', 'org_horizon', 'quote_prj_daan_016', 2, 'FINAL', 'QUOTED_PRICE', 'APPROVED_COMMERCIAL', 'TWD', 12800000.00, 640000.00, 13440000.00, DATE '2023-12-01', NOW()),
  ('qv_songshan_020_v2', 'org_horizon', 'quote_prj_songshan_020', 2, 'FINAL', 'QUOTED_PRICE', 'APPROVED_COMMERCIAL', 'TWD', 14900000.00, 745000.00, 15645000.00, DATE '2024-10-01', NOW()),
  ('qv_banqiao_015_v2', 'org_horizon', 'quote_prj_banqiao_015', 2, 'FINAL', 'QUOTED_PRICE', 'APPROVED_COMMERCIAL', 'TWD', 16200000.00, 810000.00, 17010000.00, DATE '2023-04-01', NOW());

INSERT INTO "QuoteVersion" (
  "id", "organizationId", "quoteId", "versionNumber", "status", "observationType", "authorityState",
  "currency", "amountBeforeTax", "taxAmount", "totalAmount", "approvedAt", "createdAt"
)
SELECT
  'qv_' || lower(replace(p."businessKey", '-', '_')) || '_v2',
  'org_horizon',
  'quote_' || lower(replace(p."businessKey", '-', '_')),
  2,
  CASE WHEN p."status" = 'COMPLETED' THEN 'FINAL' ELSE 'DRAFT' END,
  'QUOTED_PRICE',
  CASE WHEN p."status" = 'COMPLETED' THEN 'APPROVED_COMMERCIAL'::"AuthorityState" ELSE 'HUMAN_REVIEWED'::"AuthorityState" END,
  'TWD',
  CASE WHEN p."status" = 'COMPLETED'
    THEN (7600000 + row_number() OVER (ORDER BY p."businessKey") * 275000)::numeric(20,2)
    ELSE (10800000 + row_number() OVER (ORDER BY p."businessKey") * 310000)::numeric(20,2)
  END,
  CASE WHEN p."status" = 'COMPLETED'
    THEN round((7600000 + row_number() OVER (ORDER BY p."businessKey") * 275000) * 0.05, 2)
    ELSE round((10800000 + row_number() OVER (ORDER BY p."businessKey") * 310000) * 0.05, 2)
  END,
  CASE WHEN p."status" = 'COMPLETED'
    THEN round((7600000 + row_number() OVER (ORDER BY p."businessKey") * 275000) * 1.05, 2)
    ELSE round((10800000 + row_number() OVER (ORDER BY p."businessKey") * 310000) * 1.05, 2)
  END,
  CASE WHEN p."status" = 'COMPLETED' THEN p."startDate" ELSE NULL END,
  NOW()
FROM "Project" p
WHERE p."organizationId" = 'org_horizon'
  AND p."businessKey" NOT IN ('PRJ-XINYI-026','PRJ-NEIHU-021','PRJ-ZHONGSHAN-018','PRJ-NANJING-023','PRJ-DAAN-016','PRJ-SONGSHAN-020','PRJ-BANQIAO-015');

INSERT INTO "QuoteVersion" (
  "id", "organizationId", "quoteId", "versionNumber", "status", "observationType", "authorityState",
  "currency", "amountBeforeTax", "taxAmount", "totalAmount", "supersededById", "createdAt"
) VALUES
  ('qv_xinyi_026_v2', 'org_horizon', 'quote_prj_xinyi_026', 2, 'SUPERSEDED', 'QUOTED_PRICE', 'SUPERSEDED', 'TWD', 15920000.00, 796000.00, 16716000.00, 'qv_xinyi_026_v3', NOW()),
  ('qv_xinyi_026_v1', 'org_horizon', 'quote_prj_xinyi_026', 1, 'SUPERSEDED', 'QUOTED_PRICE', 'SUPERSEDED', 'TWD', 15400000.00, 770000.00, 16170000.00, 'qv_xinyi_026_v2', NOW()),
  ('qv_neihu_021_v1', 'org_horizon', 'quote_prj_neihu_021', 1, 'SUPERSEDED', 'QUOTED_PRICE', 'SUPERSEDED', 'TWD', 14650000.00, 732500.00, 15382500.00, 'qv_neihu_021_v2', NOW()),
  ('qv_zhongshan_018_v1', 'org_horizon', 'quote_prj_zhongshan_018', 1, 'SUPERSEDED', 'QUOTED_PRICE', 'SUPERSEDED', 'TWD', 13500000.00, 675000.00, 14175000.00, 'qv_zhongshan_018_v2', NOW()),
  ('qv_nanjing_023_v1', 'org_horizon', 'quote_prj_nanjing_023', 1, 'SUPERSEDED', 'QUOTED_PRICE', 'SUPERSEDED', 'TWD', 16800000.00, 840000.00, 17640000.00, 'qv_nanjing_023_v2', NOW()),
  ('qv_daan_016_v1', 'org_horizon', 'quote_prj_daan_016', 1, 'SUPERSEDED', 'QUOTED_PRICE', 'SUPERSEDED', 'TWD', 12400000.00, 620000.00, 13020000.00, 'qv_daan_016_v2', NOW()),
  ('qv_songshan_020_v1', 'org_horizon', 'quote_prj_songshan_020', 1, 'SUPERSEDED', 'QUOTED_PRICE', 'SUPERSEDED', 'TWD', 14450000.00, 722500.00, 15172500.00, 'qv_songshan_020_v2', NOW()),
  ('qv_banqiao_015_v1', 'org_horizon', 'quote_prj_banqiao_015', 1, 'SUPERSEDED', 'QUOTED_PRICE', 'SUPERSEDED', 'TWD', 15600000.00, 780000.00, 16380000.00, 'qv_banqiao_015_v2', NOW());

INSERT INTO "QuoteVersion" (
  "id", "organizationId", "quoteId", "versionNumber", "status", "observationType", "authorityState",
  "currency", "amountBeforeTax", "taxAmount", "totalAmount", "supersededById", "createdAt"
)
SELECT
  'qv_' || lower(replace(p."businessKey", '-', '_')) || '_v1',
  'org_horizon',
  'quote_' || lower(replace(p."businessKey", '-', '_')),
  1,
  'SUPERSEDED',
  'QUOTED_PRICE',
  'SUPERSEDED',
  'TWD',
  round(v2."amountBeforeTax" * 0.96, 2),
  round(v2."amountBeforeTax" * 0.96 * 0.05, 2),
  round(v2."amountBeforeTax" * 0.96 * 1.05, 2),
  v2."id",
  NOW()
FROM "Project" p
JOIN "QuoteVersion" v2 ON v2."quoteId" = 'quote_' || lower(replace(p."businessKey", '-', '_')) AND v2."versionNumber" = 2
WHERE p."organizationId" = 'org_horizon'
  AND p."businessKey" BETWEEN 'PRJ-HIST-001' AND 'PRJ-HIST-009';

WITH canonical(version_id, line_number, category_id, description_en, description_zh, amount, supplier_id, material_id) AS (
  VALUES
    ('qv_xinyi_026_v3',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',4000000.00,NULL,'material_ceiling'),
    ('qv_xinyi_026_v3',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',3800000.00,'supplier_millwork_01','material_custom_millwork'),
    ('qv_xinyi_026_v3',3,'LIGHTING_ELECTRICAL','Premium lighting and electrical package','高規格照明與電氣',3100000.00,'supplier_lighting_01','material_premium_lighting'),
    ('qv_xinyi_026_v3',4,'IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',3000000.00,'supplier_stone_01','material_imported_stone'),
    ('qv_xinyi_026_v3',5,'SIGNAGE','Signage and display installation','標示與展示安裝',1140000.00,'supplier_signage_01','material_signage'),
    ('qv_xinyi_026_v3',6,'COORDINATION','Site coordination and handover','現場協調與交付',1440000.00,NULL,'material_coordination'),
    ('qv_neihu_021_v2',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',3700000.00,NULL,'material_ceiling'),
    ('qv_neihu_021_v2',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',3600000.00,'supplier_millwork_01','material_custom_millwork'),
    ('qv_neihu_021_v2',3,'LIGHTING_ELECTRICAL','Domestic lighting package','國產燈具組',2700000.00,'supplier_lighting_02','material_domestic_lighting'),
    ('qv_neihu_021_v2',4,'IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',2000000.00,'supplier_stone_01','material_imported_stone'),
    ('qv_neihu_021_v2',5,'SIGNAGE','Signage and display installation','標示與展示安裝',1150000.00,'supplier_signage_01','material_signage'),
    ('qv_neihu_021_v2',6,'COORDINATION','Site coordination and handover','現場協調與交付',1970000.00,NULL,'material_coordination'),
    ('qv_zhongshan_018_v2',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',3400000.00,NULL,'material_ceiling'),
    ('qv_zhongshan_018_v2',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',3200000.00,'supplier_millwork_02','material_custom_millwork'),
    ('qv_zhongshan_018_v2',3,'LIGHTING_ELECTRICAL','Lighting and electrical package','照明與電氣',2844000.00,'supplier_lighting_01','material_premium_lighting'),
    ('qv_zhongshan_018_v2',4,'IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',1900000.00,'supplier_stone_02','material_imported_stone'),
    ('qv_zhongshan_018_v2',5,'SIGNAGE','Signage and display installation','標示與展示安裝',1200000.00,'supplier_signage_01','material_signage'),
    ('qv_zhongshan_018_v2',6,'COORDINATION','Site coordination and handover','現場協調與交付',1406000.00,NULL,'material_coordination'),
    ('qv_nanjing_023_v2',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',4200000.00,NULL,'material_ceiling'),
    ('qv_nanjing_023_v2',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',4200000.00,'supplier_millwork_01','material_custom_millwork'),
    ('qv_nanjing_023_v2',3,'LIGHTING_ELECTRICAL','Lighting and electrical package','照明與電氣',3000000.00,'supplier_lighting_01','material_premium_lighting'),
    ('qv_nanjing_023_v2',4,'IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',2400000.00,'supplier_stone_01','material_imported_stone'),
    ('qv_nanjing_023_v2',5,'SIGNAGE','Signage and display installation','標示與展示安裝',1250000.00,'supplier_signage_01','material_signage'),
    ('qv_nanjing_023_v2',6,'COORDINATION','Site coordination and handover','現場協調與交付',2250000.00,NULL,'material_coordination')
)
INSERT INTO "QuoteItem" (
  "id", "organizationId", "quoteVersionId", "lineNumber", "categoryId", "descriptionEn", "descriptionZhTw",
  "quantity", "unit", "unitPrice", "amount", "authorityState", "supplierId", "materialId", "createdAt"
)
SELECT
  'qi_' || replace(c.version_id, 'qv_', '') || '_' || c.line_number,
  'org_horizon', c.version_id, c.line_number, c.category_id, c.description_en, c.description_zh,
  1.000, 'lot', c.amount, c.amount, qv."authorityState", c.supplier_id, c.material_id, NOW()
FROM canonical c
JOIN "QuoteVersion" qv ON qv."id" = c.version_id;

WITH weights(line_number, category_id, description_en, description_zh, weight, supplier_id, material_id) AS (
  VALUES
    (1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',0.25::numeric,NULL::text,'material_ceiling'::text),
    (2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',0.23::numeric,'supplier_millwork_01','material_custom_millwork'),
    (3,'LIGHTING_ELECTRICAL','Lighting and electrical package','照明與電氣',0.18::numeric,'supplier_lighting_01','material_premium_lighting'),
    (4,'IMPORTED_STONE','Stone and hard finishes','石材與硬質面材',0.14::numeric,'supplier_stone_01','material_imported_stone'),
    (5,'SIGNAGE','Signage and display installation','標示與展示安裝',0.08::numeric,'supplier_signage_01','material_signage'),
    (6,'COORDINATION','Site coordination and handover','現場協調與交付',0.12::numeric,NULL::text,'material_coordination'::text)
)
INSERT INTO "QuoteItem" (
  "id", "organizationId", "quoteVersionId", "lineNumber", "categoryId", "descriptionEn", "descriptionZhTw",
  "quantity", "unit", "unitPrice", "amount", "authorityState", "supplierId", "materialId", "createdAt"
)
SELECT
  'qi_' || replace(qv."id", 'qv_', '') || '_' || w.line_number,
  'org_horizon', qv."id", w.line_number, w.category_id, w.description_en, w.description_zh,
  1.000, 'lot', round(qv."amountBeforeTax" * w.weight, 2), round(qv."amountBeforeTax" * w.weight, 2),
  qv."authorityState", w.supplier_id, w.material_id, NOW()
FROM "QuoteVersion" qv
CROSS JOIN weights w
WHERE qv."organizationId" = 'org_horizon'
  AND qv."id" NOT IN ('qv_xinyi_026_v3','qv_neihu_021_v2','qv_zhongshan_018_v2','qv_nanjing_023_v2');

INSERT INTO "ForecastCostVersion" (
  "id", "organizationId", "projectId", "versionNumber", "authorityState", "observationType",
  "currency", "totalDirectCost", "effectiveAt", "createdAt"
) VALUES
  ('fcv_xinyi_026_v1', 'org_horizon', 'prj_xinyi_026', 1, 'HUMAN_REVIEWED', 'FORECAST_DIRECT_COST', 'TWD', 12650000.00, DATE '2026-11-14', NOW());

WITH lines(line_number, category_id, description_en, description_zh, amount, supplier_id, material_id) AS (
  VALUES
    (1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',3100000.00,NULL::text,'material_ceiling'::text),
    (2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',3060000.00,'supplier_millwork_01','material_custom_millwork'),
    (3,'LIGHTING_ELECTRICAL','Premium lighting and electrical package','高規格照明與電氣',2350000.00,'supplier_lighting_01','material_premium_lighting'),
    (4,'IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',2360000.00,'supplier_stone_01','material_imported_stone'),
    (5,'SIGNAGE','Signage and display installation','標示與展示安裝',650000.00,'supplier_signage_01','material_signage'),
    (6,'COORDINATION','Site coordination and handover','現場協調與交付',1130000.00,NULL::text,'material_coordination'::text)
)
INSERT INTO "ForecastCostLine" (
  "id", "organizationId", "forecastCostVersionId", "lineNumber", "categoryId", "descriptionEn", "descriptionZhTw",
  "quantity", "unit", "unitCost", "amount", "authorityState", "supplierId", "materialId", "createdAt"
)
SELECT
  'fcl_xinyi_026_' || line_number, 'org_horizon', 'fcv_xinyi_026_v1', line_number, category_id,
  description_en, description_zh, 1.000, 'lot', amount, amount, 'HUMAN_REVIEWED', supplier_id, material_id, NOW()
FROM lines;

INSERT INTO "ProjectCostVersion" (
  "id", "organizationId", "projectId", "versionNumber", "authorityState", "observationType",
  "currency", "totalDirectCost", "reconciledAt", "createdAt"
) VALUES
  ('pcv_neihu_021_v1', 'org_horizon', 'prj_neihu_021', 1, 'RECONCILED_ACTUAL', 'RECONCILED_ACTUAL_COST', 'TWD', 11580000.00, DATE '2025-07-20', NOW()),
  ('pcv_zhongshan_018_v1', 'org_horizon', 'prj_zhongshan_018', 1, 'RECONCILED_ACTUAL', 'RECONCILED_ACTUAL_COST', 'TWD', 10840000.00, DATE '2024-12-20', NOW()),
  ('pcv_nanjing_023_v1', 'org_horizon', 'prj_nanjing_023', 1, 'RECONCILED_ACTUAL', 'RECONCILED_ACTUAL_COST', 'TWD', 13420000.00, DATE '2026-03-10', NOW()),
  ('pcv_daan_016_v1', 'org_horizon', 'prj_daan_016', 1, 'RECONCILED_ACTUAL', 'RECONCILED_ACTUAL_COST', 'TWD', 9950000.00, DATE '2024-05-30', NOW()),
  ('pcv_songshan_020_v1', 'org_horizon', 'prj_songshan_020', 1, 'RECONCILED_ACTUAL', 'RECONCILED_ACTUAL_COST', 'TWD', 11650000.00, DATE '2025-04-05', NOW()),
  ('pcv_banqiao_015_v1', 'org_horizon', 'prj_banqiao_015', 1, 'RECONCILED_ACTUAL', 'RECONCILED_ACTUAL_COST', 'TWD', 12750000.00, DATE '2023-11-01', NOW());

INSERT INTO "ProjectCostVersion" (
  "id", "organizationId", "projectId", "versionNumber", "authorityState", "observationType",
  "currency", "totalDirectCost", "reconciledAt", "createdAt"
)
SELECT
  'pcv_' || lower(replace(p."businessKey", '-', '_')) || '_v1',
  'org_horizon', p."id", 1, 'RECONCILED_ACTUAL', 'RECONCILED_ACTUAL_COST', 'TWD',
  (5700000 + row_number() OVER (ORDER BY p."businessKey") * 185000)::numeric(20,2),
  (p."completedAt" + 30)::date,
  NOW()
FROM "Project" p
WHERE p."organizationId" = 'org_horizon' AND p."businessKey" LIKE 'PRJ-HIST-%';

WITH lines(version_id, line_number, category_id, description_en, description_zh, amount, supplier_id, material_id) AS (
  VALUES
    ('pcv_neihu_021_v1',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',2700000.00,NULL::text,'material_ceiling'::text),
    ('pcv_neihu_021_v1',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',3000000.00,'supplier_millwork_01','material_custom_millwork'),
    ('pcv_neihu_021_v1',3,'LIGHTING_ELECTRICAL','Domestic lighting package','國產燈具組',2000000.00,'supplier_lighting_02','material_domestic_lighting'),
    ('pcv_neihu_021_v1',4,'IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',1900000.00,'supplier_stone_01','material_imported_stone'),
    ('pcv_neihu_021_v1',5,'SIGNAGE','Signage and display installation','標示與展示安裝',700000.00,'supplier_signage_01','material_signage'),
    ('pcv_neihu_021_v1',6,'COORDINATION','Site coordination and handover','現場協調與交付',1280000.00,NULL::text,'material_coordination'::text),
    ('pcv_zhongshan_018_v1',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',2500000.00,NULL::text,'material_ceiling'::text),
    ('pcv_zhongshan_018_v1',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',2900000.00,'supplier_millwork_02','material_custom_millwork'),
    ('pcv_zhongshan_018_v1',3,'LIGHTING_ELECTRICAL','Lighting and electrical package','照明與電氣',1900000.00,'supplier_lighting_01','material_premium_lighting'),
    ('pcv_zhongshan_018_v1',4,'IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',2000000.00,'supplier_stone_02','material_imported_stone'),
    ('pcv_zhongshan_018_v1',5,'SIGNAGE','Signage and display installation','標示與展示安裝',650000.00,'supplier_signage_01','material_signage'),
    ('pcv_zhongshan_018_v1',6,'COORDINATION','Site coordination and handover','現場協調與交付',890000.00,NULL::text,'material_coordination'::text),
    ('pcv_nanjing_023_v1',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',3300000.00,NULL::text,'material_ceiling'::text),
    ('pcv_nanjing_023_v1',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',3200000.00,'supplier_millwork_01','material_custom_millwork'),
    ('pcv_nanjing_023_v1',3,'IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',2100000.00,'supplier_stone_01','material_imported_stone'),
    ('pcv_nanjing_023_v1',4,'SIGNAGE','Signage and display installation','標示與展示安裝',850000.00,'supplier_signage_01','material_signage'),
    ('pcv_nanjing_023_v1',5,'COORDINATION','Site coordination and handover','現場協調與交付',3970000.00,NULL::text,'material_coordination'::text),
    ('pcv_daan_016_v1',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',2450000.00,NULL::text,'material_ceiling'::text),
    ('pcv_daan_016_v1',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',2800000.00,'supplier_millwork_02','material_custom_millwork'),
    ('pcv_daan_016_v1',3,'IMPORTED_STONE','Stone and hard finishes','石材與硬質面材',1750000.00,'supplier_stone_02','material_domestic_stone'),
    ('pcv_daan_016_v1',4,'SIGNAGE','Signage and display installation','標示與展示安裝',600000.00,'supplier_signage_01','material_signage'),
    ('pcv_daan_016_v1',5,'COORDINATION','Site coordination and handover','現場協調與交付',2350000.00,NULL::text,'material_coordination'::text),
    ('pcv_songshan_020_v1',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',2900000.00,NULL::text,'material_ceiling'::text),
    ('pcv_songshan_020_v1',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',3050000.00,'supplier_millwork_01','material_custom_millwork'),
    ('pcv_songshan_020_v1',3,'IMPORTED_STONE','Stone and hard finishes','石材與硬質面材',1900000.00,'supplier_stone_02','material_domestic_stone'),
    ('pcv_songshan_020_v1',4,'SIGNAGE','Signage and display installation','標示與展示安裝',700000.00,'supplier_signage_01','material_signage'),
    ('pcv_songshan_020_v1',5,'COORDINATION','Site coordination and handover','現場協調與交付',3100000.00,NULL::text,'material_coordination'::text),
    ('pcv_banqiao_015_v1',1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',3100000.00,NULL::text,'material_ceiling'::text),
    ('pcv_banqiao_015_v1',2,'CUSTOM_MILLWORK','Custom retail millwork','客製展示木作',3250000.00,'supplier_millwork_02','material_custom_millwork'),
    ('pcv_banqiao_015_v1',3,'IMPORTED_STONE','Stone and hard finishes','石材與硬質面材',2100000.00,'supplier_stone_02','material_domestic_stone'),
    ('pcv_banqiao_015_v1',4,'SIGNAGE','Signage and display installation','標示與展示安裝',800000.00,'supplier_signage_01','material_signage'),
    ('pcv_banqiao_015_v1',5,'COORDINATION','Site coordination and handover','現場協調與交付',3500000.00,NULL::text,'material_coordination'::text)
)
INSERT INTO "CostLine" (
  "id", "organizationId", "projectCostVersionId", "lineNumber", "categoryId", "descriptionEn", "descriptionZhTw",
  "quantity", "unit", "unitCost", "amount", "authorityState", "supplierId", "materialId", "createdAt"
)
SELECT
  'cl_' || replace(l.version_id, 'pcv_', '') || '_' || l.line_number,
  'org_horizon', l.version_id, l.line_number, l.category_id, l.description_en, l.description_zh,
  1.000, 'lot', l.amount, l.amount, 'RECONCILED_ACTUAL', l.supplier_id, l.material_id, NOW()
FROM lines l;

WITH weights(line_number, category_id, description_en, description_zh, weight, supplier_id, material_id) AS (
  VALUES
    (1,'DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',0.23::numeric,NULL::text,'material_ceiling'::text),
    (2,'CUSTOM_MILLWORK','Custom workplace millwork','客製辦公木作',0.25::numeric,'supplier_millwork_01','material_custom_millwork'),
    (3,'LIGHTING_ELECTRICAL','Lighting and electrical package','照明與電氣',0.18::numeric,'supplier_lighting_01','material_premium_lighting'),
    (4,'IMPORTED_STONE','Stone and hard finishes','石材與硬質面材',0.14::numeric,'supplier_stone_02','material_domestic_stone'),
    (5,'SIGNAGE','Signage and wayfinding','標示與導視',0.08::numeric,'supplier_signage_01','material_signage'),
    (6,'COORDINATION','Site coordination and handover','現場協調與交付',0.12::numeric,NULL::text,'material_coordination'::text)
)
INSERT INTO "CostLine" (
  "id", "organizationId", "projectCostVersionId", "lineNumber", "categoryId", "descriptionEn", "descriptionZhTw",
  "quantity", "unit", "unitCost", "amount", "authorityState", "supplierId", "materialId", "createdAt"
)
SELECT
  'cl_' || replace(pcv."id", 'pcv_', '') || '_' || w.line_number,
  'org_horizon', pcv."id", w.line_number, w.category_id, w.description_en, w.description_zh,
  1.000, 'lot', round(pcv."totalDirectCost" * w.weight, 2), round(pcv."totalDirectCost" * w.weight, 2),
  'RECONCILED_ACTUAL', w.supplier_id, w.material_id, NOW()
FROM "ProjectCostVersion" pcv
JOIN "Project" p ON p."id" = pcv."projectId"
CROSS JOIN weights w
WHERE p."businessKey" LIKE 'PRJ-HIST-%';

INSERT INTO "ProjectCostVersion" (
  "id", "organizationId", "projectId", "versionNumber", "authorityState", "observationType",
  "currency", "totalDirectCost", "reconciledAt", "createdAt"
) VALUES
  ('pcv_hist_018_conflict_v2', 'org_horizon', 'prj_hist_018', 2, 'CONFLICTED', 'RECONCILED_ACTUAL_COST', 'TWD', 9150000.00, DATE '2025-01-15', NOW());

INSERT INTO "CostLine" (
  "id", "organizationId", "projectCostVersionId", "lineNumber", "categoryId", "descriptionEn", "descriptionZhTw",
  "quantity", "unit", "unitCost", "amount", "authorityState", "supplierId", "materialId", "createdAt"
) VALUES
  ('cl_hist_018_conflict_stone', 'org_horizon', 'pcv_hist_018_conflict_v2', 1, 'IMPORTED_STONE', 'Conflicting stone closeout value', '石材結案數值不一致', 1.000, 'lot', 2150000.00, 2150000.00, 'CONFLICTED', 'supplier_stone_02', 'material_domestic_stone', NOW());

INSERT INTO "SupplierOffer" (
  "id", "organizationId", "businessKey", "supplierId", "projectId", "authorityState", "observationType",
  "currency", "amountBeforeTax", "offeredAt", "validUntil", "createdAt"
) VALUES
  ('offer_stone_2025_041', 'org_horizon', 'SUP-OFFER-STONE-2025-041', 'supplier_stone_01', 'prj_neihu_021', 'APPROVED_COMMERCIAL', 'SUPPLIER_OFFER', 'TWD', 1850000.00, DATE '2025-01-15', DATE '2025-02-15', NOW()),
  ('offer_stone_2026_114', 'org_horizon', 'SUP-OFFER-STONE-2026-114', 'supplier_stone_01', 'prj_xinyi_026', 'HUMAN_REVIEWED', 'SUPPLIER_OFFER', 'TWD', 2420000.00, DATE '2026-11-10', DATE '2026-12-10', NOW());

INSERT INTO "SupplierOfferItem" (
  "id", "organizationId", "supplierOfferId", "lineNumber", "categoryId", "descriptionEn", "descriptionZhTw",
  "quantity", "unit", "unitPrice", "amount", "materialId", "createdAt"
) VALUES
  ('soi_stone_2025_041_1', 'org_horizon', 'offer_stone_2025_041', 1, 'IMPORTED_STONE', 'Imported stone supply and fabrication', '進口石材供應與加工', 1.000, 'lot', 1850000.00, 1850000.00, 'material_imported_stone', NOW()),
  ('soi_stone_2026_114_1', 'org_horizon', 'offer_stone_2026_114', 1, 'IMPORTED_STONE', 'Imported stone supply and fabrication', '進口石材供應與加工', 1.000, 'lot', 2420000.00, 2420000.00, 'material_imported_stone', NOW());

INSERT INTO "EvidenceReference" (
  "id", "organizationId", "subjectType", "subjectId", "documentVersionId", "locator", "claimKey",
  "supportedValue", "authorityState", "dataClassification", "effectiveAt", "createdAt"
)
SELECT
  'evid_doc_' || replace(dv."id", 'dv_', ''),
  'org_horizon', 'DOCUMENT_VERSION', dv."id", dv."id",
  jsonb_build_object('kind', 'document-version', 'version', dv."versionLabel"),
  'document:version',
  jsonb_build_object('documentVersionId', dv."id"),
  dv."authorityState", 'DEMO_SYNTHETIC', dv."effectiveAt", NOW()
FROM "DocumentVersion" dv
WHERE dv."organizationId" = 'org_horizon';

INSERT INTO "EvidenceReference" (
  "id", "organizationId", "subjectType", "subjectId", "documentVersionId", "locator", "claimKey",
  "supportedValue", "authorityState", "observationType", "dataClassification", "effectiveAt", "createdAt"
)
SELECT
  'evid_cost_' || cl."id",
  'org_horizon', 'COST_LINE', cl."id",
  'dv_' || lower(replace(p."businessKey", '-', '_')) || '_3',
  jsonb_build_object('kind', 'cost-line', 'lineNumber', cl."lineNumber", 'categoryId', cl."categoryId"),
  'actual-cost:' || cl."categoryId",
  jsonb_build_object('amount', cl."amount", 'currency', pcv."currency", 'unit', cl."unit"),
  cl."authorityState", 'RECONCILED_ACTUAL_COST', 'DEMO_SYNTHETIC', pcv."reconciledAt", NOW()
FROM "CostLine" cl
JOIN "ProjectCostVersion" pcv ON pcv."id" = cl."projectCostVersionId"
JOIN "Project" p ON p."id" = pcv."projectId"
WHERE cl."organizationId" = 'org_horizon';

INSERT INTO "EvidenceReference" (
  "id", "organizationId", "subjectType", "subjectId", "documentVersionId", "locator", "claimKey",
  "supportedValue", "authorityState", "observationType", "dataClassification", "effectiveAt", "createdAt"
)
SELECT
  'evid_quote_' || qi."id",
  'org_horizon', 'QUOTE_ITEM', qi."id",
  'dv_' || lower(replace(p."businessKey", '-', '_')) || '_2',
  jsonb_build_object('kind', 'quote-item', 'lineNumber', qi."lineNumber", 'categoryId', qi."categoryId"),
  'quoted-price:' || qi."categoryId",
  jsonb_build_object('amount', qi."amount", 'currency', qv."currency", 'unit', qi."unit"),
  qi."authorityState", 'QUOTED_PRICE', 'DEMO_SYNTHETIC', COALESCE(qv."approvedAt", DATE '2026-11-14'), NOW()
FROM "QuoteItem" qi
JOIN "QuoteVersion" qv ON qv."id" = qi."quoteVersionId"
JOIN "Quote" q ON q."id" = qv."quoteId"
JOIN "Project" p ON p."id" = q."projectId"
WHERE qi."organizationId" = 'org_horizon';

INSERT INTO "EvidenceReference" (
  "id", "organizationId", "subjectType", "subjectId", "documentVersionId", "locator", "claimKey",
  "supportedValue", "authorityState", "observationType", "dataClassification", "effectiveAt", "createdAt"
) VALUES
  ('evid_offer_stale_stone', 'org_horizon', 'SUPPLIER_OFFER', 'offer_stone_2025_041', 'dv_prj_neihu_021_2', jsonb_build_object('kind','supplier-offer','offerId','SUP-OFFER-STONE-2025-041'), 'supplier-offer:stone', jsonb_build_object('amount',1850000,'currency','TWD'), 'APPROVED_COMMERCIAL', 'SUPPLIER_OFFER', 'DEMO_SYNTHETIC', DATE '2025-01-15', NOW()),
  ('evid_offer_current_stone', 'org_horizon', 'SUPPLIER_OFFER', 'offer_stone_2026_114', 'dv_prj_xinyi_026_2', jsonb_build_object('kind','supplier-offer','offerId','SUP-OFFER-STONE-2026-114'), 'supplier-offer:stone', jsonb_build_object('amount',2420000,'currency','TWD'), 'HUMAN_REVIEWED', 'SUPPLIER_OFFER', 'DEMO_SYNTHETIC', DATE '2026-11-10', NOW());

INSERT INTO "EvidenceConflict" (
  "id", "organizationId", "conflictKey", "primaryEvidenceId", "conflictingEvidenceId", "status", "createdAt", "updatedAt"
) VALUES
  ('conflict_hist_018_stone', 'org_horizon', 'final-cost:PRJ-HIST-018:IMPORTED_STONE', 'evid_cost_cl_prj_hist_018_v1_4', 'evid_cost_cl_hist_018_conflict_stone', 'OPEN', NOW(), NOW());

ALTER TABLE "AuditEvent" ENABLE TRIGGER "AuditEvent_append_only";
ALTER TABLE "Action" ENABLE TRIGGER "Action_stage8_immutable";
ALTER TABLE "ProposedAction" ENABLE TRIGGER "ProposedAction_stage8_immutable";
ALTER TABLE "InternalReviewReceipt" ENABLE TRIGGER "InternalReviewReceipt_immutable";

DO $$
BEGIN
  IF (SELECT count(*) FROM pg_trigger
      WHERE tgname IN ('AuditEvent_append_only', 'Action_stage8_immutable',
        'ProposedAction_stage8_immutable', 'InternalReviewReceipt_immutable')
        AND NOT tgisinternal AND tgenabled = 'O') <> 4 THEN
    RAISE EXCEPTION 'SYNTHETIC_FIXTURE_IMMUTABILITY_NOT_RESTORED';
  END IF;
END $$;

COMMIT;
