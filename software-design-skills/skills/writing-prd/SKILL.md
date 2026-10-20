---
name: writing-prd
description: Write PRD. Produce a focused product-authoritative PRD from an approved product brief, owning product purpose, users, scope, journeys, capabilities, atomic functional requirements, measurable non-functional requirements, business rules, constraints, MVP, and success criteria while deliberately excluding technical architecture, schemas, API payloads, and implementation sequencing.
---

# Write the Product-Authoritative PRD

Read `references/prd-template.md`.

## Preconditions

Require `docs/product/brief.md` with status `Ready for PRD` or equivalent approved shaping evidence.

Do not invent unresolved stakeholder decisions. If a missing decision prevents testable requirements, mark the PRD `Blocked`.

## 1. Authority Boundary

The PRD owns:

- why the product exists;
- target users and usage context;
- goals and explicit non-goals;
- user journeys and capabilities;
- functional requirements;
- measurable quality attributes/non-functional requirements;
- business/domain rules and invariants;
- product/platform constraints explicitly imposed by stakeholders;
- MVP scope and success criteria;
- future product scope;
- open product decisions.

The PRD does **not** own:

- framework/library choices;
- deployment topology;
- database tables/columns;
- API schemas/payload definitions;
- event schemas;
- package/folder structure;
- implementation order;
- technical trade-off rationale.

Those belong to downstream canonical design artifacts.

## 2. Requirements Quality

Functional requirements:

- use stable `FR-###` IDs;
- one observable behavior per requirement;
- be testable;
- avoid implementation wording unless it is a true constraint.

Non-functional requirements:

- use stable `NFR-###` IDs;
- state measurable targets or explicit acceptance scenarios;
- avoid vague words such as fast, scalable, secure, intuitive without criteria.

Use `BR-###` for domain/business rules and `CON-###` for hard product constraints when useful.

## 3. Traceability

Map capabilities/journeys to relevant requirements when the product is standard or complex. Do not build a large traceability matrix for a trivial product.

## 4. Self-Review

Before marking ready, check:

1. every MVP capability has requirements;
2. every FR is atomic and observable;
3. every important quality attribute is measurable;
4. non-goals prevent obvious scope creep;
5. business invariants are explicit;
6. architecture choices did not leak into product requirements;
7. unresolved product decisions are visible;
8. success criteria can be evaluated.

## 5. Output

Write `docs/product/prd.md`.

Use one status:

- `Ready for system design`
- `Blocked`
- `Escalate`

Revise the same PRD in place; do not create draft/final/frozen copies.
