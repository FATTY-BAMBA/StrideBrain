# SB-079 verification

Implementation and verification are in progress. Issue #79 and its owner-authored comment were re-read from GitHub, including the 26 November update. PR #78 was verified merged before starting from main.

No local check, CI, paid evaluation or hosted acceptance is claimed yet. Hosted acceptance waits for the Product Director.


## Clarification before delivery A

The stated goal prevents wrong statuses and dates by taking fact wording away from the model. However, a free `say` such as "This job is in construction." or 「此專案正在施工。」 contains no digit, number word, currency sign, reference, URL, HTML or claim that the assistant performed an action. It satisfies the listed lexical rules while still being able to assert a wrong job stage. Replacing that gap with more status/paraphrase matching would require an additional policy not stated in the issue.

Proposed decision for the Product Director/reviewer: let `say` select from server-supplied bilingual non-factual connective phrases (for example "Here is the recorded information:" / 「以下是已記錄的資訊：」), with all factual content rendered through `show`. Exact membership can be enforced without interpreting model prose. Await the owner-authored answer on PR #80 before implementing this boundary.

Only the task documents have changed. No application code, migrations, tests, paid evaluations or hosted operations have been run or changed for this task. Implementation is not ready for review or hosted acceptance.
