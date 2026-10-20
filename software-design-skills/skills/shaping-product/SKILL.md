---
name: shaping-product
description: Shape Product. Turn an ambiguous greenfield software idea into a compact product brief by establishing the problem, users, outcomes, constraints, scope, critical domain language, material stakeholder decisions, and the smallest applicable downstream design-artifact set before choosing implementation details.
---

# Shape a Greenfield Product

Read `references/product-brief-template.md` and `references/artifact-sizing.md`.

This is a product-shaping phase, not architecture design.

## 1. Establish Intent

Capture:

- problem or opportunity;
- target users and usage context;
- desired observable outcomes;
- current workaround or alternative when known;
- business/domain language that must stay stable;
- hard constraints already imposed by the stakeholder;
- MVP boundary and explicit non-goals;
- success signals;
- material unknowns.

Do not choose frameworks, databases, cloud services, protocols, or architecture patterns unless they are explicit stakeholder constraints.

## 2. Resolve Only Material Ambiguity

A decision is material when it changes:

- product behavior or scope;
- user roles or permissions;
- data ownership/retention/sensitivity;
- offline/online assumptions;
- external integrations;
- compatibility/platform constraints;
- reliability/performance expectations;
- legal/compliance obligations;
- testability of the MVP.

Resolve what can be inferred from supplied evidence. Ask only for stakeholder decisions that cannot be safely inferred. Never convert a recommendation into an approval.

## 3. Size the Design Package

Select exactly one proportionality level:

- `compact`: small product, few actors, one primary flow, limited integration/data complexity;
- `standard`: multiple capabilities or meaningful data/API/UX decisions;
- `complex`: multiple subsystems, integrations, security/tenancy, migration, eventing, offline sync, or high-risk quality attributes.

Size controls depth, not correctness.

## 4. Select Applicable Artifacts

Recommend only artifacts that remove real ambiguity.

Always expected:

- `docs/product/brief.md`
- `docs/product/prd.md`
- `docs/spec/manifest.yaml`
- `docs/design/domain.md`
- architecture representation
- `docs/build/plan.md`

Conditional:

- DBML if persistent structured data exists;
- OpenAPI if an HTTP API contract exists;
- AsyncAPI if asynchronous/event contracts exist;
- Mermaid for non-trivial user/system flows;
- HTML prototype when visual interaction is important enough to validate;
- ADRs only for consequential technical decisions with real alternatives/trade-offs.

## 5. Output

Write `docs/product/brief.md` with:

- status;
- proportionality level;
- problem;
- users/context;
- outcomes;
- scope/non-goals;
- constraints;
- core domain language;
- approved decisions;
- open product decisions;
- proposed artifact applicability matrix.

Use one status:

- `Ready for PRD`
- `Blocked`
- `Escalate`

Do not write the PRD or technical architecture in this skill.
