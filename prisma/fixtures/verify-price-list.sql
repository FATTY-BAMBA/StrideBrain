DO $$
BEGIN
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
