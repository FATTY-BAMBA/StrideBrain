# StrideBrain

**Customer-facing AI operating intelligence for SMEs—turning projects, documents, quotations, suppliers, and company knowledge into evidence-backed answers, decisions, and actions.**

## Repository purpose

This is the canonical product repository for the customer-facing **StrideBrain** platform.

It is intentionally separate from:

- [`primestride-web`](https://github.com/FATTY-BAMBA/primestride-web) — PrimeStride AI's public marketing website and the location of the original browser-based StrideBrain demo prototype.
- [`StrideBrain-OS`](https://github.com/FATTY-BAMBA/StrideBrain-OS) — PrimeStride AI's internal opportunity, buyer-research, outreach, and revenue-intelligence system.

The current demo is a source of product learning and reusable behavior—not the permanent production architecture. This repository will extract the strongest concepts, domain logic, evidence patterns, UX lessons, and quality gates into a production-shaped application.

## Product promise

> **Every completed project should make the next project easier.**

StrideBrain connects company knowledge around projects, documents, quotations, suppliers, materials, people, decisions, risks, changes, and actions.

Its core product loop is:

`KNOW → THINK → DO → LEARN`

## First market and vertical slice

The first market wedge is Taiwan interior design and renovation firms with enough accumulated project history that finding and reusing company knowledge has become painful.

The first end-to-end product slice is **Comparable Project Intelligence**:

> **“Have we done something like this before?”**

StrideBrain should retrieve and rank relevant historical projects, explain similarities and differences, compare quotation/cost evidence, surface suppliers and lessons, show sources, and provide useful next actions.

## Product-building standard

The demo is a **production-shaped pilot**, not a disposable prototype.

Fictional demo data is acceptable. Fake intelligence, hard-coded conclusions, client-side security, and architecture intended to be discarded are not.

Every meaningful capability follows:

`Research → Product specification → UX design → Technical design → Build → Independent review → Evals/QA → Release gate`

## Current status

**Foundation phase.** Product constitution, domain/context model, prototype extraction audit, information architecture, intelligence runtime, design system, evaluation framework, and first vertical-slice specification are being established before application implementation begins.

## Planned deployment boundaries

- `www.primestrideai.com` → PrimeStride marketing website
- `demo.primestrideai.com` → controlled StrideBrain demo environment
- `app.primestrideai.com` → future production StrideBrain environment

The demo and production environments may share this repository while using separate configuration, tenants, data, access controls, and release gates.
