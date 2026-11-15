# Stage 6 — PostgreSQL Integration Review

**Status:** integration defect corrected; exact-head CI required  
**Scope:** real signed-session Stage 4 → Stage 5 → Stage 6 hero pipeline

## Finding

The first real PostgreSQL service integration test reached Stage 4 persistence and exposed a mismatch between the accepted `CPI-SIM-1.0` persistence contract and the original Stage 1 database checks.

The Stage 4 service correctly stores:

- `ComparisonCandidate.evidenceCoverage` as percentage points in the range `0..100`;
- `ComparisonFactor.weight` as configured score points in the range `0..100`.

The original database constraints incorrectly limited both columns to fractional values in the range `0..1`. As a result, a valid candidate with `100.0000` evidence coverage could not be persisted even though the immutable DTO and all deterministic calculations were valid.

## Correction

Migration `0007_stage6_comparison_persistence_scales` changes only the persistence checks:

```text
ComparisonCandidate.evidenceCoverage  0..100
ComparisonFactor.weight               0..100
ComparisonFactor.contribution         0..weight
```

It does not change:

- similarity formulas;
- weights;
- scores;
- evidence-coverage calculations;
- canonical ranking;
- Stage 4 snapshot schema;
- Stage 5 economics;
- authorization behavior.

## Independent verification

`verify-stage6-comparison-persistence.sql` reads the live PostgreSQL constraint definitions after migration and fails unless:

- evidence coverage uses the accepted percentage-point scale;
- factor weight uses the accepted score-point scale;
- factor contribution cannot exceed its configured weight.

The seeded PostgreSQL hero-flow integration test remains the stronger behavioral proof: it must create a real signed demo session, persist Stage 4 candidates and factors, run Stage 5 economics, and compose the Stage 6 presentation result.

## Review conclusion

This is a forward schema correction for a latent integration defect, not a policy change. The migration is acceptable only if exact-head CI confirms:

- all prior migrations still apply cleanly;
- all Stage 1–5 SQL verification remains green;
- the Stage 4 canonical ranking remains unchanged;
- the real hero pipeline persists and reopens successfully;
- all formatting, lint, TypeScript, tests, production build, and audit gates pass.
