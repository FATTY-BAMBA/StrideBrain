-- Synthetic sample opts in; a key and a paid-tier confirmation are still required.
UPDATE "Organization" SET "assistantEnabled" = true WHERE "id" = 'org_horizon';
-- Legacy synthetic rows predate commercialCategoryIds. Keep the same scope-to-price
-- mapping as commercialCategoriesForScope so their Quote tab and assistant agree.
UPDATE "Project" p SET "commercialCategoryIds" = mapped.ids
FROM (
  SELECT "projectId", array_agg(DISTINCT CASE WHEN "categoryId" IN ('SELECTIVE_DEMOLITION','PARTITIONS_CEILINGS') THEN 'DEMOLITION_CEILING' ELSE "categoryId" END ORDER BY CASE WHEN "categoryId" IN ('SELECTIVE_DEMOLITION','PARTITIONS_CEILINGS') THEN 'DEMOLITION_CEILING' ELSE "categoryId" END) AS ids
  FROM "ProjectScope" WHERE "organizationId" = 'org_horizon'
    AND "categoryId" IN ('SELECTIVE_DEMOLITION','PARTITIONS_CEILINGS','DEMOLITION_CEILING','CUSTOM_MILLWORK','LIGHTING_ELECTRICAL','IMPORTED_STONE','SIGNAGE','COORDINATION')
  GROUP BY "projectId"
) mapped WHERE p.id=mapped."projectId" AND p."organizationId"='org_horizon' AND cardinality(p."commercialCategoryIds")=0;
