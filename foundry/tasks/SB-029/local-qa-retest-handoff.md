# SB-029 independent local browser retest

Status: repaired source, deterministic gates and local production preview are ready.
Start only after the final publication head passes exact-head GitHub CI.
Validated application: `df63c90ca994653299082fc5078ad0b5ef595292`.
Source manifest SHA-256: `82ce9a43b9bf4da5280c09cb839eeb277213acd09b73e46aa0a8f15f2758a460`.
Production BUILD_ID: `4Zn6yTS6DP2jLb0DDZye_`.
This handoff does not accept Stage 8. PR #31 stays draft; do not merge.

## Preserve the first run

The immutable first run is `20261116T041837Z`, evidence branch
`qa/sb-029-local-20261116T041837Z`, commit
`0c9b4293a9e91aa6121b8571e7f22537b131760d`, direct parent
`13e7191f340e998c93b644949602f1c0774fe9ff`. Its scoped result remains
**9 PASS, 3 FAIL, 5 PARTIAL, 1 BLOCKED**. Do not change its files, branch, database
or reported outcomes. Read its `REPORT.txt`, `FINDINGS.txt`,
`screenshot-review.json` and reproduction artifacts through the evidence commit.
Loading or pre-result screenshots do not establish final behavior.

Create a new UTC run ID at retest start (`date -u +%Y%m%dT%H%M%SZ`). Record the
actual start/end timestamps, exact repaired HEAD, source manifest, production
BUILD_ID, browser/backend, Node/PostgreSQL versions, persona, locale, viewport,
steps, expected/observed behavior, acceptance criteria, screenshots, timings,
before/after SQL counts and restoration evidence. Put the new run under
`foundry/tasks/SB-029/evidence/local-qa/<NEW-UTC-RUN-ID>/`.

## Exact-head readiness

Use `build/sb-029-governed-internal-review`, never a moving or unverified source.
The final PR description provides the exact repaired commit and successful CI
run. Verify GitHub's reported workflow `head_sha` equals that commit, not merely
that the branch has an earlier green run. Compare the source-tree manifest with
`evidence/revision-20261116/source-verification.json`. Confirm a clean product
worktree and exactly eight migrations. Use `validation-revision.json` and its
retained sanitized logs for deterministic results; these earn no browser pass.

The original `cloud-qa/prepare-runtime.py` is deliberately pinned to the old
application and must reject the repaired source. Do not loosen that historical
verifier. This handoff supersedes its old source/build pins for this retest.

## Prepared host-local runtime

The repair validation uses a separate PostgreSQL 17 container
`stridebrain-sb029-revision-qa`, database `stridebrain_sb029_revision`, bound only
to `127.0.0.1:54330`, with newly generated private credentials. The original
`stridebrain-sb029-cloud-qa` database is preserved. Runtime files are private in
`/tmp/sb029-revision/runtime` (directory 0700, private files 0600). No private
runtime or credentials belong in evidence or Git.

On this same host, use these private wrappers:

```sh
/tmp/sb029-revision/runtime/run.sh npm run db:verify
/tmp/sb029-revision/runtime/run-operator.sh preflight
/tmp/sb029-revision/runtime/run-operator.sh check-imports
```

Read `evidence/revision-20261116/preview-readiness.json` for the observed server
and build status. If the managed processes have stopped, restart the unchanged
validated production build on `localhost:3000` and the operator on loopback 3001:

```sh
/tmp/sb029-revision/runtime/run.sh node node_modules/next/dist/bin/next start --hostname localhost --port 3000
/tmp/sb029-revision/runtime/run-operator.sh serve
```

Use separate long-running sessions. Confirm port ownership before starting;
do not stop unrelated processes. Bind hostname must remain `localhost`, matching
the strict origin guard. No deployment, Vercel, DNS or live-domain change.
If the runtime is unavailable on a different host, recreate fresh private
credentials, a separate loopback PostgreSQL 17 database, all eight migrations,
repeat fixtures/SQL checks and the exact repaired production build. Never copy
old credentials, sessions or database files. Record new readiness evidence.

The private operator copy changes only its exact runtime directory and database
name/port guard from the reviewed helper; it retains fixed personas and the
existing trusted session service. Issue only the session needed at that time:

```sh
/tmp/sb029-revision/runtime/run-operator.sh issue mei en
```

Available personas: `mei`, `finance`, `admin`, `viewer`, `northern`; locales `en`
and `zh-TW`. The operator returns a private bootstrap-file location, not a
credential in evidence. Open that one-use URL using the actual browser tool's
supported authentication flow. Do not paste its URL, cookie or token into
reports or screenshots. Sessions last one hour; bootstrap links last five
minutes. Do not inject browser storage/cookies as business truth or fabricate
identity. Revoke this runtime's issued sessions on completion.

## Required execution

Use the full scenario definitions and matrix in `computer-qa-plan.yaml`; its
historical environment/status fields are superseded by this handoff. Test only
reviewed synthetic fixtures and retain independent before/after SQL proof.

1. **QA-18 / F-01 first:** inspect active total NT$12,650,000 and imported stone
   NT$2,360,000. Active amounts must say forecast direct cost; historical amounts
   must say reconciled actual cost. Follow every authority through table, source,
   calculation, locked rationale, receipt and workspace, in en and zh-TW, with
   screen-reader/accessible names and desktop/mobile views. Also preserve quoted
   price and supplier-offer distinctions, canonical ranks 88/81/79/71/69/63,
   lighting 2-of-3 abstention and programme uncertainty. Stop and return to Builder
   if authority remains wrong; no further business-write tests after a P1 defect.
2. **QA-05 / F-02 completely:** immediately edit every field as soon as the sheet
   accepts input; perform consecutive title/rationale/assignee/date edits before
   delayed navigation settles. Immediately switch locale through both dialog and
   shell controls; open/close supporting evidence; refresh; use back/forward.
   Proposal, all allowed draft values, evidence-return context and locale must
   survive. Record URL and visible state after transitions settle, plus proposal
   and action counts proving no duplicate preparation/creation.
3. **QA-16 + QA-18 / F-03 completely:** inspect every claim, source preview,
   calculation and factor panel in zh-TW and en. Reject untranslated enums,
   internal policy IDs, source(s), Code/State, Currentnormalizedamount,
   Descriptionen and Unitprice. Confirm natural Taiwan Traditional Chinese,
   correct units, authority, rounding and calculation meaning, headings, warnings,
   empty/error states and accessible labels. Exercise 1440x900, 768x1024,
   390x844 and 320x740; verify close controls and every child fit/reflow, not just
   document width. Capture pending states and keyboard occlusion where supported.
4. **Resolve PARTIAL cases:** QA-07 expired-session browser denial; QA-08 full
   foreign/nonexistent project/run/enrichment/evidence/proposal/receipt pairs;
   QA-09 no-assign alternate payload, each evidence-ineligible/unassigned-person
   variant and locked default; QA-11 newly inserted conflict; QA-12 every
   capability/feature-flag/project-assignment downgrade. Follow all matrix
   variants, not only the listed previous gaps. Restore every temporary fixture
   mutation and prove no unauthorized action/receipt/audit/consumption.
5. **QA-15 separately:** complete locally supported keyboard-only, focus,
   validation association, native date, 200% zoom, reduced-motion and accessible
   semantics checks. Record actual browser capability and observed results.
   Unsupported screen-reader announcements, zoom overrides, motion settings or
   native-device behavior require explicit manual-human verification items with
   precise steps. Never invent a pass. A DOM assertion is not screen-reader proof.
6. After targeted retesting, run a regression smoke across **QA-01 through QA-18**,
   both locales and required personas. Exercise preparation, confirmation,
   cancellation, evidence return, receipt reopening, retry/conflict, expiry,
   rollback, tenant/access denial, performance and excluded behavior. Distinguish
   complete scenario results from scoped observations and supplemental tests.

## Evidence and publication

Capture final settled screens; identify loading, pre-result or viewport-transition
frames. Keep failures, partials and unsupported checks explicit. Restore fixture
mutations, remove only this run's temporary grants/triggers, verify four immutable
history guards, business counts, one-consumption behavior and session revocation.
Scan all text, logs, image metadata and visible screenshots for sessions, cookies,
bootstrap URLs, signing secrets, database credentials, private environment values
and personal local paths. Redact secrets before publication without inventing
observations. Keep complete commands, timings and sanitized source fingerprints.

Publish a **new evidence-only branch** `qa/sb-029-local-<NEW-UTC-RUN-ID>` based on
the repaired exact head. Commit only that new run subtree after verifying the
staged diff. Do not commit product/generated/runtime/database files, credentials
or changes to historical evidence. Push and return the exact evidence commit,
parent, files, sanitation result, scenario counts and unresolved scenario IDs.
The Builder must not approve its own fixes. Final independent browser review and
human merge/release approval remain required.
