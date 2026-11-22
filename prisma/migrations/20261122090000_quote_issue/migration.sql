CREATE TABLE "QuoteDocumentDetails" (
 "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL UNIQUE,
 "legalNameEn" TEXT NOT NULL, "legalNameZhTw" TEXT NOT NULL, "taxId" TEXT NOT NULL,
 "addressEn" TEXT NOT NULL, "addressZhTw" TEXT NOT NULL, "phone" TEXT NOT NULL, "email" TEXT NOT NULL,
 "defaultValidityDays" INTEGER NOT NULL DEFAULT 30 CHECK ("defaultValidityDays" BETWEEN 1 AND 365),
 "termsEn" TEXT NOT NULL, "termsZhTw" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "QuoteDocumentDetails_id_organizationId_key" UNIQUE ("id", "organizationId"),
 CONSTRAINT "QuoteDocumentDetails_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "QuoteDocumentDetails_taxId_check" CHECK ("taxId" = '' OR "taxId" ~ '^[0-9]{8}$')
);
ALTER TABLE "QuoteVersion"
 ADD COLUMN "issuedAt" TIMESTAMP(3), ADD COLUMN "issuedByMembershipId" TEXT,
 ADD COLUMN "documentNumber" TEXT, ADD COLUMN "documentSnapshot" JSONB,
 ADD COLUMN "acceptedOn" DATE, ADD COLUMN "acceptedByMembershipId" TEXT, ADD COLUMN "acceptanceNote" TEXT;
CREATE UNIQUE INDEX "QuoteVersion_organizationId_documentNumber_key" ON "QuoteVersion"("organizationId", "documentNumber");
ALTER TABLE "QuoteVersion"
 ADD CONSTRAINT "QuoteVersion_issuedByMembershipId_organizationId_fkey" FOREIGN KEY ("issuedByMembershipId", "organizationId") REFERENCES "Membership"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT "QuoteVersion_acceptedByMembershipId_organizationId_fkey" FOREIGN KEY ("acceptedByMembershipId", "organizationId") REFERENCES "Membership"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT "QuoteVersion_issue_complete" CHECK ("issuedAt" IS NULL OR ("issuedByMembershipId" IS NOT NULL AND "documentNumber" IS NOT NULL AND "validUntil" IS NOT NULL AND "documentSnapshot" IS NOT NULL AND jsonb_typeof("documentSnapshot") = 'object' AND "approvedAt" IS NOT NULL AND status IN ('ISSUED','ACCEPTED','SUPERSEDED'))),
 ADD CONSTRAINT "QuoteVersion_issued_authority" CHECK ("issuedAt" IS NULL OR ((status IN ('ISSUED','ACCEPTED') AND "authorityState"='APPROVED_COMMERCIAL' AND "supersededById" IS NULL) OR (status='SUPERSEDED' AND "authorityState"='SUPERSEDED' AND "supersededById" IS NOT NULL))),
 ADD CONSTRAINT "QuoteVersion_accepted_metadata" CHECK ("issuedAt" IS NULL OR status <> 'ACCEPTED' OR "acceptedOn" IS NOT NULL),
 ADD CONSTRAINT "QuoteVersion_acceptance_complete" CHECK ("acceptedOn" IS NULL OR ("issuedAt" IS NOT NULL AND "acceptedByMembershipId" IS NOT NULL AND status IN ('ACCEPTED','SUPERSEDED')));
ALTER TABLE "MembershipCapabilityGrant" DROP CONSTRAINT "MembershipCapabilityGrant_capability_check";
ALTER TABLE "MembershipCapabilityGrant" ADD CONSTRAINT "MembershipCapabilityGrant_capability_check" CHECK ("capability" IN (
 'project:read','project:create','project:update','project:compare','quote:read','quote:draft','quote:issue',
 'commercial:forecast-read','commercial:actual-read','evidence:read','action:internal-review:propose',
 'action:internal-review:create','action:assign','authority:financial-conflict:resolve','settings:manage'
));
CREATE FUNCTION stridebrain_issued_quote_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."issuedAt" IS NOT NULL THEN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'IMMUTABLE_ISSUED_QUOTE' USING ERRCODE='23514'; END IF;
  IF (to_jsonb(NEW) - ARRAY['status','authorityState','supersededById','acceptedOn','acceptedByMembershipId','acceptanceNote']) IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['status','authorityState','supersededById','acceptedOn','acceptedByMembershipId','acceptanceNote'])
     OR NEW.status NOT IN ('ISSUED','ACCEPTED','SUPERSEDED')
     OR (OLD.status = 'SUPERSEDED' AND to_jsonb(NEW) IS DISTINCT FROM to_jsonb(OLD))
     OR (OLD.status = 'ACCEPTED' AND NEW.status NOT IN ('ACCEPTED','SUPERSEDED'))
     OR (OLD."acceptedOn" IS NOT NULL AND ROW(NEW."acceptedOn",NEW."acceptedByMembershipId",NEW."acceptanceNote") IS DISTINCT FROM ROW(OLD."acceptedOn",OLD."acceptedByMembershipId",OLD."acceptanceNote"))
  THEN RAISE EXCEPTION 'IMMUTABLE_ISSUED_QUOTE' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER "QuoteVersion_issued_immutable" BEFORE UPDATE OR DELETE ON "QuoteVersion" FOR EACH ROW EXECUTE FUNCTION stridebrain_issued_quote_immutable();
CREATE FUNCTION stridebrain_issued_quote_item_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP <> 'INSERT' AND EXISTS (SELECT 1 FROM "QuoteVersion" WHERE id=OLD."quoteVersionId" AND "issuedAt" IS NOT NULL) THEN
  RAISE EXCEPTION 'IMMUTABLE_ISSUED_QUOTE_ITEM' USING ERRCODE='23514';
 END IF;
 IF TG_OP <> 'DELETE' AND EXISTS (SELECT 1 FROM "QuoteVersion" WHERE id=NEW."quoteVersionId" AND "issuedAt" IS NOT NULL) THEN
  RAISE EXCEPTION 'IMMUTABLE_ISSUED_QUOTE_ITEM' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER "QuoteItem_issued_immutable" BEFORE INSERT OR UPDATE OR DELETE ON "QuoteItem" FOR EACH ROW EXECUTE FUNCTION stridebrain_issued_quote_item_immutable();
