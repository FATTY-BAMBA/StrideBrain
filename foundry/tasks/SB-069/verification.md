# SB-069 verification

## Delivery

[Draft PR #70](https://github.com/FATTY-BAMBA/StrideBrain/pull/70). Hosted acceptance remains waiting for the Product Director.

Branch `build/sb-069-design-foundation` starts from merged main `b972483a206a49ad7929aa4b7cdf24c3bf0de3d2`, after PR #68. Delivery A committed the token file, mechanical legacy renames and the tested CSS gate. B added licensed local fonts and measured their transfer before continuing. C introduced the light shell and icons; D rebuilt the Quotes and Clients lists with shared components; E adds [DESIGN_SYSTEM.md](../../../docs/design/DESIGN_SYSTEM.md), the AGENTS.md rule and this evidence. Paper, Tabs and SectionHeading are specified, not implemented.

## Required checks

**`npm run check` passed: 1,574 tests in 154 files**, formatting, CSS token gate, lint, strict typecheck and production build. Node 24; disposable loopback PostgreSQL with committed migrations and synthetic fixtures. [Full command output](evidence/check.log). The existing `prisma.config.ts` anonymous-default-export warning remains; no new lint warnings.

- Existing quote-list, client-service, route-access, role/tenant and issued-PDF tests pass unchanged. No repository, capability, schema, audit rule, assistant-module or PDF-font changes. The frozen issued PDF remains byte-for-byte identical under its existing regression test.
- New tests cover CSS raw values, comments/strings/URLs, nested rules, baseline limits, an added module, font hashes/licences/ranges, planned navigation without links, active areas, Viewer navigation, worded badges, labelled inputs/selects, hint/error associations, native forms and contrast.
- Text and badge colour pairs meet 4.5:1. Control borders meet 3:1 on canvas and surface-subtle. Every new CSS file has zero raw colour, font-size or radius violations. Existing counts were reduced when shell rules were removed; baseline allowances were not raised.
- A temporary CSS module containing `color: #123456` failed the actual CLI gate and named the file. It was removed immediately; the gate then passed. [Negative-probe output](evidence/design-gate-probe.log).
- `npm run fonts:generate` verifies all 117 committed font/licence files and regenerates the CSS offline. An initial formatting failure was corrected by making the generator use the repository's Prettier configuration; the final full check passes.

## Fonts and licensing

Inter and Noto Sans TC use committed WOFF2 unicode slices, `font-display: swap`, and variable weights covering 400, 600 and 700. SIL OFL texts sit beside the files. The manifest records original source URLs, sizes and SHA-256 hashes. Normal builds and browser visits never fetch fonts from Google. Lucide 0.468.0 geometry is copied under `src/components/ui/icons/` with its licence and source reference; SVGs are inline, 18px, 1.6px, currentColor and labelled or decorative beside text. PDF assets are unchanged.

| Local fresh zh-TW Home visit                                 | Font files | Transferred bytes | Budget    |
| ------------------------------------------------------------ | ---------- | ----------------- | --------- |
| Delivery B, before shell changes                             | 12         | 808,824           | 1,500,000 |
| Completed shell, representative issued/accepted fixture rows | 11         | 736,628           | 1,500,000 |

Both measurements used a fresh Chrome context with HTTP cache disabled, owner identity and a 1440×1100 viewport. Every font returned HTTP 200 from the app origin. [First measurement](evidence/font-first-visit.json), [completed-shell measurement](evidence/font-final-home.json). All repository font/licence files total 4,502,889 bytes; unicode slicing avoids fetching all of them on Home.

Chrome confirms the Chinese heading uses the custom Noto Sans TC bold instance. Its internal variable-family name is `Noto Sans TC Thin`, with PostScript name `NotoSansTC-Thin_Bold`; the initial verifier incorrectly expected the CSS family name literally, and was corrected after inspecting the rendered font. Chrome also confirms money in both list languages uses custom Inter. No third-party font, stylesheet or image request appeared in browser verification.

## Browser evidence

Local production build over loopback HTTPS, disposable synthetic database, Chrome at 1440×1100 and 390×844. [Complete browser checks, route statuses and 42 keyboard targets](evidence/browser-verification.json). The two issued/accepted examples were prepared only in the disposable local database, using their existing exact amounts and lines; [fixture record](evidence/local-status-fixtures.json). They are visual test fixtures, not evidence that an agent issued a hosted quote.

- Both languages: light sidebar, firm at the top, person/account actions at the bottom, labelled icons, current area, and planned Knowledge/Customer Care as non-links.
- Quotes: all five badges; one row action; amounts aligned right with tabular figures. Filters retain 24 Final, two Internal review, one Issued, one Accepted and two Draft rows in this local fixture. Page 2 is empty with a working previous-page link.
- Clients: table and name search, empty search state, existing detail page save/reload and exactly one new client audit event.
- Keyboard: sidebar, language, settings/sign-out, filter controls, table scroll region and row actions receive Tab focus with a solid 3px ring.
- Mobile: sidebar above the content, internal table scrolling, no page-level horizontal overflow in either language.
- Viewer: accessible Quotes rows with no amounts; no Clients navigation; direct Clients route returns 404 in both languages.
- Home, Projects, all four job tabs, a draft, an issued quote and Settings open in both languages inside the new shell. Owner runs and reopens a saved comparison; the evidence panel opens and Escape closes it. [Comparison/evidence result](evidence/comparison-browser.json).
- Filters and search submit and render matching rows with JavaScript disabled. Browser testing caught a route-level streaming loading boundary that hid the completed list without JavaScript. It was removed. `FilterForm` now retains native GET navigation and only adds an accessible pending notice when JavaScript is available; a regression test confirms it neither prevents submission nor changes submitted fields.
- Loading notices appear in both languages while a native GET response is delayed, then the matching rows render. [Delayed-response check](evidence/loading-browser.json). Empty and unavailable states were also captured. There were no browser page errors or foreign assets. A local self-signed TLS warning during server-action redirect prefetch did not prevent the successful save/reload; this is specific to the loopback verification certificate.

Visually reviewed: [Traditional Chinese Quotes](evidence/zh-TW-quotes.png), [English Clients](evidence/en-clients.png), [390px Clients](evidence/zh-TW-clients-mobile.png), [Viewer Quotes](evidence/en-viewer-quotes.png), and [existing evidence panel](evidence/zh-TW-evidence.png). Additional evidence includes [English Quotes](evidence/en-quotes.png), [390px Quotes](evidence/zh-TW-quotes-mobile.png), [empty Clients](evidence/zh-TW-clients-empty.png), [unavailable Quotes](evidence/zh-TW-quotes-unavailable.png), [pending filter](evidence/zh-TW-quotes-loading.png), [issued quote](evidence/zh-TW-issued-quote.png), [comparison](evidence/zh-TW-comparison.png), and [Settings](evidence/zh-TW-settings.png).

## Not verified

Hosted acceptance is **waiting for the Product Director**. No hosted deployment, migration, seed or settings change was made, and the Test site workflow was not started. The PR remains draft. No paid evaluation was run: nothing under `src/modules/assistant` changed.

The local browser checks cover the paths above, not every older issue's complete manual acceptance list. Other browsers/operating systems and the hosted font transfer were not tested. Old page bodies intentionally retain their legacy styling until part 2; they are not claimed to meet every new typography/token rule yet. PDF preservation is covered by the unchanged complete-byte regression, not a new hosted PDF download. CI will be recorded on the PR once it completes.
