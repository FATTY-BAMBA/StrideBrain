-- Tenant-owned list identities; existing project/type/unit strings remain unchanged.
CREATE TABLE "FirmJobType" (
 "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "key" TEXT NOT NULL,
 "nameEn" TEXT NOT NULL, "nameZhTw" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "FirmJobType_id_organizationId_key" UNIQUE ("id", "organizationId"),
 CONSTRAINT "FirmJobType_organizationId_key_key" UNIQUE ("organizationId", "key"),
 CONSTRAINT "FirmJobType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "FirmJobType_bounds" CHECK (char_length("key") BETWEEN 1 AND 128 AND char_length("nameEn") BETWEEN 1 AND 200 AND char_length("nameZhTw") BETWEEN 1 AND 200 AND "sortOrder" BETWEEN 0 AND 10000)
);
CREATE INDEX "FirmJobType_organizationId_active_sortOrder_idx" ON "FirmJobType" ("organizationId", "active", "sortOrder");
CREATE TABLE "FirmJobTypeRelation" (
 "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "fromTypeId" TEXT NOT NULL, "toTypeId" TEXT NOT NULL,
 CONSTRAINT "FirmJobTypeRelation_id_organizationId_key" UNIQUE ("id", "organizationId"),
 CONSTRAINT "FirmJobTypeRelation_organizationId_fromTypeId_toTypeId_key" UNIQUE ("organizationId", "fromTypeId", "toTypeId"),
 CONSTRAINT "FirmJobTypeRelation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "FirmJobTypeRelation_fromTypeId_organizationId_fkey" FOREIGN KEY ("fromTypeId", "organizationId") REFERENCES "FirmJobType"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "FirmJobTypeRelation_toTypeId_organizationId_fkey" FOREIGN KEY ("toTypeId", "organizationId") REFERENCES "FirmJobType"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "FirmJobTypeRelation_not_self" CHECK ("fromTypeId" <> "toTypeId")
);
CREATE INDEX "FirmJobTypeRelation_organizationId_toTypeId_idx" ON "FirmJobTypeRelation" ("organizationId", "toTypeId");
CREATE TABLE "FirmQuoteUnit" (
 "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "key" TEXT NOT NULL,
 "nameEn" TEXT NOT NULL, "nameZhTw" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "FirmQuoteUnit_id_organizationId_key" UNIQUE ("id", "organizationId"),
 CONSTRAINT "FirmQuoteUnit_organizationId_key_key" UNIQUE ("organizationId", "key"),
 CONSTRAINT "FirmQuoteUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "FirmQuoteUnit_bounds" CHECK (char_length("key") BETWEEN 1 AND 128 AND char_length("nameEn") BETWEEN 1 AND 200 AND char_length("nameZhTw") BETWEEN 1 AND 200 AND "sortOrder" BETWEEN 0 AND 10000)
);
CREATE INDEX "FirmQuoteUnit_organizationId_active_sortOrder_idx" ON "FirmQuoteUnit" ("organizationId", "active", "sortOrder");

-- Seed only firms already present at this point. New-firm creation remains out of scope.
INSERT INTO "FirmJobType" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"updatedAt")
SELECT md5(o.id||':job-type:'||v.key),o.id,v.key,v.en,v.zh,v.position,v.active,CURRENT_TIMESTAMP
FROM "Organization" o CROSS JOIN (VALUES
 ('RETAIL_FLAGSHIP','Retail flagship','零售旗艦店',0,true),
 ('RETAIL_RENOVATION','Retail renovation','零售門市改裝',1,true),
 ('RETAIL_CONCEPT_STORE','Retail concept store','零售概念店',2,true),
 ('RETAIL_SHOWROOM','Retail showroom','零售展示店',3,true),
 ('CORPORATE_OFFICE','Corporate office','企業辦公室',4,false),
 ('WORKPLACE_RENOVATION','Workplace renovation','辦公空間改裝',5,false),
 ('BOUTIQUE_HOSPITALITY','Boutique hospitality','精品旅宿',6,false)
) v(key,en,zh,position,active) ON CONFLICT ("organizationId",key) DO NOTHING;
-- Preserve any additional stored key without inventing a translation or offering it on new jobs.
INSERT INTO "FirmJobType" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"updatedAt")
SELECT md5(p."organizationId"||':job-type:'||p.subtype),p."organizationId",p.subtype,p.subtype,p.subtype,9999,false,CURRENT_TIMESTAMP
FROM "Project" p GROUP BY p."organizationId",p.subtype ON CONFLICT ("organizationId",key) DO NOTHING;
INSERT INTO "FirmJobTypeRelation" (id,"organizationId","fromTypeId","toTypeId")
SELECT md5(o.id||':type-relation:'||v.a||':'||v.b),o.id,a.id,b.id
FROM "Organization" o CROSS JOIN (VALUES
 ('RETAIL_FLAGSHIP','RETAIL_RENOVATION'),('RETAIL_FLAGSHIP','RETAIL_CONCEPT_STORE'),('RETAIL_FLAGSHIP','RETAIL_SHOWROOM'),
 ('RETAIL_RENOVATION','RETAIL_FLAGSHIP'),('RETAIL_RENOVATION','RETAIL_CONCEPT_STORE'),
 ('RETAIL_CONCEPT_STORE','RETAIL_FLAGSHIP'),('RETAIL_CONCEPT_STORE','RETAIL_RENOVATION'),('RETAIL_SHOWROOM','RETAIL_FLAGSHIP')
) v(a,b)
JOIN "FirmJobType" a ON a."organizationId"=o.id AND a.key=v.a
JOIN "FirmJobType" b ON b."organizationId"=o.id AND b.key=v.b
ON CONFLICT ("organizationId","fromTypeId","toTypeId") DO NOTHING;
INSERT INTO "FirmQuoteUnit" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"updatedAt")
SELECT md5(o.id||':quote-unit:'||v.key),o.id,v.key,v.en,v.zh,v.position,true,CURRENT_TIMESTAMP
FROM "Organization" o CROSS JOIN (VALUES ('lot','lot','式',0),('m2','m²','平方公尺',1)) v(key,en,zh,position)
ON CONFLICT ("organizationId",key) DO NOTHING;
INSERT INTO "FirmQuoteUnit" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"updatedAt")
SELECT md5(q."organizationId"||':quote-unit:'||q.unit),q."organizationId",q.unit,q.unit,q.unit,9999,false,CURRENT_TIMESTAMP
FROM "QuoteItem" q GROUP BY q."organizationId",q.unit ON CONFLICT ("organizationId",key) DO NOTHING;
