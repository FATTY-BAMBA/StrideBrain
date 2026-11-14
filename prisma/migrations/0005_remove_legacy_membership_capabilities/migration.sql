-- Stage 2 authority hardening.
-- Capabilities are derived from reviewed role bundles plus explicit
-- MembershipCapabilityGrant ALLOW/DENY rows. The Stage 1 placeholder array is
-- removed so there is only one authoritative capability policy.

ALTER TABLE "Membership" DROP COLUMN "capabilities";
