DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM "Project" WHERE id='prj_riverside_044' AND status='ACTIVE' AND "dataClassification"='DEMO_SYNTHETIC' AND "commercialCategoryIds"=ARRAY['CUSTOM_MILLWORK','SIGNAGE']) THEN RAISE EXCEPTION 'SECOND_ACTIVE_JOB_MISSING'; END IF;
 IF (SELECT array_agg("categoryId" ORDER BY "categoryId") FROM "QuoteItem" WHERE "quoteVersionId"='qv_riverside_044_v1') <> ARRAY['CUSTOM_MILLWORK','SIGNAGE'] THEN RAISE EXCEPTION 'SECOND_JOB_CATEGORIES_INVALID'; END IF;
 IF (SELECT sum(amount) FROM "QuoteItem" WHERE "quoteVersionId"='qv_riverside_044_v1') <> 6400000 OR (SELECT sum(amount) FROM "ForecastCostLine" WHERE "forecastCostVersionId"='fcv_riverside_044_v1') <> 5100000 THEN RAISE EXCEPTION 'SECOND_JOB_TOTAL_MISMATCH'; END IF;
 IF (SELECT count(*) FROM "EvidenceReference" WHERE id LIKE 'evid_riverside_%') <> 7 THEN RAISE EXCEPTION 'SECOND_JOB_EVIDENCE_MISSING'; END IF;
 IF EXISTS (SELECT 1 FROM "QuoteItem" q WHERE q."quoteVersionId"='qv_riverside_044_v1' AND NOT EXISTS (SELECT 1 FROM "EvidenceReference" e WHERE e."organizationId"=q."organizationId" AND e."subjectType"='QUOTE_ITEM' AND e."subjectId"=q.id AND e."documentVersionId"='dv_riverside_044')) THEN RAISE EXCEPTION 'SECOND_JOB_LINE_EVIDENCE_MISSING'; END IF;
END $$;
