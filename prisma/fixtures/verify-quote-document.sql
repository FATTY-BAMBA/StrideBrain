DO $$ BEGIN
  IF (SELECT count(*) FROM "FirmQuoteUnit" WHERE "organizationId"='org_horizon' AND key IN ('lot','m2','ping','cai','chi','door','set','piece','metre','opening','load','light','sheet','yard','unit','circuit','item')) <> 17 THEN
    RAISE EXCEPTION 'QUOTE_DOCUMENT_UNITS_REQUIRED';
  END IF;
  IF EXISTS (SELECT 1 FROM "QuoteSection" s JOIN "QuoteVersion" v ON v.id=s."quoteVersionId" WHERE s."organizationId"<>v."organizationId") THEN
    RAISE EXCEPTION 'QUOTE_SECTION_TENANT_MISMATCH';
  END IF;
  IF EXISTS (SELECT 1 FROM "QuoteItem" i JOIN "QuoteVersion" v ON v.id=i."quoteVersionId" WHERE v."documentFormatVersion"=2 AND i."sectionId" IS NULL) THEN
    RAISE EXCEPTION 'QUOTE_DOCUMENT_LINE_WITHOUT_SECTION';
  END IF;
END $$;
