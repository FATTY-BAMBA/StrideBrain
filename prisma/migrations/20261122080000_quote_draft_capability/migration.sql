-- Provenance fits EvidenceReference JSON. Only the existing capability allowlist changes.
ALTER TABLE "MembershipCapabilityGrant" DROP CONSTRAINT "MembershipCapabilityGrant_capability_check";
ALTER TABLE "MembershipCapabilityGrant" ADD CONSTRAINT "MembershipCapabilityGrant_capability_check"
CHECK ("capability" IN (
  'project:read', 'project:create', 'project:update', 'project:compare', 'quote:read', 'quote:draft',
  'commercial:forecast-read', 'commercial:actual-read', 'evidence:read',
  'action:internal-review:propose', 'action:internal-review:create', 'action:assign',
  'authority:financial-conflict:resolve', 'settings:manage'
));
