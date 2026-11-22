DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM "QuoteDocumentDetails" WHERE "organizationId"='org_horizon' AND "taxId"='00000000' AND "defaultValidityDays"=30) THEN RAISE EXCEPTION 'QUOTE_DOCUMENT_FIXTURE_REQUIRED'; END IF;
 IF (SELECT count(*) FROM pg_trigger WHERE tgname IN ('QuoteVersion_issued_immutable','QuoteItem_issued_immutable') AND NOT tgisinternal AND tgenabled='O') <> 2 THEN RAISE EXCEPTION 'QUOTE_IMMUTABILITY_REQUIRED'; END IF;
END $$;
