# ADR-001 — Canonical Product Repository

- **Status:** Proposed for acceptance
- **Date:** 2026-11-14
- **Decision owner:** PrimeStride AI

## Context

The original customer-facing StrideBrain demo was implemented inside `primestride-web`, while `StrideBrain-OS` is a separate internal PrimeStride revenue-intelligence system.

Keeping the customer product inside the marketing repository couples unrelated release cycles, security boundaries, dependencies, data access, and product ownership.

Repurposing `StrideBrain-OS` would mix the customer product with PrimeStride's internal opportunity, buyer-research, outreach, and pipeline domain.

## Decision

`FATTY-BAMBA/StrideBrain` is the canonical repository for the customer-facing StrideBrain product.

- `primestride-web` remains the public marketing website.
- `StrideBrain-OS` remains the internal PrimeStride operating system.
- the embedded demo in `primestride-web` becomes a controlled prototype/migration source;
- new customer-product architecture and implementation belong in `StrideBrain`;
- `demo.primestrideai.com` and future `app.primestrideai.com` should deploy from `StrideBrain` after explicit release approval.

## Consequences

### Positive

- independent marketing and product releases;
- smaller security surface on the public website;
- clear product ownership;
- production-shaped tenant, data, AI, and integration architecture;
- easier demo/production environment separation;
- no confusion between internal and customer-facing StrideBrain systems.

### Costs

- prototype behavior must be audited and migrated;
- temporary duplication exists during cutover;
- deployment/domain configuration must be changed later;
- old marketing-repo demo cannot be removed until parity and rollback gates pass.

## Guardrails

1. No new product foundation should be added to `primestride-web` except urgent safety/reliability fixes for the existing demo.
2. No customer-facing domain model should be added to `StrideBrain-OS`.
3. Prototype code is not copied wholesale; behavior and rules are classified and reimplemented behind canonical contracts.
4. Domain cutover requires an exact tested deployment and rollback plan.
5. The old demo remains available until the accepted controlled-demo journey passes.
