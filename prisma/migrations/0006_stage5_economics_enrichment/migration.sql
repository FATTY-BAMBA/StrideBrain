-- Stage 5 immutable historical-economics enrichment and observation decisions.

CREATE TABLE "EconomicsEnrichmentRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "comparisonRunId" TEXT NOT NULL,
    "activeProjectId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL,
    "accessScope" TEXT NOT NULL,
    "authorityPolicyVersion" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "inputFingerprint" TEXT NOT NULL,
    "sourceFingerprint" TEXT NOT NULL,
    "permissionFingerprint" TEXT NOT NULL,
    "structuralResultFingerprint" TEXT NOT NULL,
    "resultVersion" INTEGER NOT NULL DEFAULT 1,
    "resultSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EconomicsEnrichmentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EconomicsObservationDecision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enrichmentRunId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "decisionKey" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "observationType" "ObservationType" NOT NULL,
    "authorityState" "AuthorityState" NOT NULL,
    "included" BOOLEAN NOT NULL,
    "reasonCodes" TEXT[],
    "normalizedAmount" DECIMAL(20,6),
    "normalizedUnit" TEXT,
    "evidenceReferenceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomicsObservationDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EconomicsEnrichmentRun_comparisonRunId_key"
ON "EconomicsEnrichmentRun"("comparisonRunId");

CREATE UNIQUE INDEX "EconomicsEnrichmentRun_id_organizationId_key"
ON "EconomicsEnrichmentRun"("id", "organizationId");

CREATE INDEX "EconomicsEnrichmentRun_organizationId_activeProjectId_status_idx"
ON "EconomicsEnrichmentRun"("organizationId", "activeProjectId", "status");

CREATE INDEX "EconomicsEnrichmentRun_organizationId_inputFingerprint_idx"
ON "EconomicsEnrichmentRun"("organizationId", "inputFingerprint");

CREATE UNIQUE INDEX "EconomicsObservationDecision_organizationId_enrichmentRunId_decisionKey_key"
ON "EconomicsObservationDecision"("organizationId", "enrichmentRunId", "decisionKey");

CREATE UNIQUE INDEX "EconomicsObservationDecision_id_organizationId_key"
ON "EconomicsObservationDecision"("id", "organizationId");

CREATE INDEX "EconomicsObservationDecision_organizationId_projectId_observationType_included_idx"
ON "EconomicsObservationDecision"("organizationId", "projectId", "observationType", "included");

CREATE INDEX "EconomicsObservationDecision_organizationId_enrichmentRunId_idx"
ON "EconomicsObservationDecision"("organizationId", "enrichmentRunId");

ALTER TABLE "EconomicsEnrichmentRun"
ADD CONSTRAINT "EconomicsEnrichmentRun_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EconomicsEnrichmentRun"
ADD CONSTRAINT "EconomicsEnrichmentRun_comparisonRunId_fkey"
FOREIGN KEY ("comparisonRunId") REFERENCES "ComparisonRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EconomicsEnrichmentRun"
ADD CONSTRAINT "EconomicsEnrichmentRun_activeProjectId_fkey"
FOREIGN KEY ("activeProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EconomicsObservationDecision"
ADD CONSTRAINT "EconomicsObservationDecision_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EconomicsObservationDecision"
ADD CONSTRAINT "EconomicsObservationDecision_enrichmentRunId_fkey"
FOREIGN KEY ("enrichmentRunId") REFERENCES "EconomicsEnrichmentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EconomicsObservationDecision"
ADD CONSTRAINT "EconomicsObservationDecision_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
