-- Synthetic fixtures insert organizations after migrations. No starter-firm API is provided.
INSERT INTO "FirmWorkCategory" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"scopeSelectable",aliases,"pricedUnderId","updatedAt")
SELECT md5(o.id||':work-category:'||v.key),o.id,v.key,v.en,v.zh,v.position,v.active,v.key <> 'DEMOLITION_CEILING',v.aliases,
 CASE WHEN v.key IN ('SELECTIVE_DEMOLITION','PARTITIONS_CEILINGS') THEN md5(o.id||':work-category:DEMOLITION_CEILING') ELSE NULL END,
 CURRENT_TIMESTAMP FROM "Organization" o CROSS JOIN (VALUES
 ('DEMOLITION_CEILING','Demolition, partitions and ceilings','拆除、隔間與天花',0,true,ARRAY['demolition','拆除']::TEXT[]),
 ('SELECTIVE_DEMOLITION','Selective demolition','選擇性拆除',1,true,ARRAY['selective demolition','選擇性拆除']::TEXT[]),
 ('PARTITIONS_CEILINGS','Partitions and ceilings','隔間與天花',2,true,ARRAY['partitions','partition','ceilings','ceiling','隔間','天花']::TEXT[]),
 ('CUSTOM_MILLWORK','Custom millwork','客製木作',3,true,ARRAY['millwork','joinery','cabinetry','木作','木工']::TEXT[]),
 ('LIGHTING_ELECTRICAL','Lighting and electrical','照明與電氣',4,true,ARRAY['lighting','light fixture','light fixtures','electrical','燈具','照明','電氣']::TEXT[]),
 ('IMPORTED_STONE','Imported stone and hard finishes','進口石材與硬質面材',5,true,ARRAY['stone','hard finishes','石材','硬質面材']::TEXT[]),
 ('SIGNAGE','Signage and display installation','標示與展示安裝',6,true,ARRAY['signage','display installation','標示','招牌','展示安裝']::TEXT[]),
 ('COORDINATION','Site coordination and handover','現場協調與交付',7,true,ARRAY['coordination','handover','協調','交付','交接']::TEXT[]),
 ('GENERAL_TRADES','General trades','一般工程',8,false,ARRAY[]::TEXT[])
) v(key,en,zh,position,active,aliases) ON CONFLICT ("organizationId",key) DO NOTHING;
-- Retain other already-stored scope/pricing keys without guessing a bilingual meaning.
INSERT INTO "FirmWorkCategory" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"updatedAt")
SELECT md5(q."organizationId"||':work-category:'||q.key),q."organizationId",q.key,q.key,q.key,9999,false,CURRENT_TIMESTAMP
FROM (
 SELECT "organizationId","categoryId" AS key FROM "ProjectScope"
 UNION SELECT "organizationId",unnest("commercialCategoryIds") FROM "Project"
 UNION SELECT "organizationId","categoryId" FROM "QuoteItem"
 UNION SELECT "organizationId","categoryId" FROM "ForecastCostLine"
 UNION SELECT "organizationId","categoryId" FROM "CostLine"
 UNION SELECT "organizationId","categoryId" FROM "SupplierOfferItem"
 UNION SELECT "organizationId","categoryId" FROM "Supplier"
 UNION SELECT "organizationId","categoryId" FROM "Material"
) q ON CONFLICT ("organizationId",key) DO NOTHING;
