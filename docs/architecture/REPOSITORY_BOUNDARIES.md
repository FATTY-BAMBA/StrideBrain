# Repository and Deployment Boundaries

## Decision

The customer-facing StrideBrain product has its own canonical repository:

- **Canonical product:** `FATTY-BAMBA/StrideBrain`

It must remain separate from the two existing systems that informed it.

## Repository responsibilities

### `primestride-web`

Purpose:

- PrimeStride AI public website;
- company and product marketing;
- campaigns and landing pages;
- public case studies and contact flows;
- links into controlled demos.

It currently contains the original browser-based StrideBrain demo prototype under `public/stridebrain-demo`. That prototype is a migration source, not the permanent product location.

It should eventually contain no operational StrideBrain runtime, customer data access, model credentials, tenant logic, or product business rules.

### `StrideBrain-OS`

Purpose:

- PrimeStride AI internal opportunity intelligence;
- buyer research;
- qualification;
- outreach preparation;
- pipeline and revenue execution.

It is an internal company tool, not the customer-facing StrideBrain application.

Its engineering practices may be used as references, but its Opportunity-centered domain model must not determine this product.

### `StrideBrain`

Purpose:

- customer-facing AI operating intelligence platform;
- projects, documents, quotations, suppliers, knowledge, decisions, risks, changes, actions, and evidence;
- controlled demo, pilot, and future production environments;
- canonical product, domain, design, intelligence, evaluation, and release specifications.

## Source roles

```text
primestride-web / stridebrain-demo
        ↓
Product, UX, workflow, and intelligence prototype source

StrideBrain-OS
        ↓
Engineering discipline and governed-workflow reference

StrideBrain
        ↓
Canonical customer product and production-shaped implementation
```

## Deployment boundaries

### Marketing

- Domain: `www.primestrideai.com`
- Repository: `primestride-web`
- Data sensitivity: public marketing data only
- Operational credentials: none beyond marketing/contact needs

### Controlled demo

- Domain: `demo.primestrideai.com`
- Repository: `StrideBrain`
- Environment: controlled demo
- Data: fictional/public fixtures only until a governed pilot is approved
- Access: invited or protected
- External actions: disabled or staff-controlled

### Future production product

- Domain: `app.primestrideai.com`
- Repository: `StrideBrain`
- Environment: production
- Data: tenant-private
- Access: authenticated organization membership and role authorization
- External actions: authenticated, policy-controlled, approved, and audited

## Separation rules

1. The marketing website may link to StrideBrain but should not host the product runtime.
2. The marketing deployment should not receive StrideBrain model keys, database credentials, object-storage credentials, or tenant connector secrets.
3. Marketing releases and StrideBrain releases must be independent.
4. A StrideBrain build failure must not break the public website.
5. A website content change must not redeploy or alter the StrideBrain application.
6. Demo and production may share product code but must not share ungoverned data, credentials, tenant context, or release aliases.
7. The old demo remains available during migration until the new repository reaches feature and quality parity for the agreed demo path.
8. No old prototype code should be deleted before its behavior, tests, data, and lessons are classified in the extraction audit.

## Canonical source-of-truth hierarchy

For future product decisions:

1. approved files in this repository;
2. accepted architecture decision records in this repository;
3. approved product/evaluation specifications in this repository;
4. original demo documents and code as historical/prototype evidence;
5. conversation notes only when converted into a reviewable repository artifact.

## Naming clarification

- **StrideBrain** = customer-facing product.
- **StrideBrain-OS** = PrimeStride internal revenue/client-acquisition operating system.
- **PrimeStride AI website** = marketing and public company presence.

These names must not be used interchangeably in documentation, infrastructure, domains, or release communication.
