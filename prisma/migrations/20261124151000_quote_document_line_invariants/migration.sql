-- Retain legacy two-decimal line reconciliation. Sectioned documents round each
-- item to whole dollars; percentage totals are reconciled by the domain service.
ALTER TABLE "QuoteItem" DROP CONSTRAINT "QuoteItem_amount_check";
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_amount_check" CHECK (
  ("sectionId" IS NULL AND "kind" = 'ITEM' AND "percentage" IS NULL
    AND "quantity" > 0 AND "unitPrice" >= 0 AND "amount" >= 0
    AND "amount" = round("quantity" * "unitPrice", 2))
  OR
  ("sectionId" IS NOT NULL AND "amount" >= 0 AND (
    ("kind" = 'ITEM' AND "percentage" IS NULL AND "quantity" >= 0 AND "unitPrice" >= 0
      AND "amount" = round("quantity" * "unitPrice", 0))
    OR ("kind" = 'PERCENTAGE' AND "percentage" IS NOT NULL AND "percentage" >= 0
      AND "quantity" = 0 AND "unitPrice" = 0 AND "amount" = round("amount", 0))
    OR ("kind" = 'NOTE' AND "percentage" IS NULL AND "quantity" = 0
      AND "unitPrice" = 0 AND "amount" = 0)
  ))
);
