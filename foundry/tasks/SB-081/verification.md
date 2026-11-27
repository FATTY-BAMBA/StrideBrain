# Verification — delivery A

27 November 2026. Draft PR #83, base main `2443d9d`. Issue #81 and AGENTS.md read before implementation.

A changes only server refusal copy: a zero-match named list_jobs search and the existing final unreadable-job guard now use “No job by that name was found.” / 「找不到這個名稱的專案。」. No instruction, tool schema, guard timing or existing authorization assertion changed.

Verified: 33 recorded zero-match source ledgers from SB-079 paid-run-6 replay through the live AskAssistant refusal path; both-language unreadable-guard cases; existing AskAssistant tests. Targeted run: 73 tests passed. TypeScript passed after correcting the new test's optional field construction.

Before B, clarification is required: the issue says unreadable job names/references never reach the model, but existing tests intentionally require the unreadable-identity guard only after two model calls, and the original question currently reaches the model unchanged except for general PII redaction. The issue also says those security tests remain unchanged. Clarification is being posted on the PR under AGENTS.md's working rule. No paid run dispatched; budget remains US$1.00.

Not verified: full npm run check, B–F, paid acceptance, hosted acceptance. The not-found, partial-answer and failed-answer copy is provisional and awaiting the Product Director. The PR stays draft. No hosted changes.
