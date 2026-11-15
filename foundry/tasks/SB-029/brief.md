# SB-029 — Governed internal review action and audit receipt

Status: SPECIFYING. Research is complete; the architecture/build contract is under development. This is the task brief, not implementation or release acceptance.

## Authoritative inputs

- [Issue #29](https://github.com/FATTY-BAMBA/StrideBrain/issues/29), fully retrieved with zero comments; snapshot in `issue-29.json`.
- `origin/main` fetched and verified at `0ecd65bdb0ae752f3244960d6848a74a30d5da01`; the supplied baseline matches current main. Initial working tree was clean.
- Default branch confirmed as `main` through GitHub repository metadata.
- All six named governing documents in Issue #29 have been read, along with Stage 3–7 implementation records and the Foundry operating/build authorization documents. Specialists inspect accepted ADRs, design, architecture and tests as applicable.

## Outcome and limits

Allow an authorized user to prepare, review, explicitly confirm and reopen one deterministic internal review action from authorized immutable Stage 4/5 results, with current evidence/access validation, durable idempotency, atomic persistence, reconstructable audit, bilingual review/receipt and Project Workspace integration.

Policy: `INTERNAL-REVIEW-ACTION-1.0`. No other business write, external communications, financial approval/mutation, AI model, real customer data, Vercel/DNS/live domain change, or unrelated stage work is authorized.

## Operating roles

- Orchestrator: state, contract acceptance, evidence synthesis and release recommendation.
- Research Agent: source-grounded research; no product changes or final policy decisions.
- Product and Technical Architect: reviewable architecture and build contract before implementation.
- Builder: dedicated branch, bounded implementation, commits/push and draft PR; no self-approval or merge.
- Test and Evaluation Agent: independent commands and results, complete regression and adversarial checks.
- Computer QA Coordinator: independent plan and actual browser evidence only when implementation is ready.
- Independent Reviewer: independent contract and implementation/security review; separate from Builder.

## Gates

Follow every state transition in `state.json`. Review the contract before product implementation. Validate deterministic gates on the exact implementation tree and obtain exact-head CI evidence. Prepare an isolated synthetic preview, record PREVIEW_READY and either hand off to the human or use actual independent browser tooling if available. Browser outcomes remain NOT_RUN until evidenced. Final independent review follows browser QA. Human approval is mandatory before any merge or release.

Automatic repair is limited to three cycles with root cause, bounded fix, targeted checks, full regression and updated evidence. Genuine conflicting authoritative requirements, security-policy changes, destructive migrations or other user-defined escalation conditions stop work.
