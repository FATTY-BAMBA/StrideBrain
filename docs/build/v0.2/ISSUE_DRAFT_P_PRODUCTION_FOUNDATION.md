# Issue draft — Production Foundation v0.1: make the platform safe for the first real firm

Runs alongside Stages 1 to 5 of `docs/product/V0_2_WORKFLOW_SLICE.md`. It must pass before any real customer data enters the product. Copy the text below into a new GitHub issue.

---

## Goal

Today the application has demo sign-in only and refuses to start in any data mode except `DEMO_SYNTHETIC`. That is correct for a demo and it is the gap between a demo and a product. This issue completes the "Before real customer data (L2)" list in section 10 of `docs/architecture/TECHNICAL_ARCHITECTURE_V0_1.md` and the security gates in issue #37, so the same code that runs the demo can serve a real firm in a separate production environment.

No feature is rebuilt. The architecture already has the seam: a real identity provider replaces only the boundary adapter behind `IdentityContextPort`, and `RuntimeContext.dataMode` already allows `TENANT_PRIVATE`.

## Scope

1. **Real sign-in.** An identity provider adapter behind `IdentityContextPort`. Sessions are secure, same-site cookies. The demo session adapter stays for the demo environment only.
2. **Membership lifecycle.** Invite a person, assign a role, deactivate a person. A deactivated membership loses access on the next request.
3. **Tenant onboarding and offboarding.** Create an organization with its admin. Export and delete an organization's data and files on request.
4. **`TENANT_PRIVATE` data mode.** `src/lib/env/server-env.ts` accepts it only in the production environment. A demo session can never resolve a private organization, and a real session can never resolve a synthetic one.
5. **Defense in depth for tenant isolation.** Database row-level security, or an equivalent second barrier, on every tenant-private table, in addition to the repository scoping that exists today.
6. **Separate production environment.** Its own database, file store, secrets and domain (`app.primestrideai.com`). Nothing is shared with the demo: no session secret, invitation, cookie or seed data.
7. **Backup, recovery and retention.** Scheduled database backups, a restore that has been tested once, and a written retention and deletion rule for files and records.
8. **Observability.** Error reporting, the traces and metrics in section 17 of the architecture document, and an access log for file reads. No document bodies or financial values in logs.
9. **Abuse and cost limits.** Rate limits on sign-in, upload and model-backed routes. A spending cap and timeout on model calls.
10. **Repository visibility.** Reviewed and set appropriately before production work continues, as #37 requires.
11. **Security review.** A written review of every read, write and retrieval path, with findings fixed or accepted by the Product Director.

## Decisions the Product Director must make

- The identity provider.
- Whether real customer files may be sent to a third-party model provider, under what terms, and what each customer is told and agrees to.
- The retention period for files and records after a customer leaves.

## Acceptance

- A real person signs in to the production environment, sees only their organization, and has only the capabilities of their role.
- Two real organizations in production cannot see each other's records or files, tested through the screen, through direct requests and at the database level.
- A deactivated person is denied on the next request.
- The demo environment still runs on synthetic data with the demo session, unchanged.
- A database restore from backup has been performed and recorded.
- Deleting an organization removes its records and files, and the deletion is logged.
- An error in production reaches the error reporting tool with a request id and without customer content.
- The security review is in `docs/reviews/` with every finding closed or explicitly accepted.
- `npm run check` passes.

## Out of scope

Single sign-on for enterprises, billing and subscriptions, a self-service signup page, multi-region hosting, and compliance certifications.

## Delivery sequence

A. Identity provider adapter and membership lifecycle, in the preview environment.
B. `TENANT_PRIVATE` mode, row-level security and cross-tenant tests.
C. Production environment, secrets, backups and observability.
D. Onboarding, offboarding, limits and the security review.
