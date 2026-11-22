# SB-039 verification

Hosted acceptance: **WAITING FOR THE PRODUCT DIRECTOR**. Keep the one pull request in draft. The Product Director puts it on the test site through [TEST_SITE.md](../../../docs/development/TEST_SITE.md), configures the paid provider and clicks through acceptance. No hosted deployment, migration, seed, settings or secret change was performed by the agent.

## Delivered, in A → B → C order

- **A:** Provider-neutral model port, deterministic test fake, seven read tools around existing authorized use cases, bounded structured answers, numeric/citation grounding, and fallback to the existing keyword chat. The no-key path remains the existing implementation. Tools neither write business records nor run comparisons. Saved findings reuse Home's permission and source fingerprints; past-price rates use the same fixed-decimal calculation as the Quote tab. English questions can resolve Chinese job names without widening access.
- **B:** Server-only Gemini REST adapter, paid-only configuration, redaction, timeout/output/tool caps, atomic organization/day call reservations and metadata-only usage. Organization and job controls are authorized, idempotent and audited in one transaction. One new forward migration; earlier migrations are unchanged. Forty evaluation cases and the manually dispatched **AI evaluation** workflow are included. CI uses only the fake. Failed/truncated replies retain known token usage; missing usage is shown as an incomplete cost estimate.
- **C:** AI labels, server-owned source links, follow-up buttons, Settings preference/provider/model/monthly calls and estimated cost, job exclusion, bilingual AI data page, and honest planned Knowledge/Customer care pages.

The new synthetic fixture enables the sample organization's switch. New organizations default off. It also fills empty commercial categories on older synthetic jobs from their scope mapping; those older rows otherwise had no Quote-tab history lines. This is fixture repair, with no tenant-specific feature branch. The single data-mode gate stays in `src/lib/env/server-env.ts`.

## Model and price

The Product Director chose **`gemini-3.5-flash-lite`** for this new integration. Google's 2.5 Flash-Lite page restricts it to previous users and directs new projects to 3.5 Flash-Lite. Sources checked on 2026-11-22: [2.5 availability](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite), [3.5 model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [pricing](https://aistudio.google.com/docs/pricing).

Configured standard text rates: **US$0.30 input / US$2.50 output per million tokens**, with thinking tokens counted as output. Cost is fixed-decimal, estimated, and excludes taxes and other provider billing adjustments. A changed model requires explicit rates. Request shape follows Google's [generateContent reference](https://aistudio.google.com/api-reference/generate-content/generate-content): function declarations, `parametersJsonSchema`, `ANY` tool selection and a `submit_answer` function. The adapter keeps the key in a server request header, bounds the response body and never propagates provider error bodies.

**Terms wording is still to do:** the Product Director must approve the product wording against the paid [Gemini API terms](https://ai.google.dev/gemini-api/terms), including abuse-monitoring retention, and confirm paid billing. The two explicit enable/paid-confirmation flags default off. Agents did not configure a hosted key or confirm billing on the Director's behalf.

## Automated verification

- **`npm run check`: PASS — 1,166 tests across 119 files**, with no skipped tests, on Node 24.22.3 and isolated loopback PostgreSQL. Formatting, lint, type checking and production build pass. [Final check log](evidence/check.log). The existing `prisma.config.ts` anonymous-default-export lint warning remains.
- `db:validate`, normal Prisma migration deploy, complete fixture verification and a repeated seed/verify pass succeed on a fresh disposable local database. [Schema/fixture log](evidence/schema-fixture.log). [Client bundle inspection](evidence/client-boundary.json) finds no provider key variable, request header, endpoint implementation or synthetic transport key in browser assets.
- PostgreSQL tests cover default-off organizations, sample opt-in, assigned manager/finance access, Viewer amount denial, other-organization denial, idempotent audited controls, job and historical-source exclusions, concurrent daily-cap reservations and exact cost aggregation.
- Freshness and parity tests cover another member's saved comparison, changed active records, and count/median/range equality with `PrepareQuoteDraft`. Existing Home quote-version freshness tests also pass. No ranking or economics replay was added to Home.
- Unit and boundary tests cover redaction, IDs not grounding amounts, quoted prices not becoming actual costs, shared finding sentences, unknown source IDs, unsupported numbers, HTML/links, invalid schema, bounded turns/tools/output, provider failure, timeout, access changes, no-key and disabled fallbacks, and usage retained on truncation.
- The deterministic fake exercises all **20 English + 20 zh-TW** evaluation cases against authorized synthetic database records. This validates the harness and application rules; it is **not a live model quality score**. The injection case cannot reveal the foreign job through tools, but real-model resistance still awaits the paid evaluation.

## Provider evaluation — not run

`npm run ai:eval` was invoked without a configured paid key/confirmation and exited **2**, producing an explicit [per-question NOT_RUN report](evidence/provider-evaluation.json) and [console report](evidence/provider-evaluation.log). All 40 cases have null latency, tokens and cost; no paid-provider pass score is claimed. The required **16/20 per language and no wrong number** threshold remains unverified.

The Product Director can set repository secret `STRIDEBRAIN_GEMINI_API_KEY` and variable `STRIDEBRAIN_AI_PAID_TIER_CONFIRMED=true`, then manually run **AI evaluation** on this branch. It creates a disposable synthetic database in the workflow's PostgreSQL service and uploads a per-question report. It does not use the hosted test-site database. For a local paid evaluation, use `.env.example` configuration and a loopback `DATABASE_URL`, then run `npm run ai:eval`. The runner fails and recommends evaluating the next model tier when the pass mark is missed; prompts are not tuned to individual cases.

## Local browser evidence

Chrome, local production build, loopback HTTPS, disposable synthetic database. [No-key report](evidence/browser-no-key.json) and [transport-fake report](evidence/browser-fake.json).

- No key: the keyword response has no AI label and creates no usage row. Both languages open Settings, the AI data policy, Knowledge and Customer care. Planned pages have no live-looking controls or redirects. [Settings en](evidence/settings-en-no-key.png), [Settings zh-TW](evidence/settings-zh-no-key.png), [Knowledge](evidence/knowledge-zh-TW.png), [Customer care](evidence/customer-care-en.png), [AI data](evidence/ai-data-zh-TW.png).
- With a **test-only fake of Google's HTTP transport outside the application**, the real adapter, server action, authorized database tools, grounding, rendering and metering run together. The fake never contacts Google. AI answer/source/data links and follow-up refusal render in both languages, including a 390px viewport. [English answer](evidence/ai-answer-en-transport-fake.png), [zh-TW answer](evidence/ai-answer-zh-transport-fake.png), [mobile](evidence/ai-answer-zh-mobile-transport-fake.png).
- The job exclusion control saves to PostgreSQL and the next question gets the fixed exclusion response. Switching the organization off uses keyword chat with no additional usage row. Unsupported numeric output is discarded and logs `FALLBACK_UNGROUNDED`. The Viewer receives a refusal with no amount. Every model-call usage row is finalized. [Job control](evidence/job-exclusion-en.png), [excluded answer](evidence/excluded-answer-en-transport-fake.png), [metered Settings](evidence/settings-en-metered-transport-fake.png).
- Screenshot review found the planned badge squeezing sidebar labels; column sizing and mobile spacing were corrected. Follow-up buttons have a readable border and 44px minimum height. Final screenshots were refreshed after the correction.

The local server, disposable database, sessions, invitation and TLS private files were [removed after verification](evidence/local-cleanup.log).

## Not verified

- Hosted test-site acceptance, hosted migration/fixture application and hosted controls: waiting for the Product Director; pull request stays draft.
- Live Gemini availability, request compatibility, answer quality, latency, billed cost, prompt-injection behavior and the 16/20 language thresholds. The fake is not evidence of those.
- Paid account configuration and legal/terms wording approval.
- Real tenant data (still gated by #42), physical phones and browsers other than local Chrome. Mobile screenshots use a simulated 390px viewport.
