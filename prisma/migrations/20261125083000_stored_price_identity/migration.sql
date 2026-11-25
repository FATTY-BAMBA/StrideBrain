-- Derived read keys are generated on insert/update; application code cannot supply or drift them.
-- Adding these columns backfills existing rows without changing any quote input or issued snapshot.
ALTER TABLE "QuoteItem"
  ADD COLUMN "priceDescriptionKey" text GENERATED ALWAYS AS (sb_price_identity(description)) STORED,
  ADD COLUMN "priceUnitKey" text GENERATED ALWAYS AS (sb_price_identity(unit)) STORED;

-- The invoking application's table privileges and future #42 RLS policies must apply,
-- rather than the view owner's privileges/policies. This grants no new table access.
CREATE OR REPLACE VIEW "IssuedQuotePrice" WITH (security_invoker = true) AS
WITH latest AS (
  SELECT DISTINCT ON ("organizationId", "quoteId") * FROM "QuoteVersion"
  WHERE status IN ('ISSUED', 'ACCEPTED')
  ORDER BY "organizationId", "quoteId", "versionNumber" DESC
), facts AS (
  SELECT i.id, i."organizationId", v."quoteId", v.id AS "versionId", i."lineNumber", COALESCE(s.position, 0) AS "sectionPosition",
    q."projectId", p."businessKey" AS "projectKey", p."nameEn" AS "projectNameEn", p."nameZhTw" AS "projectNameZhTw",
    p."clientId", c."nameEn" AS "clientNameEn", c."nameZhTw" AS "clientNameZhTw",
    v.currency, v."documentNumber", v."issuedAt",
    to_char(v."issuedAt" AT TIME ZONE 'UTC' AT TIME ZONE o.timezone, 'YYYY-MM-DD') AS "issuedOn",
    COALESCE(i.description, CASE WHEN v."documentSnapshot"->>'language' = 'zh-TW' THEN i."descriptionZhTw" ELSE i."descriptionEn" END) AS description,
    -- Legacy category drafts are presented as one lot in the #65 document adapter.
    CASE WHEN v."documentFormatVersion" = 1 THEN '式' ELSE i.unit END AS unit,
    CASE WHEN v."documentFormatVersion" = 1 THEN i.amount ELSE i."unitPrice" END AS "unitPrice",
    -- Modern item keys are computed by PostgreSQL on write, never per result row.
    CASE WHEN i.description IS NOT NULL THEN i."priceDescriptionKey"
      ELSE sb_price_identity(CASE WHEN v."documentSnapshot"->>'language' = 'zh-TW' THEN i."descriptionZhTw" ELSE i."descriptionEn" END)
    END AS "descriptionKey",
    CASE WHEN v."documentFormatVersion" = 1 THEN '式' ELSE i."priceUnitKey" END AS "unitKey"
  FROM latest v
  JOIN "Quote" q ON q.id=v."quoteId" AND q."organizationId"=v."organizationId"
  JOIN "Project" p ON p.id=q."projectId" AND p."organizationId"=q."organizationId" AND p."deletedAt" IS NULL
  JOIN "Client" c ON c.id=p."clientId" AND c."organizationId"=p."organizationId"
  JOIN "Organization" o ON o.id=p."organizationId"
  JOIN "QuoteItem" i ON i."quoteVersionId"=v.id AND i."organizationId"=v."organizationId" AND i.kind='ITEM'
  LEFT JOIN "QuoteSection" s ON s.id=i."sectionId" AND s."organizationId"=i."organizationId" AND s."quoteVersionId"=v.id
  WHERE v."issuedAt" IS NOT NULL AND v."documentNumber" IS NOT NULL
)
SELECT * FROM facts;
