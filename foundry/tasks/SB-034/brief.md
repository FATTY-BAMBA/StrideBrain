# SB-034 — Demo Value UX Pass

Status: final bounded refinement complete; see final-refinement-review.md, final-independent-review.md and pilot-usability-plan.md for the current local candidate. Earlier checkpoint documents retain their historical scope.

Repository: FATTY-BAMBA/StrideBrain. [Issue #34](https://github.com/FATTY-BAMBA/StrideBrain/issues/34). Branch: `build/sb-034-demo-value-ux`. Baseline: `19c98f799de43876e6eea83fd9d336518476fe0a`. Date: 19 November 2026, Asia/Taipei.

## Objective

A first-time interior designer or company owner should understand StrideBrain's usefulness within 30–60 seconds. Present things the person can accomplish through existing company/project information, comparison, evidence and internal review capabilities.

**Find. Understand. Decide. Act.**

**Backed by your company's knowledge and experience.**

Felt outcomes: “I can find this faster”; “I can see what needs attention”; “I can verify the source without digging”; “I know what to review next.” These are product objectives, not measured claims about saved time or business performance.

## Primary success criterion

After 60 seconds, without an explanation of the architecture, the participant can answer all five questions accurately:

1. What can StrideBrain do for me?
2. Where do I start?
3. How does it help with my current project?
4. How does it use company knowledge and past experience?
5. How does it help me decide and act?

Measure time to first understood useful outcome and record the five answers verbatim. Do not substitute clicks, attractive screens, presenter narration or correct architectural vocabulary for comprehension. This criterion is NOT MEASURED in Phase 1. Use 3–5 first-time interior-design participants when the controlled pilot is ready; report individual results and the denominator, not a general-market claim.

## Scope and order

The user explicitly reduced the pilot gate. Full Stage 9 certification does not precede this UX planning/design pass. Essential safety and core-journey blockers gate access by pilot participants; design work can proceed using current evidence while any remaining proof is completed separately.

Order: essential pilot blockers → Demo Value UX implementation → isolated preview → hosted rehearsal → 3–5 designers using synthetic data → prioritize from reactions. Phase 1 audit and storyboard review comes before any SB-034 product-source edits. Actual deployment is prohibited in this task and remains a later separately scoped activity.

Essential pilot conditions: no unresolved P0/P1 security/integrity issue or required-path P2; tenant/session isolation; usable bilingual core journey and iPhone path; correct financial/evidence claims; working action creation/idempotency; and, before participant access, a stable isolated hosted preview with rollback and hosted rehearsal. These requirements remain real; absence of newly observed defects is not proof they all passed.

Deferred wider-release work: full VoiceOver, unavailable-device Android certification, exhaustive accessibility polish, performance micro-optimization, every visual edge-case baseline and broad release-grade coverage. Deferral is not a PASS. Obvious unreadability, unreachable controls, serious responsiveness problems and misleading claims still matter in the pilot.

## Original audit evidence and constraints

The following describes the original audit phase. The later user-approved isolated authenticated review is recorded in `authenticated-ux-review.md`; it did not reopen or mutate Stage 9 state.

The audit uses the user's supplied physical-iPhone screenshots and read-only inspection of this exact baseline. It does not use old unrelated screenshots as new evidence. Local baseline production preview remains available for manual visual review, but its previous authenticated session was revoked. No replacement login or database write was authorized for this phase; no protected live-session retest is claimed.

SB-032 physical testing was stopped by the user with useful observations retained, one proposal and zero confirmed actions/receipts in that stopped run. Some native-input/language outcomes are user attestations rather than screenshots. Historical Stage 9 passes are preserved, not silently widened. See `ux-audit.md` for evidence limits.

## Original phase-1 deliverables and review gate (historical)

Nine documents: this brief, `state.json`, `ux-audit.md`, `information-architecture.md`, `copy-strategy.md`, `demo-storyboard.md`, `build-contract.md`, `test-plan.md`, `independent-ux-review.md`.

The first return is a reviewable proposal, not implemented UX or a release decision. Independent review is pending; the author cannot supply its own independent approval. Product code, schema, database state, permissions, evidence calculations, Vercel, DNS and deployment configuration remain unchanged. No publication or merge is included.
