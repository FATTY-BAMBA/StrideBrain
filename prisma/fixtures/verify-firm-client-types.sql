DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "Client" c LEFT JOIN "FirmClientType" t ON t."organizationId"=c."organizationId" AND t.key=c."clientType" WHERE t.id IS NULL) THEN
  RAISE EXCEPTION 'Client type is missing from its firm list';
 END IF;
 IF EXISTS (SELECT 1 FROM "Organization" o WHERE NOT EXISTS (SELECT 1 FROM "FirmClientType" t WHERE t."organizationId"=o.id AND t.key='INDIVIDUAL')) THEN
  RAISE EXCEPTION 'Individual fixture type missing';
 END IF;
END $$;
