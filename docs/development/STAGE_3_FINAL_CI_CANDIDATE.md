# Stage 3 — Final CI Candidate

This commit triggers the definitive full CI run for the authorized Project Workspace read model.

The candidate includes:

- trusted `RuntimeContext` input;
- assignment-aware, non-disclosing project lookup;
- independent quote, forecast, actual-cost, evidence, comparison, and action capability decisions;
- organization-scoped Prisma reads;
- exact decimal-string transport;
- explicit quote / supplier-offer / forecast / reconciled-actual authority separation;
- conflict, stale, partial, permission-restricted, ready, and unavailable states;
- Viewer commercial and action-read suppression before repository access;
- Traditional Chinese and English localized display behavior;
- Organization Admin behavior without explicit assignment;
- assigned and unassigned Financial Reviewer behavior;
- focused PostgreSQL fixture verification for current Xinyi quote/forecast and Stage 3 role assignments;
- application, repository, authorization, fixture, and review documentation.

Stage 4 candidate discovery, similarity scoring, historical aggregation, model synthesis, and business-state writes remain excluded.

Merge remains blocked until the exact-head CI run passes format, lint, typecheck, unit tests, production build, migrations, fixture seed, and all database verification scripts.
