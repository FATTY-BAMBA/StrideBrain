-- Repeatable synthetic fixture entries for organizations created after migration.
INSERT INTO "FirmClientType" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"updatedAt")
SELECT md5(o.id||':client-type:'||v.key),o.id,v.key,v.en,v.zh,v.position,true,CURRENT_TIMESTAMP
FROM "Organization" o CROSS JOIN (VALUES
 ('RETAIL','Retail','零售',0),('CORPORATE','Corporate','企業',1),
 ('HOSPITALITY','Hospitality','旅宿餐飲',2),('INDIVIDUAL','Individual','個人',3)
) v(key,en,zh,position) ON CONFLICT ("organizationId",key) DO NOTHING;
-- Grandfather all stored values, even if the firm already exceeds the new-add limit.
-- The immutable key retains the original text; only display labels have a 40-character bound.
INSERT INTO "FirmClientType" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"updatedAt")
SELECT md5(c."organizationId"||':client-type:'||c."clientType"),c."organizationId",c."clientType",
 left(coalesce(nullif(c."clientType",''),'Unknown'),40),left(coalesce(nullif(c."clientType",''),'未分類'),40),9999,true,CURRENT_TIMESTAMP
FROM "Client" c GROUP BY c."organizationId",c."clientType" ON CONFLICT ("organizationId",key) DO NOTHING;
