-- Stage 1 authority and financial invariants.
-- These checks make it impossible to relabel one financial observation model
-- as another and preserve explicit version/supersession semantics.

ALTER TABLE "QuoteVersion"
  ADD CONSTRAINT "QuoteVersion_observationType_check"
    CHECK ("observationType" = 'QUOTED_PRICE'),
  ADD CONSTRAINT "QuoteVersion_authorityState_check"
    CHECK ("authorityState" <> 'RECONCILED_ACTUAL'),
  ADD CONSTRAINT "QuoteVersion_supersession_check"
    CHECK (("authorityState" = 'SUPERSEDED') = ("supersededById" IS NOT NULL)),
  ADD CONSTRAINT "QuoteVersion_not_self_superseded_check"
    CHECK ("supersededById" IS NULL OR "supersededById" <> "id"),
  ADD CONSTRAINT "QuoteVersion_amounts_check"
    CHECK (
      "amountBeforeTax" >= 0
      AND "taxAmount" >= 0
      AND "totalAmount" = "amountBeforeTax" + "taxAmount"
    );

ALTER TABLE "ForecastCostVersion"
  ADD CONSTRAINT "ForecastCostVersion_observationType_check"
    CHECK ("observationType" = 'FORECAST_DIRECT_COST'),
  ADD CONSTRAINT "ForecastCostVersion_authorityState_check"
    CHECK ("authorityState" <> 'RECONCILED_ACTUAL'),
  ADD CONSTRAINT "ForecastCostVersion_supersession_check"
    CHECK (("authorityState" = 'SUPERSEDED') = ("supersededById" IS NOT NULL)),
  ADD CONSTRAINT "ForecastCostVersion_not_self_superseded_check"
    CHECK ("supersededById" IS NULL OR "supersededById" <> "id"),
  ADD CONSTRAINT "ForecastCostVersion_amount_check"
    CHECK ("totalDirectCost" >= 0);

ALTER TABLE "ProjectCostVersion"
  ADD CONSTRAINT "ProjectCostVersion_observationType_check"
    CHECK ("observationType" = 'RECONCILED_ACTUAL_COST'),
  ADD CONSTRAINT "ProjectCostVersion_supersession_check"
    CHECK (("authorityState" = 'SUPERSEDED') = ("supersededById" IS NOT NULL)),
  ADD CONSTRAINT "ProjectCostVersion_not_self_superseded_check"
    CHECK ("supersededById" IS NULL OR "supersededById" <> "id"),
  ADD CONSTRAINT "ProjectCostVersion_amount_check"
    CHECK ("totalDirectCost" >= 0),
  ADD CONSTRAINT "ProjectCostVersion_reconciledAt_check"
    CHECK ("authorityState" <> 'RECONCILED_ACTUAL' OR "reconciledAt" IS NOT NULL);

ALTER TABLE "SupplierOffer"
  ADD CONSTRAINT "SupplierOffer_observationType_check"
    CHECK ("observationType" = 'SUPPLIER_OFFER'),
  ADD CONSTRAINT "SupplierOffer_authorityState_check"
    CHECK ("authorityState" <> 'RECONCILED_ACTUAL'),
  ADD CONSTRAINT "SupplierOffer_amount_check"
    CHECK ("amountBeforeTax" >= 0),
  ADD CONSTRAINT "SupplierOffer_validity_check"
    CHECK ("validUntil" IS NULL OR "validUntil" >= "offeredAt");

ALTER TABLE "DocumentVersion"
  ADD CONSTRAINT "DocumentVersion_supersession_check"
    CHECK (("authorityState" = 'SUPERSEDED') = ("supersededById" IS NOT NULL)),
  ADD CONSTRAINT "DocumentVersion_not_self_superseded_check"
    CHECK ("supersededById" IS NULL OR "supersededById" <> "id");

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_areaQuantity_check"
    CHECK ("areaQuantity" > 0),
  ADD CONSTRAINT "Project_programmeWeeks_check"
    CHECK ("programmeWeeks" IS NULL OR "programmeWeeks" > 0),
  ADD CONSTRAINT "Project_completedAt_check"
    CHECK ("status" NOT IN ('COMPLETED', 'CLOSED') OR "completedAt" IS NOT NULL);

ALTER TABLE "QuoteItem"
  ADD CONSTRAINT "QuoteItem_amount_check"
    CHECK (
      "quantity" > 0
      AND "unitPrice" >= 0
      AND "amount" >= 0
      AND "amount" = round("quantity" * "unitPrice", 2)
    );

ALTER TABLE "ForecastCostLine"
  ADD CONSTRAINT "ForecastCostLine_amount_check"
    CHECK (
      "quantity" > 0
      AND "unitCost" >= 0
      AND "amount" >= 0
      AND "amount" = round("quantity" * "unitCost", 2)
    );

ALTER TABLE "CostLine"
  ADD CONSTRAINT "CostLine_amount_check"
    CHECK (
      "quantity" > 0
      AND "unitCost" >= 0
      AND "amount" >= 0
      AND "amount" = round("quantity" * "unitCost", 2)
    );

ALTER TABLE "SupplierOfferItem"
  ADD CONSTRAINT "SupplierOfferItem_amount_check"
    CHECK (
      "quantity" > 0
      AND "unitPrice" >= 0
      AND "amount" >= 0
      AND "amount" = round("quantity" * "unitPrice", 2)
    );

ALTER TABLE "ComparisonCandidate"
  ADD CONSTRAINT "ComparisonCandidate_score_check"
    CHECK ("score" >= 0 AND "score" <= 100),
  ADD CONSTRAINT "ComparisonCandidate_evidenceCoverage_check"
    CHECK ("evidenceCoverage" >= 0 AND "evidenceCoverage" <= 1),
  ADD CONSTRAINT "ComparisonCandidate_rank_check"
    CHECK ("rank" > 0);

ALTER TABLE "ComparisonFactor"
  ADD CONSTRAINT "ComparisonFactor_weight_check"
    CHECK ("weight" >= 0 AND "weight" <= 1),
  ADD CONSTRAINT "ComparisonFactor_normalizedValue_check"
    CHECK ("normalizedValue" IS NULL OR ("normalizedValue" >= 0 AND "normalizedValue" <= 1)),
  ADD CONSTRAINT "ComparisonFactor_contribution_check"
    CHECK ("contribution" IS NULL OR "contribution" >= 0);
