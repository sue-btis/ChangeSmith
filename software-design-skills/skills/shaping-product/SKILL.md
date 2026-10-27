---
name: shaping-product
description: Shape Product. Use when starting a new product, or a design baseline for an existing system. Turn the idea into a compact product brief by establishing the problem, users, outcomes, constraints, scope, critical domain language, material stakeholder decisions, and the smallest applicable downstream design-artifact set before choosing implementation details.
---

# Shape a Product

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

## 2a. Separate Decisions From Evidence Questions

Classify each material unknown:

- **stakeholder decision**: only the user can choose it; it stays an open product decision;
- **evidence question** (`DQ-###`): nobody in the conversation knows the answer yet, because it is a fact about the world (what exists, how well it works), a feasibility question that needs a measurement, or a product that seeks a new approach where several methods compete.

Do not answer an evidence question from memory and do not ask the user to guess it. Write each one in the brief's Discovery section with the decision it unblocks.

Select one discovery depth:

- `none`: no evidence questions; the product follows known patterns;
- `light`: a few factual questions that sourced research and an audit can answer;
- `deep`: a feasibility risk, a kill criterion, or a product whose value depends on finding a better approach.

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
- ADRs only for consequential technical decisions with real alternatives/trade-offs;
- `docs/design/architecture/quality-attributes.md` when NFRs need a design response and verification evidence (security, reliability, performance, deployment, observability, cost, on-device measurement).

## 5. Existing System (Retroactive Package)

When the package describes a system that already exists:

- inspect the code as evidence; the target state still comes from stakeholder intent;
- record in the brief the current state with `path:line` evidence and the documents the package will supersede;
- mark the manifest later with the optional retroactive fields (see `designing-system/references/manifest-template.yaml`);
- list each drift between code and target design in the brief (`DR-001`, what differs, `path:line`, requirement IDs it affects), or turn it into a product decision (PD) in the PRD. It is never a review finding; `writing-build-plan` §3 later copies each drift into the "Stop if" of the milestone that fixes it.

## 6. Output

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
- discovery depth and evidence questions;
- proposed artifact applicability matrix.

Use one status:

- `Ready for PRD`
- `Needs discovery` when the depth is `light` or `deep`; `discovering-product` runs next
- `Blocked`
- `Escalate`

Do not write the PRD or technical architecture in this skill.
