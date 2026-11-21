# SB-041 — Jobs v0.1

Issue: https://github.com/FATTY-BAMBA/StrideBrain/issues/41
Branch: `build/sb-041-jobs`; base: `main`.

Deliver in order: A capabilities, project writes and use cases with tests; B bilingual creation form and server actions; C stage-grouped Projects page. One pull request.

Create a reviewed commercial retail job in QUOTE_REVIEW with complete comparison context, an existing or new tenant-scoped client, creator assignment and audit. Allow authorized stage changes except COMPLETE, which belongs to the close-job flow. Preserve the synthetic-only environment gate, deterministic comparison and organization/assignment boundaries.

Out of scope: residential types, model calls, job deletion, field editing, quotes, financial reconciliation, real tenant data and deployment cutover.

PR #43 revision: remove feature data-mode gates, make matching create retries return original success, and simplify intake to fixed hidden class/unit/currency, generated editable reference, existing-client selection and one scope list with derived commercial categories.

Reference refinement: server-generated defaults use `J-<YYMM>-<4 characters>` (UTC month) with no 0/O/1/I/L in the random suffix. Editing and duplicate handling remain unchanged.
