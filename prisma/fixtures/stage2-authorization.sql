BEGIN;

DELETE FROM "DemoSession"
WHERE "organizationId" IN ('org_horizon', 'org_northern');

DELETE FROM "MembershipCapabilityGrant"
WHERE "organizationId" IN ('org_horizon', 'org_northern');

INSERT INTO "MembershipCapabilityGrant" (
  "id", "organizationId", "membershipId", "capability", "effect", "createdAt", "updatedAt"
) VALUES
  ('grant_mei_actual_allow', 'org_horizon', 'membership_horizon_mei', 'commercial:actual-read', 'ALLOW', NOW(), NOW()),
  ('grant_viewer_actual_deny', 'org_horizon', 'membership_horizon_viewer', 'commercial:actual-read', 'DENY', NOW(), NOW()),
  ('grant_viewer_propose_deny', 'org_horizon', 'membership_horizon_viewer', 'action:internal-review:propose', 'DENY', NOW(), NOW()),
  ('grant_viewer_create_deny', 'org_horizon', 'membership_horizon_viewer', 'action:internal-review:create', 'DENY', NOW(), NOW()),
  ('grant_viewer_assign_deny', 'org_horizon', 'membership_horizon_viewer', 'action:assign', 'DENY', NOW(), NOW());

INSERT INTO "ProjectAssignment" (
  "id", "organizationId", "projectId", "membershipId", "canReadActuals", "canCreateAction", "createdAt"
)
SELECT
  'assign_finance_' || p."id",
  'org_horizon',
  p."id",
  'membership_horizon_finance',
  true,
  true,
  NOW()
FROM "Project" p
WHERE p."organizationId" = 'org_horizon'
ON CONFLICT ("organizationId", "projectId", "membershipId")
DO UPDATE SET
  "canReadActuals" = EXCLUDED."canReadActuals",
  "canCreateAction" = EXCLUDED."canCreateAction";

INSERT INTO "DemoSession" (
  "id", "organizationId", "membershipId", "tokenHash", "preferredLocale",
  "issuedAt", "expiresAt", "revokedAt", "lastSeenAt"
) VALUES
  ('fixture_expired_session', 'org_horizon', 'membership_horizon_mei', repeat('a', 64), 'zh-TW', TIMESTAMP '2026-11-01 00:00:00', TIMESTAMP '2026-11-01 04:00:00', NULL, NULL),
  ('fixture_revoked_session', 'org_horizon', 'membership_horizon_viewer', repeat('b', 64), 'en', TIMESTAMP '2026-11-10 00:00:00', TIMESTAMP '2026-11-20 00:00:00', TIMESTAMP '2026-11-10 01:00:00', TIMESTAMP '2026-11-10 00:30:00');

COMMIT;
