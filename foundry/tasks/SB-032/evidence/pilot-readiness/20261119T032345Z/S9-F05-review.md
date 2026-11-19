# S9-F05 — P2 midnight date-range mismatch

M-05 FAIL. Reproduced in English and zh-TW on the unchanged candidate. The server correctly rejects yesterday after Taipei midnight, but the open form keeps the previous min/max and instructs the user to enter a date within that old range. A read of the same proposal returns the correct new range. This is presentation/recovery disagreement, not acceptance of an invalid date or an authorization failure.

See findings.json for instants, exact ranges, persona, viewport, reproduction and acceptance criteria. Both rejection paths preserve the draft and produce zero Action/evidence/Audit/consumption/receipt writes. All sessions were still valid during observations and revoked only after capture.

Source inspection: proposal DTO bounds are derived at internal-review-service.ts:123; confirmation validates current time at lines496–499 but returns fieldErrors without refreshed bounds. internal-review-sheet.tsx:178–181 sets errors; lines366–379 keep reading the original proposal bounds.

Scoped repair candidate: carry or fetch the authoritative current bounds on due-date failure and update only the displayed range while preserving full draft/error/focus behavior. Test both locales, before/after Taipei midnight, leap day, minimum/maximum, unchanged zero-write rejections, Escape/cancel focus, and valid retry. No timezone policy, threshold, action authorization, financial authority or schema change is warranted.

Classification is the primary evaluator's evidence-backed P2 finding; independent repair/contract review is still outstanding. Product source has not been edited. Security and performance remain locked by the user's A/B/C condition.
