# SB-067 — Price list and comparison beside the quote

Issue: https://github.com/FATTY-BAMBA/StrideBrain/issues/67
Base: merged main after PR #74 (`8bcd5a9d84499b52d91c1838aa34f61c3582a4cb`). Branch: `build/sb-067-price-list`.

A derived read model uses the latest issued/accepted version of each quote, grouping item descriptions and units after NFKC, trimming and case folding. No maintained price table, model matching, model calls or hosted operations. Every result is restricted to readable source quotes and links to its source. Viewer has no prices.

Deliver in order: A access-controlled read model and tests; B eight typing suggestions, five history rows and a read-only price list in pages of 50; C comparison beside the document and Home's draft-quote next action. One draft PR until the Product Director tests it.

The existing comparison tab stays. Category suggestions still cover the combined ordinary-item amount across every section mapped to that pricing category; percentage fees never enter it. Save and issue do not require a comparison.
