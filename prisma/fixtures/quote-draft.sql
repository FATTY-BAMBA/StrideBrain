BEGIN;
INSERT INTO "MembershipCapabilityGrant" ("id","organizationId","membershipId","capability","effect","updatedAt") VALUES
  ('grant_viewer_quote_draft_deny','org_horizon','membership_horizon_viewer','quote:draft','DENY',NOW()),
  ('grant_finance_quote_draft_deny','org_horizon','membership_horizon_finance','quote:draft','DENY',NOW())
ON CONFLICT ("organizationId","membershipId","capability") DO UPDATE SET "effect"='DENY',"updatedAt"=NOW();
-- Two synthetic readings of the same past quote line disagree. Its record is
-- excluded by the existing authority policy; the draft still names the conflict.
INSERT INTO "EvidenceReference" ("id","organizationId","subjectType","subjectId","locator","claimKey","supportedValue","authorityState","observationType","dataClassification")
SELECT 'evid_quote_draft_conflict','org_horizon','QUOTE_ITEM',qi."id",
  '{"kind":"structured-line","lineNumber":4}'::jsonb,'quote-draft:conflicting-reading',
  jsonb_build_object('amount',(qi."amount" + 1000)::text,'currency','TWD'),'CONFLICTED','QUOTED_PRICE','DEMO_SYNTHETIC'
FROM "QuoteItem" qi JOIN "QuoteVersion" qv ON qv."id" = qi."quoteVersionId"
JOIN "Quote" q ON q."id" = qv."quoteId"
WHERE q."projectId" = 'prj_hist_018' AND qi."categoryId" = 'IMPORTED_STONE' AND qv."versionNumber" = 2
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "EvidenceConflict" ("id","organizationId","conflictKey","primaryEvidenceId","conflictingEvidenceId","status","updatedAt")
SELECT 'conflict_quote_draft','org_horizon','quote:PRJ-HIST-018:IMPORTED_STONE',er."id",'evid_quote_draft_conflict','OPEN',NOW()
FROM "EvidenceReference" er JOIN "EvidenceReference" alternate ON alternate."subjectId" = er."subjectId"
WHERE alternate."id" = 'evid_quote_draft_conflict' AND er."id" <> alternate."id" AND er."subjectType" = 'QUOTE_ITEM'
ORDER BY er."id" LIMIT 1
ON CONFLICT ("id") DO NOTHING;
COMMIT;
