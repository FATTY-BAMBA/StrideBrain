# SB-073 build contract

A. Extend the existing firm-list domain, reader/writer, settings and client/job consumers with a scoped FirmClientType table. A forward-only migration preserves every client key and adds the four defaults and all existing custom values to each organization. Enforce active choices on new records, retained labels on retired records, immutable keys, 30-entry limit and 40-character labels. Keep idempotent atomic audit and role/organization boundaries.

B. Add Taiwan's 22 city/county keys, bilingual labels, common spellings and Other as domain reference data. New jobs submit an offered key. Migration maps recognized values and retains unknown text. Display localized labels everywhere. Draft cities resolve on the server from exact supporting words; unknown job types do not discard independently supported fields. The firm client list never reaches the model.

C. Add a symmetric complete land-border adjacency reference with an authoritative source. Keep scores 1 / 0.6 / 0.3 / 0. Prove seeded ranking/economics parity and preserve every pre-migration saved comparison's fingerprint meaning without weakening later-change detection. Record the chosen carry-over in verification.

D. Extend local migration/domain/UI/security tests and the three-round paid draft evaluation with private-client, Chinese-city and unsupported-job-type cases. Keep existing pass marks. Run npm run check and CI; at most two paid dispatches, using full commit SHAs. Keep draft for Product Director hosted acceptance. No Test site workflow, deployments, hosted migrations/seeding/settings changes.
