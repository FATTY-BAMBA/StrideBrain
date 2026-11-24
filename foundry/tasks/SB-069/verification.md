# SB-069 verification

Base: merged main `b972483a206a49ad7929aa4b7cdf24c3bf0de3d2`. One draft PR; hosted acceptance waits for the Product Director.

## Delivery A

Tokens and mechanical legacy renames preserve older body values. The CSS gate has five passing unit tests for raw values, comments/strings/URLs, nested rules, baseline limits and a new CSS module containing `color: #123456`. It runs in npm run check and CI. No styling dependency added.

## Delivery B

Inter and Noto Sans TC are served locally, with OFL licences, unicode-range slices, swap display, and variable weights covering 400, 600 and 700. The committed generator verifies every file hash; normal builds make no font download. Font/check tests: 7/7. Production build passed. PDF font unchanged.

A fresh owner visit to zh-TW Home at 1440×1100 with the HTTP cache disabled fetched **808,824 bytes across 12 font files**, below the **1,500,000-byte** stop threshold. Every font response was HTTP 200 from the app origin. Chrome confirms the heading uses the custom Noto Sans TC bold instance (internal variable-family name `Noto Sans TC Thin`, PostScript name `NotoSansTC-Thin_Bold`). The initial verifier expected the CSS family name literally; its corrected check recognises the recorded internal name. [Network and rendered-font evidence](evidence/font-first-visit.json). All repository font and licence files total 4,502,889 bytes; unicode slicing prevents fetching all of them on Home.

## Pending

Shell, shared components, list migration, full checks and final browser evidence are in progress. No hosted deployment, migration, seed or settings change; no paid evaluation.
