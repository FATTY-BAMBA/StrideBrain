ALTER TABLE "Membership" ADD COLUMN "invitationEmailStatus" TEXT NOT NULL DEFAULT 'NOT_SENT';
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_invitationEmailStatus_check" CHECK ("invitationEmailStatus" IN ('NOT_SENT', 'SENT', 'FAILED'));
