-- Pricing identity is a tenant-local relationship; names never change observation types.
CREATE TABLE "FirmWorkCategory" (
 "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "key" TEXT NOT NULL,
 "nameEn" TEXT NOT NULL, "nameZhTw" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true, "scopeSelectable" BOOLEAN NOT NULL DEFAULT true, "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 "pricedUnderId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "FirmWorkCategory_id_organizationId_key" UNIQUE ("id", "organizationId"),
 CONSTRAINT "FirmWorkCategory_organizationId_key_key" UNIQUE ("organizationId", "key"),
 CONSTRAINT "FirmWorkCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "FirmWorkCategory_pricedUnderId_organizationId_fkey" FOREIGN KEY ("pricedUnderId", "organizationId") REFERENCES "FirmWorkCategory"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "FirmWorkCategory_bounds" CHECK (char_length("key") BETWEEN 1 AND 128 AND char_length("nameEn") BETWEEN 1 AND 200 AND char_length("nameZhTw") BETWEEN 1 AND 200 AND "sortOrder" BETWEEN 0 AND 10000 AND cardinality(aliases)<=30),
 CONSTRAINT "FirmWorkCategory_not_self_priced" CHECK ("pricedUnderId" IS DISTINCT FROM id)
);
CREATE INDEX "FirmWorkCategory_organizationId_active_sortOrder_idx" ON "FirmWorkCategory" ("organizationId", "active", "sortOrder");
CREATE INDEX "FirmWorkCategory_organizationId_pricedUnderId_idx" ON "FirmWorkCategory" ("organizationId", "pricedUnderId");

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
