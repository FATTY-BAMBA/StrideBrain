-- Stage 2 tenant-consistency hardening for authorization records.
-- Membership already has a unique (id, organizationId) key from Stage 1.

ALTER TABLE "MembershipCapabilityGrant"
  ADD CONSTRAINT "MembershipCapabilityGrant_membership_organization_fkey"
  FOREIGN KEY ("membershipId", "organizationId")
  REFERENCES "Membership"("id", "organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DemoSession"
  ADD CONSTRAINT "DemoSession_membership_organization_fkey"
  FOREIGN KEY ("membershipId", "organizationId")
  REFERENCES "Membership"("id", "organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;
