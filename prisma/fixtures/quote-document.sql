-- Synthetic unit suggestions for the seeded firm. Existing keys and edited labels are retained.
INSERT INTO "FirmQuoteUnit" (id,"organizationId",key,"nameEn","nameZhTw","sortOrder",active,"updatedAt")
SELECT md5(o.id||':quote-unit:'||v.key),o.id,v.key,v.en,v.zh,v.position,true,CURRENT_TIMESTAMP
FROM "Organization" o CROSS JOIN (VALUES
 ('ping','ping','坪',2), ('cai','cai','才',3), ('chi','chi','尺',4),
 ('door','door','樘',5), ('set','set','組',6), ('piece','piece','個',7),
 ('metre','metre','米',8), ('opening','opening','口',9), ('load','load','車',10),
 ('light','light','盞',11), ('sheet','sheet','片',12), ('yard','yard','碼',13),
 ('unit','unit','只',14), ('circuit','circuit','迴',15), ('item','item','項',16)
) v(key,en,zh,position)
WHERE o.id='org_horizon'
ON CONFLICT ("organizationId",key) DO NOTHING;
