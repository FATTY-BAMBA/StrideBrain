DO $$
BEGIN
  IF (SELECT count(*) FROM pg_attribute WHERE attrelid='"QuoteItem"'::regclass
      AND attname IN ('priceDescriptionKey','priceUnitKey') AND attgenerated='s') <> 2 THEN
    RAISE EXCEPTION 'Price identity keys must be stored generated columns';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='"IssuedQuotePrice"'::regclass
      AND reloptions @> ARRAY['security_invoker=true']) THEN
    RAISE EXCEPTION 'Price read view must apply invoker privileges and RLS';
  END IF;
  IF sb_price_identity('  ＣＥＩＬＩＮＧ  ') <> 'ceiling'
     OR sb_price_identity('Maße') <> sb_price_identity('MASSE')
     OR sb_price_identity('Σςσ') <> 'σσσ'
     OR sb_price_identity('坪') <> '坪' THEN
    RAISE EXCEPTION 'Exact normalized price identity failed';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "IssuedQuotePrice" r
    JOIN "QuoteVersion" v ON v.id=r."versionId" AND v."organizationId"=r."organizationId"
    WHERE v.status NOT IN ('ISSUED','ACCEPTED')
  ) THEN RAISE EXCEPTION 'Unissued price escaped read model'; END IF;
END $$;
