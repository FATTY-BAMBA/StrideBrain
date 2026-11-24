import { readFileSync, writeFileSync } from 'node:fs';
// Pinned Unicode full default case folding (C + F, not locale-specific Turkic mappings).
// Future changes require a NEW migration; do not regenerate an already merged migration.
const entries = readFileSync('scripts/unicode/CaseFolding-15.1.0.txt', 'utf8').split('\n').flatMap(line => {
  const [cp, status, mapping] = line.split('#')[0].split(';').map(s => s.trim());
  return ['C', 'F'].includes(status) ? [[String.fromCodePoint(parseInt(cp, 16)), mapping.split(' ').map(n => String.fromCodePoint(parseInt(n, 16))).join('')]] : [];
});
const single = entries.filter(([,to]) => [...to].length === 1);
const multiple = entries.filter(([,to]) => [...to].length > 1);
const sql = value => "'" + value.replaceAll("'", "''") + "'";
const whitespace = '\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
const ustring = value => "U&'" + [...value].map(c => c.codePointAt(0) > 65535 ? '\\+' + c.codePointAt(0).toString(16).padStart(6,'0') : '\\' + c.codePointAt(0).toString(16).padStart(4,'0')).join('') + "'";
const functionSql = `-- Generated from Unicode 15.1 CaseFolding.txt; license: scripts/unicode/LICENSE.txt.
-- Immutable text identity only. No tenant data is stored or read by this function.
CREATE FUNCTION sb_price_identity(value text) RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $function$
DECLARE folded text;
BEGIN
  folded := btrim(normalize(value, NFKC), ${ustring(whitespace)});
  folded := translate(folded, ${ustring(single.map(([from]) => from).join(''))}, ${ustring(single.map(([,to]) => to).join(''))});
  IF folded ~ ${sql('[' + multiple.map(([from]) => from).join('') + ']')} THEN
    SELECT string_agg(COALESCE(${sql(JSON.stringify(Object.fromEntries(multiple)))}::jsonb ->> ch, ch), '' ORDER BY ord)
      INTO folded FROM regexp_split_to_table(folded, '') WITH ORDINALITY AS chars(ch, ord);
  END IF;
  RETURN folded;
END;
$function$;
`;
const viewSql = `
CREATE INDEX "QuoteVersion_issued_prices_idx" ON "QuoteVersion" ("organizationId", "quoteId", "versionNumber" DESC)
WHERE status IN ('ISSUED', 'ACCEPTED');

-- Derived only: latest issued/accepted version per quote, never draft/superseded/FINAL.
-- Every query must scope organizationId AND readable projectId before returning prices.
CREATE VIEW "IssuedQuotePrice" AS
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
    CASE WHEN v."documentFormatVersion" = 1 THEN i.amount ELSE i."unitPrice" END AS "unitPrice"
  FROM latest v
  JOIN "Quote" q ON q.id=v."quoteId" AND q."organizationId"=v."organizationId"
  JOIN "Project" p ON p.id=q."projectId" AND p."organizationId"=q."organizationId" AND p."deletedAt" IS NULL
  JOIN "Client" c ON c.id=p."clientId" AND c."organizationId"=p."organizationId"
  JOIN "Organization" o ON o.id=p."organizationId"
  JOIN "QuoteItem" i ON i."quoteVersionId"=v.id AND i."organizationId"=v."organizationId" AND i.kind='ITEM'
  LEFT JOIN "QuoteSection" s ON s.id=i."sectionId" AND s."organizationId"=i."organizationId" AND s."quoteVersionId"=v.id
  WHERE v."issuedAt" IS NOT NULL AND v."documentNumber" IS NOT NULL
)
SELECT facts.*, sb_price_identity(description) AS "descriptionKey", sb_price_identity(unit) AS "unitKey"
FROM facts;
`;
const outputs = {
  'src/modules/price-list/domain/case-folding.json': JSON.stringify(Object.fromEntries(entries), null, 2) + '\n',
  'prisma/migrations/20261125080000_price_list_read_model/migration.sql': functionSql + viewSql,
};
for (const [path, text] of Object.entries(outputs)) {
  if (process.argv.includes('--check')) { if (readFileSync(path,'utf8') !== text) throw Error(`Generated file differs: ${path}`); }
  else writeFileSync(path, text);
}
