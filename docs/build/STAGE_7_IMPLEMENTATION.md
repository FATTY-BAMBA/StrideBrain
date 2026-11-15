# Stage 7 — Interactive Evidence Panel

**Status:** Implementation candidate; exact-head CI and browser acceptance required  
**Issue:** #27  
**Scope:** Claim-to-evidence inspection for the merged Stage 6 comparison experience

## 1. Outcome

Stage 7 turns the stored Stage 4 comparison and Stage 5 economics evidence bundles into an interactive, authorization-aware evidence experience.

The user can now inspect:

- a material economics claim;
- a deterministic similarity factor;
- one source within an authorized evidence bundle;
- an accessible conflict attached to that source.

The implementation does not recalculate ranking or economics and does not call an AI model.

## 2. User flow

```text
Stage 6 comparison result
  → select claim/value/factor
  → preserve run, selection, locale, scroll and trigger
  → re-resolve trusted RuntimeContext
  → reopen immutable Stage 4 / Stage 5 result
  → reauthorize every requested source
  → return permission-safe panel DTO
  → inspect authority, locator, preview and trace
  → close and restore focus to exact trigger
```

## 3. Public route contract

Evidence state is carried in bounded query parameters:

- `evidenceMode`;
- `evidenceClaim`;
- `evidenceCandidate`;
- `evidenceFactor`;
- `evidenceSource`;
- `evidenceConflict`;
- `evidenceReturn`.

The browser never receives or supplies organization IDs, membership IDs, capabilities, authority decisions, raw evidence-reference IDs, storage keys or raw storage URLs.

Source navigation uses a SHA-256-derived opaque key scoped to the immutable comparison run. The server resolves that key only against evidence already present in the authorized claim or factor bundle.

## 4. Authorization design

Every panel open rechecks current authorization.

The Prisma adapter:

1. verifies the comparison run belongs to the current organization and active project context;
2. loads only requested evidence-reference metadata;
3. batch-loads minimal subject ownership/project identity;
4. applies evidence and commercial authorization;
5. loads sensitive amounts and detailed preview fields only after authorization succeeds;
6. returns `ACCESS_CHANGED` when a previously available source no longer resolves or is no longer authorized.

A Viewer or downgraded user cannot cause restricted actual-cost values to be loaded and hidden client-side.

Conflict mode is bound to an opaque source already present in the selected authorized claim/factor bundle. An arbitrary conflict key cannot be used to enumerate unrelated organization evidence.

### Comparison-library alignment

Historical evidence access follows the same governed policy that authorized the immutable Stage 4 and Stage 5 result:

- the active project continues to require normal project assignment and capabilities;
- a historical project must already be an authorized candidate in the stored comparison run;
- assignment-free access is permitted only for approved comparison-library classifications (`DEMO_SYNTHETIC`, `PUBLIC_REFERENCE`, or `TENANT_APPROVED`), or for organization-wide private-history roles;
- reconciled actual-cost evidence still requires `commercial:actual-read` and the Stage 5 historical-actual policy;
- quote and supplier/forecast evidence still require their respective capabilities;
- a Viewer or user without actual-cost capability remains unable to query actual values.

This prevents Stage 7 from incorrectly rejecting evidence that Stage 5 already used lawfully, without weakening tenant, capability, or immutable-run boundaries.

## 5. Supported evidence subjects

The repository supports:

- Project;
- ProjectScope;
- DocumentVersion;
- QuoteVersion and QuoteItem;
- ForecastCostVersion and ForecastCostLine;
- ProjectCostVersion and CostLine;
- SupplierOffer and SupplierOfferItem.

Each source view includes, where available:

- localized title;
- object type and version;
- project context;
- effective/recorded date;
- exact locator;
- authority state;
- observation type;
- data classification;
- supported value;
- current/historical/stale/superseded/conflicted state;
- structured safe preview or explicit preview-unavailable state.

Document storage keys and unrestricted download URLs are never exposed.

## 6. Panel modes

### Claim

Shows the selected Stage 5 structured claim, exact authorized sources, calculation trace, authority, sufficiency and warnings.

### Factor

Shows the stored Stage 4 factor state, normalized value, weight, contribution, total score, evidence coverage, policy version and exact factor evidence. No similarity formula is rerun in the presentation path.

### Source

Shows one opaque-key-selected source and every currently authorized Stage 5 claim in the immutable result that relies on it.

### Conflict

Shows accessible conflicting records and calculation impact only after the conflict is proven to belong to the selected source in the current authorized bundle.

## 7. Experience behavior

Desktop uses a 400–480 px side panel. Mobile uses a full-height single-column panel.

The panel provides:

- focus on the heading when opened;
- Escape and close-button handling;
- focus trapping;
- body-scroll locking;
- focus restoration to the exact opening trigger;
- route-preserved locale, run, selected projects and evidence selection;
- text-plus-icon/state semantics rather than color alone;
- reduced-motion handling;
- structured claim, source, calculation and conflict sections.

Non-ready states also receive focus, Escape handling and safe request IDs without preserving sensitive preview content.

## 8. Bilingual semantics

English and Taiwan Traditional Chinese catalogs cover:

- evidence authority;
- observation types;
- freshness and supersession;
- conflict and insufficiency;
- claim kinds;
- factor labels/states;
- source subject types;
- data classifications;
- common locator, financial and calculation fields.

Normal Chinese mode does not expose database, model-provider or token plumbing.

## 9. Performance and query behavior

Evidence reads are bounded by subject type, not source count. Ownership reads and detailed reads are batched per subject type; there is no per-source N+1 loop.

The PostgreSQL hero integration records `STAGE7_EVIDENCE_PANEL_MS` for the imported-stone claim. The controlled-demo target is less than 500 ms after the Stage 6 result is available.

## 10. Tests

Stage 7 adds tests for:

- claim, factor, source and conflict modes;
- opaque source-key binding;
- conflict enumeration prevention;
- access-change fail-closed behavior;
- ownership authorization before sensitive reads;
- approved comparison-library history without direct assignment;
- Viewer actual-cost non-query behavior;
- route parsing and restoration;
- English/Traditional Chinese parity;
- no Prisma/calculator/provider/browser-storage leakage in presentation code;
- real signed-session PostgreSQL claim and factor panels;
- panel performance baseline;
- all prior Stage 1–6 regressions.

## 11. Deliberate boundaries

Not included:

- conflict resolution;
- arbitrary document upload or OCR;
- unrestricted source downloads;
- Stage 8 action creation;
- Stage 10 model explanation;
- semantic/vector ranking;
- real customer data;
- Vercel, DNS or live-domain changes.

## 12. Release boundary

Functional merge does not authorize public release. Desktop, tablet and mobile visual review, Taiwan Traditional Chinese language review, keyboard/screen-reader smoke testing, contrast/zoom checks and an isolated preview remain release gates.
