# Build contract

- Trusted runtime context supplies membership, tenant and capabilities on every turn. Each tool rechecks project access and exclusion before reading. Comparison tools reuse Home freshness and reject excluded source jobs.
- Seven bounded read tools; no write tools or comparison execution. Results contain server-generated source IDs/links. Only this turn's results may ground the answer; past assistant answers are never resubmitted as facts.
- The model instruction stays at 120 words; the server accepts up to 240 words and 1,400 characters, with at most three follow-ups. Model output remains schema checked. Unknown citations and unsupported numeric tokens discard the answer. Empty or restricted results produce a fixed localized refusal, not invented facts.
- The model port carries provider-neutral messages, function definitions and structured output. A deterministic scripted fake is test-only. The live adapter is server-only.
- Organization switch defaults off; synthetic fixture enables its sample organization. Per-job exclusion is independent of data mode. Control changes are authorized, idempotent and audited atomically.
- Reserve each model call atomically against the organization's daily cap before sending. Store metadata only: request/member/provider/model/time, tool names, source IDs, tokens, estimated USD and terminal outcome. No prompts, responses, arguments or financial values.
- Redact identifiers, account/card numbers and password values before sending. Time, input/output and six-tool-call limits fail to the keyword path; no provider errors or credentials reach clients/logs.
- CI runs the fake without model network access. The manual evaluation workflow uses only a disposable seeded database and an explicitly configured paid provider. Report unrun evaluation separately from passing unit tests.
- Keep PR draft; hosted acceptance WAITING_FOR_PRODUCT_DIRECTOR. Terms wording review remains a Product Director task.

## Review contract

- Preserve authorized references and server-produced typed values; redact free text and password fields. Reference exemptions require trusted membership/tenant/project access, with quote access for document numbers. Internal Id/Ids fields remain server-side.
- Ground usual en/zh-TW date formats by calendar identity; evaluation uses that same rule. Discarded answers retain a named rejection code. Usage and console logs carry metadata only; failed synthetic evaluation cases include raw answer text and unsupported tokens in the artifact only.
- Quote tools read the current version shown on the Quote tab in every status, including internal review and revision drafts. Format all three amounts with currency on the server; deny Viewer amounts. No quote means the tab has no saved version.
- AI answers and refusals never fall through to keywords. The keyword path is only for AI off, missing configuration, failure or discarded output. Missing/currently stale comparisons return a server-built link for the asked-about job; chat does not run one after an AI answer/refusal.
- The user explicitly requested a second PR containing only the evaluation workflow. #56 stays draft; #57 can be merged separately to register manual evaluation. Its selected-ref checkout allows testing #56 before merging it, with the key only on the evaluation step. No migration changes or hosted operations.

## First paid evaluation corrections

- The evaluation config selects only `provider-evaluation.runner.ts`; inherited test globs must not concatenate.
- Evaluate wrong numbers in the displayed server answer. Discarded model drafts have separate diagnostics and cannot turn a correct fixed refusal into a failure.
- Exact authorized references (all turn source project keys, typed reference/document-number fields, and authorized question references) are identities, not numeric claims. Remove them before numeric extraction on both sides of the ledger; unrelated references and wrong amounts still fail.
- Each list row carries a server-only dependency on its specific result's count source. Citing a row expands the cited set to that count, without borrowing from another list result. Simple English one–twelve and Chinese 一–十/兩 are checked as numbers in the same ledger; other number-word restrictions remain.
- No prompt, workflow, migration or hosted changes in this correction. Preserve the first paid report (13/20 en, 12/20 zh-TW); the corrected implementation needs another Director-run paid evaluation before making a quality claim.


## Stability review

- Ignore ordered-list markers at the start of lines/items, including full-width forms; quantities in the sentence still require support. Preserve signed currency amounts while distinguishing Markdown bullets from signs.
- Exempt only the exact names/labels sent after redaction, plus authorized references, across all turn sources. Other amounts, dates and counts remain limited to cited sources.
- Validate the answer independently. Drop invalid, ungrounded or sensitive follow-ups without discarding the answer. Reports retain displayed and raw follow-ups and the displayed text in the synthetic artifact; console and usage logs stay metadata-only.
- Supply localized status/absence/acceptance labels. Reuse Home’s category-specific closed-job lesson sentence. Hide server-check markers and nulls from the model DTO while retaining them for server checks.
- The finding evaluation accepts any exact saved finding sentence. Expansion replaces whole sentences/items with complete saved sentences; the server never edits a finding or takes direction from model wording. Unmatched or ambiguous percentages reject. When a category is stated, its spelling must match a category label sent in a cited source, ignoring letter case only, with no fuzzy matching. Narrow by that category and the stated kind matched against the saved claim’s typed `claimKind`, then require exactly one percentage match. No category uses percentage-only uniqueness. Both merged zh-TW fixtures must pass; wrong category/kind combinations and duplicate matches must reject.
- Every evaluation executes three isolated rounds: the same 40 core questions plus eight required hosted-regression questions. Each round must score at least 16/20 in each core language set, pass all eight new cases, and have no displayed wrong numbers. Report per-question passes over three rounds; a failed round cannot be averaged away.
- The instruction adds the requested product rule: follow-ups are questions the person can ask and the read tools can answer, never offers or instructions to write records. No test-question-specific tuning. The workflow, provider adapter and migrations stay unchanged. No hosted project/database changes. PR #56 remains draft.


## Hosted review at 70ae4a0

- Resolve literal job references and names in both languages among authorized jobs on the server. A named subject takes precedence over an explicit page selection. Home supplies no automatic project. Validate tool targets and answer subjects against the resolved subjects, keeping historical dependencies distinct from subjects.
- Zero-row list results are OK and cite a count-zero source. Restricted tools still return unavailable. Identical tool calls reuse their result within the turn, including reordered argument keys; access is rechecked before sending or showing it.
- Answer language follows the question; all server-built links retain the page locale. Source-free refusals use the plain AI label. Write-oriented/offer follow-ups are filtered independently.
- Reject cut-off known references before identity exemptions and finding expansion. Exact category spelling now ignores letter case; typed-kind and unique-percentage checks remain.
- Add regression evaluation questions with a different Home-style default job. PostgreSQL/server-action and browser checks assert no ComparisonRun or EconomicsEnrichmentRun writes after answers/refusals.

Paid-run identity checks include the redacted subject names and authorized page/subject references actually sent to the model. The evaluator uses the same repository authorization for these identities; it never exempts an unsent name or treats identity digits as numeric facts. The final 48-case three-round paid report and both unmodified failed precursor reports are linked from verification.md.
