-- Stage 6 integration hardening.
-- Stage 4 stores human-readable percentage-point values for candidate
-- evidence coverage and configured factor weights. The original Stage 1
-- checks incorrectly constrained both columns to fractional 0..1 values,
-- which prevented the real application service from persisting a complete
-- comparison run. Preserve the accepted CPI-SIM-1.0 scale explicitly.

ALTER TABLE "ComparisonCandidate"
  DROP CONSTRAINT "ComparisonCandidate_evidenceCoverage_check",
  ADD CONSTRAINT "ComparisonCandidate_evidenceCoverage_check"
    CHECK ("evidenceCoverage" >= 0 AND "evidenceCoverage" <= 100);

ALTER TABLE "ComparisonFactor"
  DROP CONSTRAINT "ComparisonFactor_weight_check",
  ADD CONSTRAINT "ComparisonFactor_weight_check"
    CHECK ("weight" >= 0 AND "weight" <= 100),
  DROP CONSTRAINT "ComparisonFactor_contribution_check",
  ADD CONSTRAINT "ComparisonFactor_contribution_check"
    CHECK (
      "contribution" IS NULL
      OR ("contribution" >= 0 AND "contribution" <= "weight")
    );
