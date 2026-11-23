# SB-062 build contract

- Check project:create and project:read before any model call. Honor paid-tier configuration, organization switch, timeout and shared daily cap. No retry.
- Send only redacted typed text, fixed extraction instructions and static existing choices. Exactly one submit_job_draft call, no read tools. No question-path instruction or behavior change.
- Require bounded schema and exact supporting substrings after NFKC/whitespace normalization. Text values equal their quote; choices must be canonical options. Invalid fields drop independently. Refuse forbidden/unknown top-level fields.
- Digits-only area, including full-width digits. Server converts 坪 by 400/121, half up at three decimals. m² remains m². No storage unit change.
- Match active authorized clients on either language name, NFKC/case-insensitive/trimmed, only when exactly one row matches. Never send client rows to the model.
- No draft persistence or source text in usage/logs. Reserve one shared AssistantUsage row for the call; record tokens, exact cost and outcome only.
- Reuse NewJobForm/createProjectAction, server-generated reference/idempotency, current permission, validation, audit and duplicate handling. Mark AI-filled fields until edited. Missing required fields remain required.
- New-job input limit 1,000; Home input limit 280. Hide draft controls when disabled/unconfigured/unauthorized. Failure leaves the ordinary form available.
- Paid gate: unchanged question gate plus 12 texts per language per round, all required cases, no unsupported kept values, at least 10/12 exact expected drafts per language in each of three rounds. At most three workflow dispatches, record all costs. Never dispatch Test site.

Product Director clarification: creation is unchanged. New jobs stay in QUOTE_REVIEW and appear under 報價 (Quote) on the Projects page; the issue’s 詢問 acceptance wording is superseded.
