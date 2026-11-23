# SB-060 build contract

## Amount labels

Each amount takes the last label before it that no earlier amount took. Only when none exists may it take the first following label, and only if that label is no farther from this amount than from the next number. Taken following labels cannot be reused. Missing or wrong labels reject; values are never rewritten. The review replaces the earlier clause-wide mode.

## Finding items

Carry an exact sent category label (case-insensitive) through every sentence of a numbered or bullet list item. Keep each list item as one segment. Outside lists, split at semicolons and sentence ends and reset category context there. Natural Chinese attachment to the exact label is recognized without category aliases. Require exactly one cited saved finding for category, typed kind and percentage; percentage-only fallback still requires uniqueness when no category is stated. Replace the whole item/segment with complete saved sentences; saved text supplies the direction and wording. None or multiple matches reject.

## Acceptance state

Project unaccepted quote facts under Acceptance / 接受狀態 with not accepted yet / 尚未接受. Accepted dates retain Accepted on and the recorded date. Keep canonical server facts, values and the evaluation oracle unchanged.

## Verification and delivery

Replay both discarded answers from paid run 45128767042 plus the three earlier zh-TW finding drafts. Test negative labels, category/kind mismatches, unsupported and ambiguous percentages, boundary resets and bilingual acceptance/date projection. Run npm run check with disposable local PostgreSQL; capture local browser evidence. Run the unchanged three-round paid evaluation (at most three dispatches), recording every run and cost, and require zh-TW-finding to pass at least two rounds in addition to the existing gates. Keep one PR draft; hosted acceptance waits for the Product Director. No Test site workflow, hosted settings/data changes or migration edits.
