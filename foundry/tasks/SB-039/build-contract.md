# Build contract

- Trusted runtime context supplies membership, tenant and capabilities on every turn. Each tool rechecks project access and exclusion before reading. Comparison tools reuse Home freshness and reject excluded source jobs.
- Seven bounded read tools; no write tools or comparison execution. Results contain server-generated source IDs/links. Only this turn's results may ground the answer; past assistant answers are never resubmitted as facts.
- Model output is schema checked, at most 120 words and three follow-ups. Unknown citations and unsupported numeric tokens discard the answer. Empty or restricted results produce a fixed localized refusal, not invented facts.
- The model port carries provider-neutral messages, function definitions and structured output. A deterministic scripted fake is test-only. The live adapter is server-only.
- Organization switch defaults off; synthetic fixture enables its sample organization. Per-job exclusion is independent of data mode. Control changes are authorized, idempotent and audited atomically.
- Reserve each model call atomically against the organization's daily cap before sending. Store metadata only: request/member/provider/model/time, tool names, source IDs, tokens, estimated USD and terminal outcome. No prompts, responses, arguments or financial values.
- Redact identifiers, account/card numbers and password values before sending. Time, input/output and six-tool-call limits fail to the keyword path; no provider errors or credentials reach clients/logs.
- CI runs the fake without model network access. The manual evaluation workflow uses only a disposable seeded database and an explicitly configured paid provider. Report unrun evaluation separately from passing unit tests.
- Keep PR draft; hosted acceptance WAITING_FOR_PRODUCT_DIRECTOR. Terms wording review remains a Product Director task.
