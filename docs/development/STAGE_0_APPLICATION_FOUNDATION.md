# Stage 0 — Application and Quality Foundation

**Status:** Implementation branch  
**Issue:** #13  
**Branch:** `build/stage-0-scaffold`

## Purpose

Establish the real customer-facing StrideBrain application and quality boundaries before any fixture database, comparison logic, evidence runtime, action write, or AI integration is added.

This stage intentionally renders an honest product foundation rather than simulated business intelligence.

## Runtime

- Next.js App Router;
- React;
- strict TypeScript;
- Node.js 24 LTS;
- CSS design foundation without a component-framework dependency;
- Vitest for unit/contract tests;
- Next.js ESLint flat configuration;
- Prettier;
- GitHub Actions quality gate.

Exact versions are pinned in `package.json` and `package-lock.json`.

## Approved surfaces

Global:

```text
Home
Projects
Knowledge
StrideBrain
Settings
```

Project-local:

```text
Overview
Compare
Commercial
Evidence
Actions
```

Stage 0 does not load project records. A project URL returns a localized, accessible unavailable state while preserving the approved workspace hierarchy.

## Architecture seams

Stage 0 introduces:

- `RuntimeContext` and `IdentityContextPort` contracts;
- organization-scoped `ProjectRepositoryPort`;
- `ProjectWorkspaceQuery` application service;
- locale/catalog contracts;
- approved navigation contracts;
- experience-layer boundary tests.

UI and route code may not import:

- Prisma/persistence adapters;
- fixtures;
- provider SDKs;
- secrets;
- browser storage as business state.

## Environment boundary

Supported Stage 0 data mode:

```text
STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC
```

Any private/real-tenant mode fails environment validation.

No provider or database secrets are required in Stage 0.

## Local commands

```bash
npm ci
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

## Quality gate

The CI workflow verifies:

1. locked dependency installation;
2. formatting;
3. linting;
4. TypeScript;
5. unit/architecture/localization tests;
6. production build;
7. high-severity production dependency audit.

## Non-goals

- Prisma schema/database connection;
- Horizon Atelier project fixtures;
- authentication implementation;
- comparison service;
- evidence panel functionality;
- internal action creation;
- model/provider integration;
- document upload;
- Vercel or domain changes;
- old prototype migration.

## Exit criteria

- reproducible locked install;
- production build passes;
- both locales render from the same semantic shell;
- global/project navigation matches the accepted IA;
- no simulated AI/project data;
- architecture boundaries and environment guards pass;
- independent review confirms Stage 0 remains within scope.
