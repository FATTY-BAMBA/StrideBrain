-- This verifies schema relationships without requiring private accounts or changing sample addresses.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "IdentityLink" l JOIN "Person" p ON p.id=l."personId" WHERE p."organizationId"<>l."organizationId") THEN
    RAISE EXCEPTION 'Cross-organization identity link';
  END IF;
  IF EXISTS (SELECT 1 FROM "Membership" WHERE "invitationStatus" NOT IN ('JOINED','INVITED','CANCELLED') OR "invitationEmailStatus" NOT IN ('NOT_SENT','SENT','FAILED')) THEN
    RAISE EXCEPTION 'Invalid invitation state';
  END IF;
  IF EXISTS (SELECT 1 FROM "AuthAccount" WHERE "accessToken" IS NOT NULL OR "refreshToken" IS NOT NULL OR "idToken" IS NOT NULL OR password IS NOT NULL) THEN
    RAISE EXCEPTION 'Unexpected persisted provider token/password';
  END IF;
END $$;
