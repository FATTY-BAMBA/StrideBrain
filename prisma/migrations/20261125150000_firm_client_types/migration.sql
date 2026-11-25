-- Preserve every client key/value; list membership is checked by scoped writes.
CREATE TABLE "FirmClientType" (
 "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "key" TEXT NOT NULL,
 "nameEn" TEXT NOT NULL, "nameZhTw" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "FirmClientType_id_organizationId_key" UNIQUE ("id", "organizationId"),
 CONSTRAINT "FirmClientType_organizationId_key_key" UNIQUE ("organizationId", "key"),
 CONSTRAINT "FirmClientType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "FirmClientType_bounds" CHECK (char_length("nameEn") BETWEEN 1 AND 40 AND char_length("nameZhTw") BETWEEN 1 AND 40 AND "sortOrder" BETWEEN 0 AND 10000)
);
CREATE INDEX "FirmClientType_organizationId_active_sortOrder_idx" ON "FirmClientType" ("organizationId", "active", "sortOrder");

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
