# Round 3 screenshots

Local Chromium, disposable synthetic data, en/zh-TW, 1440px/390px. The app code is the round-3 revision; injected 1,800ms server-response delays demonstrate modal feedback. Selection close-ups use the final local production build. These are not hosted acceptance.

## Focused after views

| Area | zh-TW desktop | zh-TW mobile | English desktop | English mobile |
| --- | --- | --- | --- | --- |
| Closed lessons | [1440](evidence/round3/owner-zh-TW-closed-lessons-1440.png) | [390](evidence/round3/owner-zh-TW-closed-lessons-390.png) | [1440](evidence/round3/owner-en-closed-lessons-1440.png) | [390](evidence/round3/owner-en-closed-lessons-390.png) |
| Selection | [1440](evidence/round3/owner-zh-TW-selection-1440.png) | [390](evidence/round3/owner-zh-TW-selection-390.png) | [1440](evidence/round3/owner-en-selection-1440.png) | [390](evidence/round3/owner-en-selection-390.png) |
| Quote panel | [1440](evidence/round3/owner-zh-TW-quote-panel-1440.png) | [390](evidence/round3/owner-zh-TW-quote-panel-390.png) | [1440](evidence/round3/owner-en-quote-panel-1440.png) | [390](evidence/round3/owner-en-quote-panel-390.png) |
| Closed quote | [1440](evidence/round3/owner-zh-TW-closed-quote-1440.png) | [390](evidence/round3/owner-zh-TW-closed-quote-390.png) | [1440](evidence/round3/owner-en-closed-quote-1440.png) | [390](evidence/round3/owner-en-closed-quote-390.png) |
| Evidence loading | [1440](evidence/round3/owner-zh-TW-evidence-busy-1440.png) | [390](evidence/round3/owner-zh-TW-evidence-busy-390.png) | [1440](evidence/round3/owner-en-evidence-busy-1440.png) | [390](evidence/round3/owner-en-evidence-busy-390.png) |
| Evidence dialog | [1440](evidence/round3/owner-zh-TW-evidence-modal-1440.png) | [390](evidence/round3/owner-zh-TW-evidence-modal-390.png) | [1440](evidence/round3/owner-en-evidence-modal-1440.png) | [390](evidence/round3/owner-en-evidence-modal-390.png) |
| Review loading | [1440](evidence/round3/owner-zh-TW-review-busy-1440.png) | [390](evidence/round3/owner-zh-TW-review-busy-390.png) | [1440](evidence/round3/owner-en-review-busy-1440.png) | [390](evidence/round3/owner-en-review-busy-390.png) |
| Review dialog | [1440](evidence/round3/owner-zh-TW-review-modal-1440.png) | [390](evidence/round3/owner-zh-TW-review-modal-390.png) | [1440](evidence/round3/owner-en-review-modal-1440.png) | [390](evidence/round3/owner-en-review-modal-390.png) |
| Actions loading | [1440](evidence/round3/owner-zh-TW-action-busy-1440.png) | [390](evidence/round3/owner-zh-TW-action-busy-390.png) | [1440](evidence/round3/owner-en-action-busy-1440.png) | [390](evidence/round3/owner-en-action-busy-390.png) |
| Action receipt | [1440](evidence/round3/owner-zh-TW-action-modal-1440.png) | [390](evidence/round3/owner-zh-TW-action-modal-390.png) | [1440](evidence/round3/owner-en-action-modal-1440.png) | [390](evidence/round3/owner-en-action-modal-390.png) |
| Unreadable job quote | [1440](evidence/round3/viewer-zh-TW-quote-not-found-1440.png) | [390](evidence/round3/viewer-zh-TW-quote-not-found-390.png) | [1440](evidence/round3/viewer-en-quote-not-found-1440.png) | [390](evidence/round3/viewer-en-quote-not-found-390.png) |
| Unauthorized new job | [1440](evidence/round3/viewer-zh-TW-new-not-found-1440.png) | [390](evidence/round3/viewer-zh-TW-new-not-found-390.png) | [1440](evidence/round3/viewer-en-new-not-found-1440.png) | [390](evidence/round3/viewer-en-new-not-found-390.png) |

## Before

The [round-2 screenshots](screenshots-round2.md) are the `34686fa` baseline, including Home, comparison and quote panel before these changes. The review's hosted findings remain the source for its latency observations; this run adds local delayed-response measurements, not a hosted before/after claim.

## Measurement records

- [Focused checks](evidence/round3/checks.json)
- [Receipt checks](evidence/round3/actions-checks.json)
- [Full owner/Viewer layout sweep](evidence/round3-sweep/checks.json)

Fill form's secondary style is verified by rendering the real component in both-language unit tests with drafting enabled. The local running app has AI off, so no screenshot claims that a model-backed draft was run.
