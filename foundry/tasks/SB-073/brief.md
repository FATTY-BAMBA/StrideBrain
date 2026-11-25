# SB-073 — Firm client types and Taiwan cities

Source: https://github.com/FATTY-BAMBA/StrideBrain/issues/73, re-read from GitHub before starting; updated 25 November 2026 at 14:35:29 UTC (22:35 Taipei). Base main: 9851ca6e000dacea19b9263188a83848dc623fd8, after merged #76.

Deliver A → B → C → D in one draft PR. Add firm-owned client types, including Individual, migrate every organization and preserve custom existing values; use the firm list everywhere. Add the fixed bilingual Taiwan city/county list and Other, canonicalize recognized existing locations without losing unknown text, and keep district free text. An unsupported job type leaves only that field empty: client, city, district and area still draft independently from exact quoted words. Cover countrywide border neighbours without changing scores. Preserve saved-comparison freshness across migration, including the quote panel and Home hint. Add the required paid draft evaluation cases; at most two three-round workflow dispatches.

Security: scoped table and keys, owner-only firm-list management, role/tenant denials, atomic audit containing no labels/contact data, immutable entry keys, retired entries retained on old records, 30 client types and 40 characters per language. No client records or contact details enter model inputs or logs. No hosted operations; Product Director performs hosted acceptance.
