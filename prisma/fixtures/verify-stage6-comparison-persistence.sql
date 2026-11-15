-- Stage 6 integration verification for Stage 4 comparison persistence scales.
-- This independently checks the live PostgreSQL constraints rather than
-- trusting the application serializer or migration text.

DO $$
DECLARE
  coverage_definition TEXT;
  weight_definition TEXT;
  contribution_definition TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid)
    INTO coverage_definition
    FROM pg_constraint
   WHERE conname = 'ComparisonCandidate_evidenceCoverage_check'
     AND conrelid = '"ComparisonCandidate"'::regclass;

  SELECT pg_get_constraintdef(oid)
    INTO weight_definition
    FROM pg_constraint
   WHERE conname = 'ComparisonFactor_weight_check'
     AND conrelid = '"ComparisonFactor"'::regclass;

  SELECT pg_get_constraintdef(oid)
    INTO contribution_definition
    FROM pg_constraint
   WHERE conname = 'ComparisonFactor_contribution_check'
     AND conrelid = '"ComparisonFactor"'::regclass;

  IF coverage_definition IS NULL
     OR position('100' IN coverage_definition) = 0 THEN
    RAISE EXCEPTION 'ComparisonCandidate evidenceCoverage must use the accepted 0..100 percentage-point scale: %', coverage_definition;
  END IF;

  IF weight_definition IS NULL
     OR position('100' IN weight_definition) = 0 THEN
    RAISE EXCEPTION 'ComparisonFactor weight must use the accepted 0..100 percentage-point scale: %', weight_definition;
  END IF;

  IF contribution_definition IS NULL
     OR position('weight' IN lower(contribution_definition)) = 0 THEN
    RAISE EXCEPTION 'ComparisonFactor contribution must remain bounded by factor weight: %', contribution_definition;
  END IF;
END $$;
