-- Second active synthetic job. Existing projects/financial values are not changed.
BEGIN;
INSERT INTO "Project"
SELECT (jsonb_populate_record(NULL::"Project", to_jsonb(p) || jsonb_build_object(
  'id','prj_riverside_044','businessKey','J-2611-R7K3',
  'nameEn','Riverside Display Studio','nameZhTw','河岸展示工作室',
  'programmeWeeks',20,'commercialCategoryIds',jsonb_build_array('CUSTOM_MILLWORK','SIGNAGE')
))).* FROM "Project" p WHERE p.id='prj_xinyi_026'
ON CONFLICT (id) DO NOTHING;
INSERT INTO "ProjectAssignment"
SELECT (jsonb_populate_record(NULL::"ProjectAssignment", to_jsonb(a) || jsonb_build_object(
  'id','assign_riverside_' || a."membershipId",'projectId','prj_riverside_044'
))).* FROM "ProjectAssignment" a WHERE a."projectId"='prj_xinyi_026'
ON CONFLICT (id) DO NOTHING;
INSERT INTO "ProjectScope"
SELECT (jsonb_populate_record(NULL::"ProjectScope", to_jsonb(s) || jsonb_build_object(
  'id','scope_riverside_' || s."categoryId",'projectId','prj_riverside_044'
))).* FROM "ProjectScope" s WHERE s."projectId"='prj_xinyi_026' AND s."categoryId" IN ('CUSTOM_MILLWORK','SIGNAGE')
ON CONFLICT (id) DO NOTHING;
INSERT INTO "ProjectMaterial" (id,"organizationId","projectId","materialId",relationship,"createdAt") VALUES
('pm_riverside_mill','org_horizon','prj_riverside_044','material_custom_millwork','PROPOSED',now()),
('pm_riverside_sign','org_horizon','prj_riverside_044','material_signage','PROPOSED',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "ProjectSupplier" (id,"organizationId","projectId","supplierId",relationship,"createdAt") VALUES
('ps_riverside_mill','org_horizon','prj_riverside_044','supplier_millwork_01','PROPOSED',now()),
('ps_riverside_sign','org_horizon','prj_riverside_044','supplier_signage_01','PROPOSED',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "Document" (id,"organizationId","businessKey","projectId","titleEn","titleZhTw","documentType","dataClassification","createdAt","updatedAt") VALUES
('doc_riverside_044','org_horizon','DOC-RIVERSIDE-044','prj_riverside_044','Riverside scope, quote and forecast register','河岸範疇、報價與預估紀錄','QUOTE_REGISTER','DEMO_SYNTHETIC',now(),now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "DocumentVersion" (id,"organizationId","documentId","versionLabel","authorityState","effectiveAt",checksum,metadata,"createdAt") VALUES
('dv_riverside_044','org_horizon','doc_riverside_044','v1','HUMAN_REVIEWED','2026-11-14',md5('synthetic-riverside-044-v1'),'{"fixture":true}',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "Quote" (id,"organizationId","businessKey","projectId","createdAt") VALUES
('quote_riverside_044','org_horizon','Q-RIVERSIDE-044','prj_riverside_044',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "QuoteVersion" (id,"organizationId","quoteId","versionNumber",status,"observationType","authorityState",currency,"amountBeforeTax","taxAmount","totalAmount","createdAt") VALUES
('qv_riverside_044_v1','org_horizon','quote_riverside_044',1,'INTERNAL_REVIEW','QUOTED_PRICE','HUMAN_REVIEWED','TWD',6400000,320000,6720000,now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "QuoteItem" (id,"organizationId","quoteVersionId","lineNumber","categoryId","descriptionEn","descriptionZhTw",quantity,unit,"unitPrice",amount,"authorityState","supplierId","materialId","createdAt") VALUES
('qi_riverside_044_mill','org_horizon','qv_riverside_044_v1',1,'CUSTOM_MILLWORK','Custom display millwork','客製展示木作',1,'lot',6000000,6000000,'HUMAN_REVIEWED','supplier_millwork_01','material_custom_millwork',now()),
('qi_riverside_044_sign','org_horizon','qv_riverside_044_v1',2,'SIGNAGE','Display signage','展示標示',1,'lot',400000,400000,'HUMAN_REVIEWED','supplier_signage_01','material_signage',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "ForecastCostVersion" (id,"organizationId","projectId","versionNumber","authorityState","observationType",currency,"totalDirectCost","effectiveAt","createdAt") VALUES
('fcv_riverside_044_v1','org_horizon','prj_riverside_044',1,'HUMAN_REVIEWED','FORECAST_DIRECT_COST','TWD',5100000,'2026-11-14',now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO "ForecastCostLine" (id,"organizationId","forecastCostVersionId","lineNumber","categoryId","descriptionEn","descriptionZhTw",quantity,unit,"unitCost",amount,"authorityState","supplierId","materialId","createdAt") VALUES
('fcl_riverside_044_mill','org_horizon','fcv_riverside_044_v1',1,'CUSTOM_MILLWORK','Custom display millwork','客製展示木作',1,'lot',4800000,4800000,'HUMAN_REVIEWED','supplier_millwork_01','material_custom_millwork',now()),
('fcl_riverside_044_sign','org_horizon','fcv_riverside_044_v1',2,'SIGNAGE','Display signage','展示標示',1,'lot',300000,300000,'HUMAN_REVIEWED','supplier_signage_01','material_signage',now()) ON CONFLICT (id) DO NOTHING;
WITH facts(id,subject_type,subject_id,claim_key,value,observation) AS (VALUES
('evid_riverside_programme','PROJECT','prj_riverside_044','project:programmeWeeks','{"value":20,"unit":"weeks"}'::jsonb,NULL),
('evid_riverside_quote','QUOTE_VERSION','qv_riverside_044_v1','quoted-price:total','{"amount":6400000,"currency":"TWD"}'::jsonb,'QUOTED_PRICE'),
('evid_riverside_qmill','QUOTE_ITEM','qi_riverside_044_mill','quoted-price:CUSTOM_MILLWORK','{"amount":6000000,"currency":"TWD","unit":"lot"}'::jsonb,'QUOTED_PRICE'),
('evid_riverside_qsign','QUOTE_ITEM','qi_riverside_044_sign','quoted-price:SIGNAGE','{"amount":400000,"currency":"TWD","unit":"lot"}'::jsonb,'QUOTED_PRICE'),
('evid_riverside_forecast','FORECAST_COST_VERSION','fcv_riverside_044_v1','forecast-cost:total','{"amount":5100000,"currency":"TWD"}'::jsonb,'FORECAST_DIRECT_COST'),
('evid_riverside_fmill','FORECAST_COST_LINE','fcl_riverside_044_mill','forecast-cost:CUSTOM_MILLWORK','{"amount":4800000,"currency":"TWD","unit":"lot"}'::jsonb,'FORECAST_DIRECT_COST'),
('evid_riverside_fsign','FORECAST_COST_LINE','fcl_riverside_044_sign','forecast-cost:SIGNAGE','{"amount":300000,"currency":"TWD","unit":"lot"}'::jsonb,'FORECAST_DIRECT_COST'))
INSERT INTO "EvidenceReference" (id,"organizationId","subjectType","subjectId","documentVersionId",locator,"claimKey","supportedValue","authorityState","observationType","dataClassification","effectiveAt","createdAt")
SELECT id,'org_horizon',subject_type::"EvidenceSubjectType",subject_id,'dv_riverside_044',jsonb_build_object('kind','structured-record','recordId',subject_id),claim_key,value,'HUMAN_REVIEWED',observation::"ObservationType",'DEMO_SYNTHETIC','2026-11-14',now() FROM facts
ON CONFLICT (id) DO NOTHING;
COMMIT;
