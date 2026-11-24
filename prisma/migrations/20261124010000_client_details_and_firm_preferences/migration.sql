-- Additive upgrade: existing client names, jobs and issued document snapshots are unchanged.
ALTER TABLE "Client"
  ADD COLUMN "contactPerson" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "phone" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "email" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "address" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "taxId" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "note" TEXT NOT NULL DEFAULT '',
  ADD CONSTRAINT "Client_contact_bounds" CHECK (
    char_length("contactPerson") <= 200 AND char_length("phone") <= 80
    AND char_length("email") <= 254 AND char_length("address") <= 1000
    AND char_length("note") <= 4000
  ),
  ADD CONSTRAINT "Client_tax_id_format" CHECK ("taxId" = '' OR "taxId" ~ '^[0-9]{8}$');

ALTER TABLE "Organization"
  ADD COLUMN "areaDisplayUnit" TEXT NOT NULL DEFAULT 'm2',
  ADD CONSTRAINT "Organization_area_display_unit" CHECK ("areaDisplayUnit" IN ('m2', 'ping'));

CREATE INDEX "Client_organizationId_active_nameEn_idx" ON "Client" ("organizationId", "active", "nameEn");
CREATE INDEX "Client_organizationId_active_nameZhTw_idx" ON "Client" ("organizationId", "active", "nameZhTw");
CREATE INDEX "Project_organizationId_clientId_idx" ON "Project" ("organizationId", "clientId");

ALTER TABLE "MembershipCapabilityGrant" DROP CONSTRAINT "MembershipCapabilityGrant_capability_check";
ALTER TABLE "MembershipCapabilityGrant" ADD CONSTRAINT "MembershipCapabilityGrant_capability_check" CHECK ("capability" IN (
 'project:read','project:create','project:update','project:compare','quote:read','quote:draft','quote:issue',
 'commercial:forecast-read','commercial:actual-read','evidence:read','action:internal-review:propose',
 'action:internal-review:create','action:assign','authority:financial-conflict:resolve','settings:manage',
 'client:read','client:write','firm-lists:manage'
));
