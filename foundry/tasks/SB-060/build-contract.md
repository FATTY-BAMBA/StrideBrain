# SB-060 build contract

## Amount labels

A clause switches to labels after amounts only when its first cited amount has no preceding label and has a following label before the next amount. Every amount in that clause then takes its following label. Other clauses retain the existing reading. Unsupported values and all listed security mislabels still reject; values are never rewritten.

## Finding items

Carry an exact sent category label (case-insensitive) through the clauses of a list item or semicolon/full-stop segment. Natural Chinese attachment to the exact label is recognized without category aliases. Reset context at item/segment boundaries. Require exactly one cited saved finding for category, typed kind and percentage; percentage-only fallback still requires uniqueness when no category is stated. Replace the whole item/segment with complete saved sentences; saved text supplies the direction and wording. None or multiple matches reject.

## Acceptance state

Project unaccepted quote facts under Acceptance / 接受狀態 with not accepted yet / 尚未接受. Accepted dates retain Accepted on and the recorded date. Keep canonical server facts, values and the evaluation oracle unchanged.

## Verification and delivery

Replay both discarded answers from paid run 45128767042 plus the three earlier zh-TW finding drafts. Test negative labels, category/kind mismatches, unsupported and ambiguous percentages, boundary resets and bilingual acceptance/date projection. Run npm run check with disposable local PostgreSQL; capture local browser evidence. Run the unchanged three-round paid evaluation (at most three dispatches), recording every run and cost, and require zh-TW-finding to pass at least two rounds in addition to the existing gates. Keep one PR draft; hosted acceptance waits for the Product Director. No Test site workflow, hosted settings/data changes or migration edits.
