# StrideBrain Prototype Extraction Research

This directory contains the Phase 1 source-grounded audit of the customer-facing prototype currently embedded in `FATTY-BAMBA/primestride-web`.

## Artifacts

1. [Prototype Extraction Audit](./PROTOTYPE_EXTRACTION_AUDIT.md)  
   Executive findings, subsystem classification, reusable contracts and target architecture.

2. [Runtime Inventory](./RUNTIME_INVENTORY.md)  
   Browser, domain, intelligence, session, connector, API and QA module classification.

3. [Product Flow & UX Audit](./PRODUCT_FLOW_AND_UX_AUDIT.md)  
   User goals, inputs, outputs, evidence, actions, states, bilingual findings and production conversion.

4. [Domain Rules & Data Map](./DOMAIN_RULE_AND_DATA_MAP.md)  
   Extracted deterministic rules, candidate typed contracts and fixture-to-StrideGraph mapping.

5. [Eval Migration Map](./EVAL_MIGRATION_MAP.md)  
   Migration of prototype regression work into static, domain, integration, browser, bilingual, intelligence, grounding, permission and release suites.

6. [Independent Review](./INDEPENDENT_REVIEW.md)  
   Adversarial keep/change/remove review and required decisions before implementation.

7. [Comparable Project Intelligence Extraction Brief](../features/COMPARABLE_PROJECT_INTELLIGENCE_EXTRACTION_BRIEF.md)  
   First vertical-slice product/domain/UX/intelligence contract.

## Core decision

Do not copy the static demo architecture and do not discard the learned behavior.

Extract:

- product outcomes;
- deterministic rules;
- evidence semantics;
- review/approval boundaries;
- fixtures;
- canonical questions;
- regression tests.

Rebuild them around:

- trusted organizations and memberships;
- StrideGraph objects;
- durable repositories;
- typed application services;
- evidence-aware intelligence;
- structured results;
- human-authorized actions.
