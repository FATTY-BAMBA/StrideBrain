# SB-034 focused validation plan

Status: first-slice deterministic verification completed on Node 24.22.3: npm run check passed, 580 tests passed / 130 skipped, production build passed. Database integration and authenticated browser acceptance remain unexecuted; see implementation-review.md. The remaining plan below is not evidence of execution.

## Main value measure

Recruit 3–5 first-time interior designers/company owners when the pilot is ready. Give a neutral scenario: “You are preparing the next review of this current retail project. Use this product as you normally would.” Start timing at usable Home. Do not explain technology or teach the route. At 60 seconds ask the five brief questions; preserve exact responses, time to first useful outcome, first click, hesitations, attempted unsupported capabilities and any coaching. Report each participant's outcome. Do not declare success from a presenter recording or an author walkthrough.

The proposed acceptance target is all five answers substantially correct for every observed participant without architecture explanation. This is a small-sample product decision gate, not a general usability guarantee. If a participant fails, identify the responsible entry/copy/hierarchy problem and revise that surface rather than adding a broad unrelated checklist. Actual action-confirmation duration is reported separately; consent is never rushed to hit the comprehension target.

## Focused checks after changes

| ID | Check | Required evidence / expected behavior |
| --- | --- | --- |
| V01 | Entry and capability truthfulness | First viewport contains a clear working start. Every active card/prompt reaches its promised bounded flow; Planned is visibly distinct and never looks like a running agent/chat. |
| V02 | Authorization and tenant/session isolation | Reuse targeted existing coverage for allowed, unavailable/revoked, other-tenant and restricted personas. New entry surfaces reveal no unauthorized names, counts, financial data or sources. No automatic session issuance. |
| V03 | Projects and company history | List matches existing authorized results. Comparator summaries do not become unauthorized workspace links. No false recent/completed labels or fabricated activity. |
| V04 | Financial/evidence truth | Render identical typed values/authority/baselines from existing results; current selection changes are reflected. Preserve stale/conflict/insufficiency/role restriction. No “approved” label for Human reviewed data. |
| V05 | Canonical navigation | Home → workspace → explicit comparison → signal → exact evidence/source → return → review → receipt → Actions reopen. New links preserve actual run/economics/project/locale context. Invalid or missing context fails honestly. |
| V06 | Actions/idempotency | When authorized for execution, retain zero writes before explicit confirmation and existing duplicate prevention. Verify one action/audit/receipt for a confirmed command and same receipt on replay, not duplicates. |
| V07 | English and Taiwan Chinese | Primary copy and task labels are natural, availability/uncertainty equally clear, no internal English enums. New strings need human review; past M-07 attestation is not inherited approval. |
| V08 | Usable iPhone path | Main tasks, navigation, source/close and review controls reachable in portrait; readable reflow; native select/date remain usable. Recheck only changed surfaces and affected return paths. Broader Android/VoiceOver certification remains deferred. |
| V09 | Read-only entry and freshness | Opening Home/Knowledge/StrideBrain makes no comparison/proposal/action writes. Freshness blocks remain effective when using promoted links or saved results. |
| V10 | Perceived wait and core stability | Observe entry/comparison response/loading/errors during the representative flow. An obvious stall/broken path is a pilot blocker; micro-optimization and blanket latency sampling are not automatic gates for this copy/layout pass. |

Run relevant existing navigation/authorization/localization tests for changed contracts; add meaningful tests only for new behavior such as safe prompt destinations, role-gated summaries or read-only entry. Do not write tests that only restate static copy. Run normal required checks appropriate to the actual implementation diff. No repeat of the entire historical matrix without a changed-risk reason.

## Pilot boundary

Before participant access: essential security/integrity and required-path blockers resolved; tenant/session isolation working; main bilingual/iPhone flow usable; truthful claims; action/idempotency works; stable isolated hosted preview with rollback and hosted rehearsal. Hosting work is outside current authorization. Keep real customer data, external sending and autonomous work out of the pilot.

Full VoiceOver, Android certification without a device, exhaustive accessibility/visual baselines, performance micro-optimization and broad release coverage are deferred—not claimed as passed. Serious accessibility or stability failures in the core path still require a fix.

## Evidence discipline

Record exact head/build, persona, locale, state, screenshot/recording when supplied, observed behavior and any remaining limit. Separate screenshots, user attestations, source review and measured trials. Use synthetic data; no tokens or private credentials in repository evidence. Preserve previous task evidence. This plan itself is not execution evidence.
