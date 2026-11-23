# SB-039 — Answers from authorized records

Source: https://github.com/FATTY-BAMBA/StrideBrain/issues/39 (read 2026-11-22).

Add an optional paid Gemini assistant around existing read use cases. Keep the keyword path when unavailable. No business writes, new comparisons, conversation storage, or model-calculated commercial values. One draft PR on `build/sb-039-records-assistant`.

Deliver A (port, fake, tools, grounding/fallback), then B (adapter, controls, logs, evaluation), then C (bilingual experience and evidence). Add migrations only. Hosted acceptance waits for the Product Director; agents perform no hosted operations.

Review follow-up: apply the six requested repairs on PR #56, still draft. Split only the manual evaluation workflow into PR #57 as explicitly requested. The first paid evaluation ran in workflow run 45049171548: 13/20 English and 12/20 zh-TW. Preserve that report, repair the harness/checks without prompt or workflow changes, and keep #56 draft pending another Director-run paid evaluation and hosted acceptance. Deterministic fake results do not establish model quality.

Stability review: replay both c569394 paid reports, separate follow-up validation, send display-ready labels, expand unambiguous percentages into exact saved sentences, accept any saved finding in the finding evaluator, and require three independently passing rounds of the 40-question workflow. No prompt or hosted changes.


Hosted review at 70ae4a0: fix server-owned subject resolution, Quote-tab parity in every status, empty-list grounding and repeat-tool prevention, and remove all post-refusal keyword handling. Keep interface locale in links, use a source-free refusal label, constrain follow-ups to read questions, reject truncated references and ignore category-label letter case. Preserve all 40 core evaluation questions and add eight required bilingual hosted-regression cases with an unrelated Home-style default project. Keep #56 draft; no hosted changes.
