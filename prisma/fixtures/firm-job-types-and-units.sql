-- Synthetic fixture reset: organizations are inserted after migrations.
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
