# Issue draft — Intake File Reading v0.1: PDF and photo into review-only staging

Stage 3 addition in `docs/product/V0_2_WORKFLOW_SLICE.md`. Needs issue #37 parts A to C (validation, staging, reviewed commit) and ADR-007. Copy the text below into a new GitHub issue.

---

## Goal

Issue #37 brings in CSV and Excel tables and attaches PDFs as documents "without claiming OCR". Many small firms hold their old quotes only as PDFs or phone photos. This issue lets a model read those into the same review-only staging, so a person confirms the lines exactly as they do for a spreadsheet. Nothing the model reads becomes a record without that confirmation.

## Scope

1. `DocumentReaderPort` in `src/modules/intake/`, with one model adapter. The output is validated against a fixed schema that maps to `IntakeDraft`. The prompt is versioned in the repository.
2. `PDF` and `IMAGE` added to `IntakeSourceKind`.
3. `ExtractionRun` and `ExtractedLine` tables as review-only staging: model name, prompt version, raw output, and per line a locator (page and row) for provenance.
4. Every draft passes through `reviewIntakeDraft` unchanged. `LINE_AMOUNT_MISMATCH`, `TOTAL_MISMATCH` and `UNKNOWN_CATEGORY` are shown on the line they belong to. The model suggests a category only from the allowed list.
5. Extraction runs as a background job. The review screen polls the run status.
6. The review screen from #37 shows the file beside the lines, so a person can compare each line with the page it came from.
7. An evaluation script that runs the synthetic file set and reports, per file, how many lines matched the expected values.

## Security gates

- Synthetic files only. No real customer file is sent to a model provider before an explicit data-processing decision (see #37 and #39).
- The provider key is a server-only environment variable. Prompts and outputs containing file content are not logged outside the tenant's own staging rows.
- The model adapter cannot reach a repository or a write path. It receives one file and returns data.
- Text inside a file is treated as data. A file that contains instructions must not change what the reader does; add a prompt-injection test.

## Acceptance

- A synthetic PDF quote and a phone photo of a printed quote both arrive in staging with a locator on every line.
- Every line whose arithmetic fails is marked before a person can confirm.
- A line the person corrects is committed with the corrected value and a record of the edit.
- An unconfirmed line never appears in a comparison, an economics result or a quote draft.
- With the provider key removed or the provider failing, upload still stores the file and the screen says reading is unavailable. Nothing is partially committed.
- The evaluation report is committed with the task and states accuracy per file honestly, including failures.
- `npm run check` passes.

## Out of scope

Handwriting, drawings and floor plans, automatic commit above a confidence level, a separate OCR service (add one only if the evaluation shows the model misreads scans), and real customer files.

## Delivery sequence

A. Port, schema and adapter behind a feature flag, with the evaluation script.
B. Staging tables and background run.
C. Review screen changes and commit through the #37 writer.
