# SB-081 — Assistant friendlier misses

Source: https://github.com/FATTY-BAMBA/StrideBrain/issues/81, read 27 November 2026. Repository owner: FATTY-BAMBA.
Base: 2443d9d2d50ce1bf8c1d36999ef670a4aec16c79.

**Ready for Codex, after #77.**

## Goal

When the assistant cannot give the answer a person expected, it says why in plain words and offers the next step. Four cases: a job named loosely, an answer too long to print in full, follow-up chips that lead nowhere, and a failed AI answer.

This issue does not change what any reader may read, which records a tool returns, or how a correct answer is laid out.

## Evidence

All from the hosted retest of PR #80 at `4cf4f23` on 27 November 2026 (75 turns, three roles).

- **A loosely named job is refused.** 「信義旗艦店的報價總額是多少？」 resolves to 信義旗艦店裝修, because those words are a continuous part of the name. 「信義店的報價總額是多少？」, 「河岸工作室的報價狀態如何？」 and "…the Xinyi flagship store fit-out" (the job is "Xinyi Flagship Renovation") get the general sentence 「我只能根據您可查看的公司紀錄回答；目前的紀錄沒有顯示這項資訊。」. The owner knows the job exists, and the sentence tells him the records are empty.
- **A long answer is cut without saying so.** Asked for a comparison's findings and four quote facts of another job, the answer printed twelve rows and only one of the four facts. The answer shape allows 14 parts (`answerParameters`, `maxItems: 14` in `fact-answers.ts`), so the model stops before the server's 「另有 N 項。」 can apply. Asked 「這個專案目前在哪個階段？客戶是誰？」, the answer gave the stage and nothing about the client. Client identities are never sent to the model, which is right, but the answer did not say a part was missing.
- **Chips lead nowhere.** 「PRJ-ACTIVE-001 的報價內容有哪些？」 uses the reference where the card above it uses the name. 「這個專案的負責人或聯絡人是誰？」 was offered to a Viewer; contact details are never available to the assistant, so it is refused one tap later.
- **A failed answer shows an old message.** One turn in 75 ended `FALLBACK_INVALID_OUTPUT`. The reader saw 「此回答目前無法使用 AI，改以紀錄搜尋。這個版本目前還不能可靠回答這個問題。你可以問：做過哪些類似專案、報價哪裡值得留意、材料差異、佐證來源，或未完成事項。」, which comes from the keyword search in `home-chat-actions.ts`. That list describes the product as it was before the assistant.

## Scope

1. **A named job that is not found gets its own sentence.** Wherever a turn ends because a job named in the question did not resolve for this reader (the `list_jobs` zero-match refusal and the unreadable-job guard), the reader sees 「找不到這個名稱的專案。」 / "No job by that name was found." It is the same sentence whether the job does not exist or the reader may not read it.
2. **Under that sentence, up to three of the reader's own jobs with the nearest names, as chips.** The server ranks the jobs this reader may read by how much of the searched text their names share. The searched text is what the model passed to `list_jobs`, or the identity the guard matched. The server never picks a job itself, even when there is one candidate. If no job is near, there are no chips.
3. **Tapping a chip answers the original question for that job, with no retyping.** The turn that follows carries the confirmed job as context, and the model uses it in place of the name that did not resolve. The server verifies the confirmed job with the same rule as any job read. A confirmed job takes precedence over the page's job.
4. **The model may select more than the answer prints.** Raise the part limit of the answer shape so a long selection reaches the server. The server's existing rule then prints twelve rows and 「另有 N 項。」 beside the card's link.
5. **A phrase for "part of this is not in the records".** Add a second id to the phrase catalog. When the model can show some of what was asked and not the rest, it adds that id, and the server prints the catalog's sentence as a notice under the cards: 「您問的部分內容不在可查看的紀錄中。」 / "Part of what you asked is not in the records you may read." The model still writes no words.
6. **Chips use names.** When a chip's text contains the reference of a job the reader may read, and not its name, the server replaces the reference with the name in the reader's language, by exact identity.
7. **Chips are not offered for what is never available.** Extend `maySuggestFollowUp`: a chip about a person's contact details, a client's identity or a site address is dropped for every reader.
8. **A failed AI answer shows one sentence and a retry.** When AI is on and a turn ends in any `FALLBACK_` outcome, the reader sees 「AI 這次沒有答出來，請再問一次。」 / "The AI could not answer this time. Please ask again." with a 「再問一次」 chip that sends the same question again. The keyword search does not run for that turn. With AI switched off in 設定, the record search stays exactly as it is.
9. **Evaluation.** Required cases in both languages, in several wordings each:
   - a loosely named job gives the not-found sentence and the right chips;
   - a name with no near job gives the sentence and no chips;
   - a job the reader may not read gives the same sentence, and no chip ever names it;
   - a confirmed chip answers the original question for the confirmed job;
   - a long selection prints twelve rows and the count of the rest;
   - a two-part question with one unavailable part shows the cards and the notice;
   - a fully answered question never shows the notice.

## Defaults chosen in this issue

- **The copy in items 1, 5 and 8 is provisional.** The Product Director may change any of it.
- **Up to three chips, never an automatic choice.** Jobs with look-alike names (進行中設計專案01 and 02) are the reason: the person taps, the server never guesses.
- **Nearest names.** The method is yours. It must work for Chinese and English names, be deterministic and tested, and have a floor so unrelated jobs are not offered.
- **Part limit 40.** Printed rows stay at twelve.
- **The rule from PR #80 stands.** The server does not decide what a question means from word lists. The model reads the language; the server checks structure and exact identities. Removing a chip is the one thing a word list may do, which is why item 7 is allowed.
- **Pass rules as confirmed on PR #80** (comment 7188877802): absolute for a wrong value, a disclosure, an answer about a job the reader may not read and a discarded answer; by rate for what the model chooses.
- **Paid evaluation up to US$1.00:** focused runs first, then one full run. More needs the Product Director's direct authorization.
- **No slower, no dearer.** The median stays at 2 model calls per question. The 90th-percentile time and the cost per question stay within 25% of the #79 baseline. A confirmed-chip turn is a new question and is counted as one.
- **Design system.** The notice and the chip rows use the existing tokens and components. Polish of the cards themselves belongs to #77.

## Security gates

- The not-found sentence and its chips are identical for a job that does not exist and a job the reader may not read. Chips are drawn only from jobs this reader may read.
- The name or reference of a job the reader may not read is never returned to the browser, sent to the model or written to a log.
- The confirmed job from a chip is an identifier the server verifies with the same read rule as any job. A forged, stale or excluded identifier gets the not-found sentence or the existing excluded-job sentence, never a record.
- The searched text and the re-sent question are untrusted: length-limited, never logged, never used as a key or a path.
- The model's output still holds no text that reaches the person in an answer: phrase ids and references only. Chip text stays length-limited and is the only model-written text shown.
- The reference-to-name replacement in chips uses exact identities of jobs this reader may read, and nothing else.
- No tool returns a new field. No reader sees a record they could not see before. The existing role, cross-organization, excluded-job and redaction tests are unchanged and pass.
- Only sample data goes to the model until #42 is done.

## Acceptance

Checked by the reviewer on the test site, in three roles, after the paid evaluation passes.

- As owner, 「信義店的報價總額是多少？」 shows 「找不到這個名稱的專案。」 and a chip 信義旗艦店裝修. Tapping it shows 含稅總計 NT$17,304,000 under that job's title.
- 「河岸工作室的報價狀態如何？」 offers 河岸展示工作室, and the tap answers with its status.
- 「月光咖啡館的報價總計是多少？」 shows the sentence and no chips.
- As 林美玲 in 信義旗艦店裝修's bar, 「進行中設計專案01的報價總計是多少？」 shows the same sentence. No chip names 進行中設計專案01 or any other job she may not read.
- A question asking for more than twelve rows prints twelve and 「另有 N 項。」.
- 「這個專案目前在哪個階段？客戶是誰？」 shows the stage card and the notice. 「這個專案目前在哪個階段？」 shows the card and no notice.
- No chip shows a job reference where the name is known. No chip asks about contact details.
- A test forces a failed turn and shows the one sentence and the 「再問一次」 chip. With AI off in 設定, the record search behaves as before.
- Everything accepted in #79 still passes: the values, the three roles, the cards, English, 390 px.
- The paid evaluation passes under the confirmed rules, and its report shows calls, time and cost against the baseline.

## Out of scope

- Any matching that resolves a job without the person's tap.
- Retiring or restyling the record search used when AI is off.
- The look of the cards, the findings card's repeated label and the timing table in 設定. Those belong to #77.
- Keeping a thread across page loads.

## Delivery sequence

- **A.** The not-found sentence (item 1). Server only; prove by replaying the recorded answers.
- **B.** Nearest-job chips and the confirmed-job turn (items 2 and 3).
- **C.** Long selections and the partial phrase (items 4 and 5).
- **D.** Chips (items 6 and 7).
- **E.** The failed answer (item 8).
- **F.** The evaluation suites, focused paid runs, then one full run.


---
_Generated by [Claude Code](https://claude.ai/code)_
