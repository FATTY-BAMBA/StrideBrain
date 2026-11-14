# Independent Review — Stage 0 Application and Quality Foundation

**Review scope:** PR #14, Issue #13, application shell, localization, architecture seams, tests, CI, environment boundary, and Stage 0 scope  
**Reviewer stance:** adversarial product, UX, architecture, security, and release review  
**Verdict:** **PASS FOR MERGE AFTER FINAL CI**

## 1. Executive assessment

The Stage 0 scaffold establishes a real customer-facing StrideBrain application foundation without pretending that the database, Horizon Atelier fixture, comparison engine, evidence runtime, governed action, or AI model already exists.

The implementation is consistent with the accepted Build Contract:

- one isolated application repository;
- five approved global surfaces;
- five approved project-local surfaces;
- server-rendered English/Traditional Chinese routes;
- strict TypeScript and explicit architecture seams;
- no browser-owned business truth;
- no provider, database, or real-tenant dependency;
- reproducible dependency lock;
- permanent CI quality gate.

Stage 0 is ready to merge after the exact final head passes CI.

## 2. Product and UX review

### Pass: honest capability boundary

The shell clearly states that project data, organization administration, and AI are not connected.

The project route returns a localized unavailable state rather than inventing Xinyi/Horizon data before Stage 1.

### Pass: approved information architecture

Global navigation is limited to:

```text
Home
Projects
Knowledge
StrideBrain
Settings
```

Project-local navigation is limited to:

```text
Overview
Compare
Commercial
Evidence
Actions
```

No prototype feature catalogue, provider menu, AI Team, Historical Estimator, quotation module, or connector module was reintroduced.

### Pass: bilingual architecture

- `zh-TW` and `en` render server-side from the same semantic catalog;
- HTML language is correct;
- root redirects to the approved Traditional Chinese default;
- catalog parity and non-empty critical messages are tested;
- language switching preserves the current locale-scoped route;
- no client-side translation patching exists.

### Pass: responsive/accessibility foundation

The shell includes:

- semantic navigation/main/footer landmarks;
- skip link;
- visible focus treatment;
- responsive global/project navigation;
- reduced-motion support;
- text labels in addition to status color;
- localized accessible labels.

Full browser accessibility testing remains correctly deferred until there is a functional Stage 3+ workflow.

## 3. Architecture review

### Pass: layer boundaries

The scaffold introduces:

- `RuntimeContext`;
- `IdentityContextPort`;
- organization-scoped `ProjectRepositoryPort`;
- `ProjectWorkspaceQuery` application service.

The UI does not import Prisma, fixture data, provider SDKs, or repository adapters.

### Pass: boundary enforcement

Automated tests reject experience-layer coupling to:

- Prisma;
- persistence adapters;
- fixtures;
- OpenAI/OpenRouter/Supabase;
- browser local/session storage as business state;
- secret-like environment variables.

This is a strong preventive control before Stage 1 introduces persistence.

### Pass: environment boundary

Stage 0 permits only:

```text
STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC
```

A private/real-tenant mode fails validation. No provider/database secrets are required.

## 4. Quality and release review

The permanent CI gate verifies:

1. locked `npm ci` installation;
2. scoped formatting;
3. ESLint;
4. TypeScript;
5. unit, localization, navigation, environment, architecture, and application-port tests;
6. Next.js production build;
7. high-severity production dependency audit.

The first successful gate recorded:

- 5 test files passing;
- 14 tests passing;
- successful production compilation and static route generation;
- 0 production dependency vulnerabilities.

The final cleanup commits also:

- align the checked-in `tsconfig.json` with Next’s stable build requirements;
- remove the last lint warning;
- move GitHub Actions to current Node-runtime action versions.

The exact final head must pass again before merge.

## 5. Security review

### Positive controls

- no browser secrets;
- no database/provider credentials;
- no real customer data;
- no user-supplied organization/role authority;
- no business-state browser storage;
- no external action endpoints;
- basic security headers;
- environment data-mode guard;
- dependency audit;
- read-only architecture ports only.

### Correctly deferred

These do not belong in Stage 0 and remain blocking for later stages:

- signed demo identity adapter;
- real RuntimeContext resolution;
- database tenant scoping and cross-tenant tests;
- action CSRF/idempotency/audit;
- evidence preview security;
- database RLS before real customer data.

## 6. KEEP

- calm product-first shell;
- honest empty/unavailable states;
- exact global/project IA;
- server-rendered locale handling;
- strict TypeScript settings;
- repository/application ports;
- architecture-boundary tests;
- synthetic-only environment guard;
- reproducible lockfile;
- permanent CI.

## 7. CHANGE IN LATER STAGES ONLY

Stage 1 may add:

- Prisma/Postgres;
- bounded first migration;
- exact-decimal package;
- Horizon Atelier fixture/validator.

Stage 2 may add:

- signed demo identity;
- runtime context and authorization implementation;
- cross-tenant test fixture.

Stage 3 may replace the project unavailable state with a repository-backed ProjectWorkspaceDTO.

These changes must use the existing ports/contracts rather than bypassing them.

## 8. DO NOT INTRODUCE

- hard-coded Horizon project data in pages/components;
- direct Prisma queries from routes/components;
- generic dashboard KPI cards unrelated to the first vertical slice;
- client-chosen organization/role;
- localStorage business state;
- model/provider integration before deterministic stages pass;
- copied static demo code;
- live-domain deployment;
- real customer data.

## 9. Known limitations

- no database or durable business state;
- no identity/session implementation;
- no real project workspace;
- no E2E browser/a11y/visual tests yet;
- no Vercel preview deployment;
- no comparison/evidence/action intelligence;
- no AI provider.

These are explicit Stage 0 boundaries, not hidden defects.

## 10. Final verdict

**PASS FOR MERGE AFTER FINAL CI.**

The scaffold is a coherent, production-shaped starting point for Stage 1 and does not recreate the old demo’s architectural problems.

After merge, Stage 1 should begin with the bounded Prisma/Postgres schema, exact-decimal policy, Horizon Atelier seed, and fixture validator—without adding product UI features prematurely.
