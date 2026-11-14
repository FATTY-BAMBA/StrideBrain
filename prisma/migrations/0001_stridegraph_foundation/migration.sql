-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DataClassification" AS ENUM ('DEMO_SYNTHETIC', 'PUBLIC_REFERENCE', 'TENANT_PRIVATE', 'TENANT_RESTRICTED', 'TENANT_APPROVED');

-- CreateEnum
CREATE TYPE "AuthorityState" AS ENUM ('OBSERVED', 'HUMAN_REVIEWED', 'APPROVED_COMMERCIAL', 'RECONCILED_ACTUAL', 'SUPERSEDED', 'CONFLICTED');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('QUOTED_PRICE', 'SUPPLIER_OFFER', 'FORECAST_DIRECT_COST', 'RECONCILED_ACTUAL_COST');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('ORGANIZATION_ADMIN', 'PROJECT_MANAGER_ESTIMATOR', 'FINANCIAL_REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CLOSED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('DISCOVERY', 'DESIGN', 'QUOTE_REVIEW', 'APPROVED', 'PROCUREMENT', 'CONSTRUCTION', 'HANDOVER', 'COMPLETE');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'STALE');

-- CreateEnum
CREATE TYPE "ComparisonBand" AS ENUM ('STRONG', 'RELEVANT', 'PARTIAL', 'BROADER');

-- CreateEnum
CREATE TYPE "FactorState" AS ENUM ('KNOWN', 'UNKNOWN', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ConflictStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ProposedActionStatus" AS ENUM ('PREPARED', 'CONFIRMED', 'EXPIRED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvidenceSubjectType" AS ENUM ('PROJECT', 'PROJECT_SCOPE', 'DOCUMENT_VERSION', 'QUOTE_VERSION', 'QUOTE_ITEM', 'FORECAST_COST_VERSION', 'FORECAST_COST_LINE', 'PROJECT_COST_VERSION', 'COST_LINE', 'SUPPLIER_OFFER', 'SUPPLIER_OFFER_ITEM', 'COMPARISON_CLAIM', 'ACTION');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZhTw" TEXT NOT NULL,
    "primaryLocale" TEXT NOT NULL DEFAULT 'zh-TW',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'DEMO_SYNTHETIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZhTw" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "capabilities" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "canReadActuals" BOOLEAN NOT NULL DEFAULT false,
    "canCreateAction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZhTw" TEXT NOT NULL,
    "clientType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZhTw" TEXT NOT NULL,
    "comparisonClass" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "stage" "ProjectStage" NOT NULL,
    "locationCity" TEXT NOT NULL,
    "locationDistrict" TEXT,
    "areaQuantity" DECIMAL(18,3) NOT NULL,
    "areaUnit" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "programmeWeeks" DECIMAL(8,2),
    "startDate" DATE,
    "targetCompletionAt" DATE,
    "completedAt" DATE,
    "metadataAuthority" "AuthorityState" NOT NULL DEFAULT 'HUMAN_REVIEWED',
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'DEMO_SYNTHETIC',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectScope" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelZhTw" TEXT NOT NULL,
    "sourceState" "AuthorityState" NOT NULL DEFAULT 'HUMAN_REVIEWED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZhTw" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZhTw" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSupplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMaterial" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "projectId" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleZhTw" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'DEMO_SYNTHETIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "authorityState" "AuthorityState" NOT NULL,
    "effectiveAt" DATE,
    "supersededById" TEXT,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "checksum" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceReference" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subjectType" "EvidenceSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "documentVersionId" TEXT,
    "locator" JSONB NOT NULL,
    "claimKey" TEXT NOT NULL,
    "supportedValue" JSONB,
    "authorityState" "AuthorityState" NOT NULL,
    "observationType" "ObservationType",
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'DEMO_SYNTHETIC',
    "effectiveAt" DATE,
    "staleAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceConflict" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "conflictKey" TEXT NOT NULL,
    "primaryEvidenceId" TEXT NOT NULL,
    "conflictingEvidenceId" TEXT NOT NULL,
    "status" "ConflictStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "observationType" "ObservationType" NOT NULL DEFAULT 'QUOTED_PRICE',
    "authorityState" "AuthorityState" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "amountBeforeTax" DECIMAL(20,2) NOT NULL,
    "taxAmount" DECIMAL(20,2) NOT NULL,
    "totalAmount" DECIMAL(20,2) NOT NULL,
    "validUntil" DATE,
    "supersededById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteVersionId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionZhTw" TEXT NOT NULL,
    "quantity" DECIMAL(20,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(20,6) NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "authorityState" "AuthorityState" NOT NULL,
    "supplierId" TEXT,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastCostVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "authorityState" "AuthorityState" NOT NULL,
    "observationType" "ObservationType" NOT NULL DEFAULT 'FORECAST_DIRECT_COST',
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "totalDirectCost" DECIMAL(20,2) NOT NULL,
    "effectiveAt" DATE NOT NULL,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastCostVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastCostLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "forecastCostVersionId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionZhTw" TEXT NOT NULL,
    "quantity" DECIMAL(20,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DECIMAL(20,6) NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "authorityState" "AuthorityState" NOT NULL,
    "supplierId" TEXT,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastCostLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCostVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "authorityState" "AuthorityState" NOT NULL,
    "observationType" "ObservationType" NOT NULL DEFAULT 'RECONCILED_ACTUAL_COST',
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "totalDirectCost" DECIMAL(20,2) NOT NULL,
    "reconciledAt" DATE,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCostVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectCostVersionId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionZhTw" TEXT NOT NULL,
    "quantity" DECIMAL(20,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DECIMAL(20,6) NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "authorityState" "AuthorityState" NOT NULL,
    "supplierId" TEXT,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierOffer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "projectId" TEXT,
    "authorityState" "AuthorityState" NOT NULL,
    "observationType" "ObservationType" NOT NULL DEFAULT 'SUPPLIER_OFFER',
    "currency" TEXT NOT NULL DEFAULT 'TWD',
    "amountBeforeTax" DECIMAL(20,2) NOT NULL,
    "offeredAt" DATE NOT NULL,
    "validUntil" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierOfferItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierOfferId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionZhTw" TEXT NOT NULL,
    "quantity" DECIMAL(20,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(20,6) NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierOfferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "requestId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "activeContextSnapshot" JSONB NOT NULL,
    "resultSnapshot" JSONB,
    "errorCode" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IntelligenceRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "intelligenceRunId" TEXT NOT NULL,
    "activeProjectId" TEXT NOT NULL,
    "activeQuoteVersionId" TEXT,
    "policyVersion" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL,
    "inputFingerprint" TEXT NOT NULL,
    "resultVersion" INTEGER NOT NULL DEFAULT 1,
    "resultSnapshot" JSONB,
    "staleReason" TEXT,
    "staleAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ComparisonRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonCandidate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "comparisonRunId" TEXT NOT NULL,
    "candidateProjectId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DECIMAL(7,4) NOT NULL,
    "band" "ComparisonBand" NOT NULL,
    "evidenceCoverage" DECIMAL(7,4) NOT NULL,
    "economicsState" TEXT NOT NULL,
    "warnings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonFactor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "comparisonCandidateId" TEXT NOT NULL,
    "factorKey" TEXT NOT NULL,
    "state" "FactorState" NOT NULL,
    "weight" DECIMAL(7,4) NOT NULL,
    "normalizedValue" DECIMAL(7,4),
    "contribution" DECIMAL(7,4),
    "explanation" JSONB NOT NULL,
    "evidenceReferenceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonClaim" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "comparisonRunId" TEXT NOT NULL,
    "claimKey" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleZhTw" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "observationType" "ObservationType",
    "authorityState" "AuthorityState",
    "sufficiencyCode" TEXT,
    "evidenceReferenceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedAction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "comparisonRunId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL_REVIEW',
    "status" "ProposedActionStatus" NOT NULL DEFAULT 'PREPARED',
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "suggestedAssigneeId" TEXT,
    "suggestedDueDate" DATE,
    "evidenceReferenceIds" TEXT[],
    "policyVersion" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "comparisonRunId" TEXT NOT NULL,
    "proposedActionId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL_REVIEW',
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "assigneePersonId" TEXT,
    "dueDate" DATE,
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "evidenceReferenceIds" TEXT[],
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorMembershipId" TEXT,
    "comparisonRunId" TEXT,
    "proposedActionId" TEXT,
    "actionId" TEXT,
    "eventType" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_businessKey_key" ON "Organization"("businessKey");

-- CreateIndex
CREATE INDEX "Person_organizationId_active_idx" ON "Person"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Person_organizationId_businessKey_key" ON "Person"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Person_id_organizationId_key" ON "Person"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_role_active_idx" ON "Membership"("organizationId", "role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_organizationId_personId_key" ON "Membership"("organizationId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_id_organizationId_key" ON "Membership"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ProjectAssignment_organizationId_membershipId_idx" ON "ProjectAssignment"("organizationId", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAssignment_organizationId_projectId_membershipId_key" ON "ProjectAssignment"("organizationId", "projectId", "membershipId");

-- CreateIndex
CREATE INDEX "Client_organizationId_clientType_idx" ON "Client"("organizationId", "clientType");

-- CreateIndex
CREATE UNIQUE INDEX "Client_organizationId_businessKey_key" ON "Client"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Client_id_organizationId_key" ON "Client"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Project_organizationId_status_comparisonClass_idx" ON "Project"("organizationId", "status", "comparisonClass");

-- CreateIndex
CREATE INDEX "Project_organizationId_subtype_completedAt_idx" ON "Project"("organizationId", "subtype", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_businessKey_key" ON "Project"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_organizationId_key" ON "Project"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ProjectScope_organizationId_categoryId_idx" ON "ProjectScope"("organizationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectScope_organizationId_projectId_categoryId_key" ON "ProjectScope"("organizationId", "projectId", "categoryId");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_categoryId_active_idx" ON "Supplier"("organizationId", "categoryId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_businessKey_key" ON "Supplier"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_id_organizationId_key" ON "Supplier"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Material_organizationId_categoryId_active_idx" ON "Material"("organizationId", "categoryId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Material_organizationId_businessKey_key" ON "Material"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Material_id_organizationId_key" ON "Material"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ProjectSupplier_organizationId_supplierId_idx" ON "ProjectSupplier"("organizationId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSupplier_organizationId_projectId_supplierId_relatio_key" ON "ProjectSupplier"("organizationId", "projectId", "supplierId", "relationship");

-- CreateIndex
CREATE INDEX "ProjectMaterial_organizationId_materialId_idx" ON "ProjectMaterial"("organizationId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMaterial_organizationId_projectId_materialId_relatio_key" ON "ProjectMaterial"("organizationId", "projectId", "materialId", "relationship");

-- CreateIndex
CREATE INDEX "Document_organizationId_projectId_documentType_idx" ON "Document"("organizationId", "projectId", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "Document_organizationId_businessKey_key" ON "Document"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Document_id_organizationId_key" ON "Document"("id", "organizationId");

-- CreateIndex
CREATE INDEX "DocumentVersion_organizationId_authorityState_effectiveAt_idx" ON "DocumentVersion"("organizationId", "authorityState", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_organizationId_documentId_versionLabel_key" ON "DocumentVersion"("organizationId", "documentId", "versionLabel");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_id_organizationId_key" ON "DocumentVersion"("id", "organizationId");

-- CreateIndex
CREATE INDEX "EvidenceReference_organizationId_subjectType_subjectId_idx" ON "EvidenceReference"("organizationId", "subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "EvidenceReference_organizationId_authorityState_staleAt_idx" ON "EvidenceReference"("organizationId", "authorityState", "staleAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceReference_organizationId_subjectType_subjectId_clai_key" ON "EvidenceReference"("organizationId", "subjectType", "subjectId", "claimKey", "documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceReference_id_organizationId_key" ON "EvidenceReference"("id", "organizationId");

-- CreateIndex
CREATE INDEX "EvidenceConflict_organizationId_status_idx" ON "EvidenceConflict"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceConflict_organizationId_conflictKey_primaryEvidence_key" ON "EvidenceConflict"("organizationId", "conflictKey", "primaryEvidenceId", "conflictingEvidenceId");

-- CreateIndex
CREATE INDEX "Quote_organizationId_projectId_idx" ON "Quote"("organizationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_organizationId_businessKey_key" ON "Quote"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_id_organizationId_key" ON "Quote"("id", "organizationId");

-- CreateIndex
CREATE INDEX "QuoteVersion_organizationId_authorityState_approvedAt_idx" ON "QuoteVersion"("organizationId", "authorityState", "approvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteVersion_organizationId_quoteId_versionNumber_key" ON "QuoteVersion"("organizationId", "quoteId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteVersion_id_organizationId_key" ON "QuoteVersion"("id", "organizationId");

-- CreateIndex
CREATE INDEX "QuoteItem_organizationId_categoryId_idx" ON "QuoteItem"("organizationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteItem_organizationId_quoteVersionId_lineNumber_key" ON "QuoteItem"("organizationId", "quoteVersionId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteItem_id_organizationId_key" ON "QuoteItem"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ForecastCostVersion_organizationId_authorityState_effective_idx" ON "ForecastCostVersion"("organizationId", "authorityState", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastCostVersion_organizationId_projectId_versionNumber_key" ON "ForecastCostVersion"("organizationId", "projectId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastCostVersion_id_organizationId_key" ON "ForecastCostVersion"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ForecastCostLine_organizationId_categoryId_idx" ON "ForecastCostLine"("organizationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastCostLine_organizationId_forecastCostVersionId_lineN_key" ON "ForecastCostLine"("organizationId", "forecastCostVersionId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastCostLine_id_organizationId_key" ON "ForecastCostLine"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ProjectCostVersion_organizationId_authorityState_reconciled_idx" ON "ProjectCostVersion"("organizationId", "authorityState", "reconciledAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCostVersion_organizationId_projectId_versionNumber_key" ON "ProjectCostVersion"("organizationId", "projectId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCostVersion_id_organizationId_key" ON "ProjectCostVersion"("id", "organizationId");

-- CreateIndex
CREATE INDEX "CostLine_organizationId_categoryId_authorityState_idx" ON "CostLine"("organizationId", "categoryId", "authorityState");

-- CreateIndex
CREATE UNIQUE INDEX "CostLine_organizationId_projectCostVersionId_lineNumber_key" ON "CostLine"("organizationId", "projectCostVersionId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CostLine_id_organizationId_key" ON "CostLine"("id", "organizationId");

-- CreateIndex
CREATE INDEX "SupplierOffer_organizationId_supplierId_validUntil_idx" ON "SupplierOffer"("organizationId", "supplierId", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOffer_organizationId_businessKey_key" ON "SupplierOffer"("organizationId", "businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOffer_id_organizationId_key" ON "SupplierOffer"("id", "organizationId");

-- CreateIndex
CREATE INDEX "SupplierOfferItem_organizationId_categoryId_idx" ON "SupplierOfferItem"("organizationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOfferItem_organizationId_supplierOfferId_lineNumber_key" ON "SupplierOfferItem"("organizationId", "supplierOfferId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOfferItem_id_organizationId_key" ON "SupplierOfferItem"("id", "organizationId");

-- CreateIndex
CREATE INDEX "IntelligenceRun_organizationId_projectId_status_idx" ON "IntelligenceRun"("organizationId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligenceRun_organizationId_requestId_key" ON "IntelligenceRun"("organizationId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligenceRun_id_organizationId_key" ON "IntelligenceRun"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonRun_intelligenceRunId_key" ON "ComparisonRun"("intelligenceRunId");

-- CreateIndex
CREATE INDEX "ComparisonRun_organizationId_activeProjectId_status_idx" ON "ComparisonRun"("organizationId", "activeProjectId", "status");

-- CreateIndex
CREATE INDEX "ComparisonRun_organizationId_inputFingerprint_idx" ON "ComparisonRun"("organizationId", "inputFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonRun_id_organizationId_key" ON "ComparisonRun"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ComparisonCandidate_organizationId_comparisonRunId_rank_idx" ON "ComparisonCandidate"("organizationId", "comparisonRunId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonCandidate_organizationId_comparisonRunId_candidat_key" ON "ComparisonCandidate"("organizationId", "comparisonRunId", "candidateProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonCandidate_id_organizationId_key" ON "ComparisonCandidate"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ComparisonFactor_organizationId_factorKey_state_idx" ON "ComparisonFactor"("organizationId", "factorKey", "state");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonFactor_organizationId_comparisonCandidateId_facto_key" ON "ComparisonFactor"("organizationId", "comparisonCandidateId", "factorKey");

-- CreateIndex
CREATE INDEX "ComparisonClaim_organizationId_claimType_idx" ON "ComparisonClaim"("organizationId", "claimType");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonClaim_organizationId_comparisonRunId_claimKey_key" ON "ComparisonClaim"("organizationId", "comparisonRunId", "claimKey");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonClaim_id_organizationId_key" ON "ComparisonClaim"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ProposedAction_organizationId_projectId_status_idx" ON "ProposedAction"("organizationId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProposedAction_id_organizationId_key" ON "ProposedAction"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Action_organizationId_projectId_status_idx" ON "Action"("organizationId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Action_id_organizationId_key" ON "Action"("id", "organizationId");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_createdAt_idx" ON "AuditEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_actionId_idx" ON "AuditEvent"("organizationId", "actionId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditEvent_organizationId_requestId_eventType_key" ON "AuditEvent"("organizationId", "requestId", "eventType");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSupplier" ADD CONSTRAINT "ProjectSupplier_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSupplier" ADD CONSTRAINT "ProjectSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMaterial" ADD CONSTRAINT "ProjectMaterial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMaterial" ADD CONSTRAINT "ProjectMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceReference" ADD CONSTRAINT "EvidenceReference_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceReference" ADD CONSTRAINT "EvidenceReference_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceConflict" ADD CONSTRAINT "EvidenceConflict_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceConflict" ADD CONSTRAINT "EvidenceConflict_primaryEvidenceId_fkey" FOREIGN KEY ("primaryEvidenceId") REFERENCES "EvidenceReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceConflict" ADD CONSTRAINT "EvidenceConflict_conflictingEvidenceId_fkey" FOREIGN KEY ("conflictingEvidenceId") REFERENCES "EvidenceReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "QuoteVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCostVersion" ADD CONSTRAINT "ForecastCostVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCostVersion" ADD CONSTRAINT "ForecastCostVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCostVersion" ADD CONSTRAINT "ForecastCostVersion_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "ForecastCostVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCostLine" ADD CONSTRAINT "ForecastCostLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCostLine" ADD CONSTRAINT "ForecastCostLine_forecastCostVersionId_fkey" FOREIGN KEY ("forecastCostVersionId") REFERENCES "ForecastCostVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCostLine" ADD CONSTRAINT "ForecastCostLine_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastCostLine" ADD CONSTRAINT "ForecastCostLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCostVersion" ADD CONSTRAINT "ProjectCostVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCostVersion" ADD CONSTRAINT "ProjectCostVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCostVersion" ADD CONSTRAINT "ProjectCostVersion_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "ProjectCostVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLine" ADD CONSTRAINT "CostLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLine" ADD CONSTRAINT "CostLine_projectCostVersionId_fkey" FOREIGN KEY ("projectCostVersionId") REFERENCES "ProjectCostVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLine" ADD CONSTRAINT "CostLine_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLine" ADD CONSTRAINT "CostLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOffer" ADD CONSTRAINT "SupplierOffer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOffer" ADD CONSTRAINT "SupplierOffer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOffer" ADD CONSTRAINT "SupplierOffer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOfferItem" ADD CONSTRAINT "SupplierOfferItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOfferItem" ADD CONSTRAINT "SupplierOfferItem_supplierOfferId_fkey" FOREIGN KEY ("supplierOfferId") REFERENCES "SupplierOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOfferItem" ADD CONSTRAINT "SupplierOfferItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceRun" ADD CONSTRAINT "IntelligenceRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceRun" ADD CONSTRAINT "IntelligenceRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonRun" ADD CONSTRAINT "ComparisonRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonRun" ADD CONSTRAINT "ComparisonRun_intelligenceRunId_fkey" FOREIGN KEY ("intelligenceRunId") REFERENCES "IntelligenceRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonRun" ADD CONSTRAINT "ComparisonRun_activeProjectId_fkey" FOREIGN KEY ("activeProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonRun" ADD CONSTRAINT "ComparisonRun_activeQuoteVersionId_fkey" FOREIGN KEY ("activeQuoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonCandidate" ADD CONSTRAINT "ComparisonCandidate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonCandidate" ADD CONSTRAINT "ComparisonCandidate_comparisonRunId_fkey" FOREIGN KEY ("comparisonRunId") REFERENCES "ComparisonRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonCandidate" ADD CONSTRAINT "ComparisonCandidate_candidateProjectId_fkey" FOREIGN KEY ("candidateProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonFactor" ADD CONSTRAINT "ComparisonFactor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonFactor" ADD CONSTRAINT "ComparisonFactor_comparisonCandidateId_fkey" FOREIGN KEY ("comparisonCandidateId") REFERENCES "ComparisonCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonClaim" ADD CONSTRAINT "ComparisonClaim_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonClaim" ADD CONSTRAINT "ComparisonClaim_comparisonRunId_fkey" FOREIGN KEY ("comparisonRunId") REFERENCES "ComparisonRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_comparisonRunId_fkey" FOREIGN KEY ("comparisonRunId") REFERENCES "ComparisonRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_comparisonRunId_fkey" FOREIGN KEY ("comparisonRunId") REFERENCES "ComparisonRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_proposedActionId_fkey" FOREIGN KEY ("proposedActionId") REFERENCES "ProposedAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorMembershipId_fkey" FOREIGN KEY ("actorMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_comparisonRunId_fkey" FOREIGN KEY ("comparisonRunId") REFERENCES "ComparisonRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_proposedActionId_fkey" FOREIGN KEY ("proposedActionId") REFERENCES "ProposedAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;
