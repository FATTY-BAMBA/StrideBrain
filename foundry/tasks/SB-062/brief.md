# SB-062 — A new-job draft from text

Issue: https://github.com/FATTY-BAMBA/StrideBrain/issues/62
Base: main at 1fe84af7ad08827ce9486c78666812cb360d9bde (PR #61 merged).

A person explicitly chooses Fill the form or Create a job. One forced Gemini function call returns only reviewable existing form fields with verbatim supporting text. The server drops unsupported fields, converts 坪, and matches active clients. The existing NewJobForm and createProjectAction remain the only creation path. Drafts live only in page state.

Delivery: A domain and fake-model use case; B forced Gemini function and usage; C shared form on new-job and Home; D 12 bilingual draft cases over three paid rounds alongside the unchanged question suite.

No hosted changes. One draft PR. Hosted acceptance waits for the Product Director.
