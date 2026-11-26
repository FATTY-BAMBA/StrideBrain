# SB-079 build contract

Delivery follows the issue's explicit A–E order.

A. Build a turn-local registry of server-rendered facts, including labelled amounts, identifiers, lists and exact saved findings. Accept only ordered say/show parts and derive citations from registered references. No model prose: accept one catalog phrase id, at most 12 registered facts and one list (ten rows plus a server-computed rest count). Render every fact under its own source heading. Reject unknown ids/references; preserve access rechecks, subject matching, redaction and limits. Prove with the fake model first.

B. Map each tool to its page read and test owner, assigned/unassigned manager, finance and Viewer parity, resolving discrepancies on the stricter side. Give readers without quote:read a stage example.

C. Add get_item_prices through ReadPriceList, at most five results, optional unit/job, with newest and differing client-specific prices. No client identity/contact fields in model data.

D. Add nullable provider HTTP status and failure code columns in a forward-only migration. Record codes only and show seven-day failure counts with bilingual explanations in Settings.

E. Adapt fake/paid suites, preserve existing gates and add the issue's required cases and zero-wrong-value gate. Save every raw answer from the first run. Compare median calls, p90 latency and per-question cost against the stated baseline (2 calls; 2.0 seconds p90; US$0.198 / 162 questions), with the latter two limited to 125%. At most four paid dispatches; report all attempts and costs.

No model/provider change, streaming, session memory, job-draft change, knowledge-document work, write tool or second answer attempt. Use current modular boundaries and design system. Run npm run check and CI; report what was and was not verified. Keep draft for Product Director test-site acceptance; agents perform no hosted deployment, migration, seed or settings change.


Review 7180179624 (owner-authored, 26 November): comparison failures remain tool results so item and closed-job reads can continue; only a completed comparison question gets its own job's notice. Every job source uses name · reference; item headings include unit. The shared chat renderer preserves record gaps and emphasizes headings. Quote labels come from the Quote document, lists suppress repeated row facts, and selected item prices include recorded dates/count/document numbers. Closed-job overall differences are exact Home sentences. Replay recorded answers free, add four required job-bar cases and two reported overall-difference cases, run the full check/CI, then use the fourth and last paid dispatch. Keep draft and report on PR #80.

Hosted review additions (same fix round, owner comments 7180301103 / 7180437328): unresolved explicit job selectors get the same non-disclosing refusal for absent and unreadable records, before page-default reads. No quote-access capability means no financial follow-up chips. List summaries name the list. A separate tenant-scoped AssistantTurnTiming record measures action entry to response completion, including early refusals and AI-off questions; it does not count as a model call. Settings shows seven-day counts/latest/maximum and the latest twenty recorded timings. This requires one new forward-only migration; existing migrations stay unchanged.

Evaluation now retains forty core questions and adds thirty required cases plus two reported overall-difference cases (72 per round). The four new unresolved-subject cases run as project manager/owner in both languages with another job as page context. Any page-job fact shown for their unresolved named subject fails the wrong-record-value gate, independently of score. Model, per-language threshold, cost/latency/call gates and job-draft tests are unchanged. Dispatch four is the last authorized paid run.

## Fix round 2 — governing Product Director decision

Owner comments 7181003350, 7181049379 and 7181219556 supersede the earlier text-only layout and pre-model unresolved-name check above. New answers carry a server-built presentation: one labeled card per record, name first/reference quiet, label/value description lists, price provenance together, short page-specific list rows, one page-language source link, no displayed lead-in. Empty lists remain plain notices. Old stored answers retain their existing text renderer. Closed-job quote before tax, reconciled actual cost and overall difference form one reading whichever is selected. Both chat surfaces use this view; design tokens and 390px wrapping are required.

The model copies explicit current-question job names/references into namedJobs. The server checks that each occurs verbatim and uniquely equals an authorized identity, then checks that its facts are shown. No word patterns interpret the question. Comparison notices depend on the requested reads and subject, not question keywords. The renamed get_comparison_category_price_ranges and get_price_list_item_last_prices distinguish their data sources; unavailable comparisons explain the limitation and let the bounded loop continue, including after a cached unavailable read.

The suite now has 84 cases per round: the original 40 core, 42 required, and two reported. Twelve additional required cases cover multiple item-price and unresolved-job wordings. Every unresolved-subject case must reach the model; an early word-check refusal cannot pass. Existing question values/oracles (apart from renamed tool identifiers), per-language threshold, cost/latency/call gates, model and job-draft suite stay unchanged. Free replay covers all four recorded runs, with unchanged raw selections. The Product Director directly authorized up to two further paid dispatches (six total); dispatch five is pending full check and CI. No hosted changes; PR stays draft for Product Director acceptance.

After run 5, copied subject text is called jobMentions and initial subject names contain only literal current-question mentions; page context is explicitly pageContextReference. The server occurrence rule remains strict. Optional item-unit filtering copies a stored result unit. The evaluator treats identical global item identity/value symmetrically with or without job context, while retaining client-specific provenance. Failed run 5 is preserved; one final authorized dispatch remains.


## Fix round 3 — governing confirmed rules

Owner review 7188877802 supersedes copied job declarations: remove jobMentions and declaredSubjects entirely. Server-only exact identity checks refuse an answer naming any unreadable job in the same firm at the answer boundary; no question word patterns or replacement model declaration. Whole-reference list search, whitespace-normalized fact-map lookup and preferred-unit item reads fix the remaining cases. All accepted round-2 presentation and tool continuation behavior stays.

The Product Director confirmed: absolute zero wrong values/access violations/discards; each required case at least 2/3 and at least 97% of required answers; core 16/20 per language per round unchanged; median calls at most 2 overall and for named refusals, at least 95% within three calls; existing latency/cost limits and hard tool/call caps unchanged. All required questions and oracle values stay. Add explicit focused-case workflow input, marked not acceptance and skipping drafts, with a per-dispatch cost ceiling. Free recorded replay first, then focused paid validation, then at most one full run. Total further paid allowance is US$1.00; report every dispatch and stop after this round. No hosted changes; PR remains draft for Product Director testing.
