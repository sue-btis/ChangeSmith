---
name: designing-system
description: Design System. Use after the PRD is ready for system design. Convert it into a proportional set of canonical technical artifacts: domain model, Structurizr/C4 architecture, ADRs for consequential decisions, DBML for persistent data, OpenAPI/AsyncAPI for contracts, Mermaid flows, quality attributes, optional HTML prototypes, and a manifest declaring authority and applicability without duplicating the PRD.
---

# Design the System

Read `references/artifact-matrix.md`, `references/manifest-template.yaml`, and `references/adr-template.md`.

## Preconditions

Require `docs/product/prd.md` status `Ready for system design` and no open product decision that blocks architecture correctness.

Treat the PRD as product authority. Do not silently rewrite product requirements to fit a preferred technology.

## 1. Derive Architectural Drivers

Extract and reference:

- product capabilities;
- business invariants;
- hard constraints;
- quality attributes/NFRs;
- external integrations;
- security/identity/tenancy boundaries;
- data lifecycle and sensitivity;
- deployment/runtime constraints.

Distinguish confirmed constraints from design choices.

## 2. Design Domain Before Components

Write `docs/design/domain.md` with:

- ubiquitous language;
- actors/roles;
- entities/value objects/aggregates or equivalent domain concepts when useful;
- invariants;
- lifecycle/state transitions;
- ownership boundaries;
- bounded contexts/modules when justified;
- mapping back to `FR-*`, `BR-*`, and `NFR-*` where useful.

Do not mirror database tables as the domain model by default.

## 3. Make Consequential Technical Decisions Explicit

For decisions with meaningful alternatives/trade-offs, create one ADR per decision in `docs/design/architecture/adr/`.

Examples:

- modular monolith vs services;
- SQL vs document persistence;
- authentication/authorization approach;
- offline synchronization strategy;
- event-driven integration;
- object/file storage;
- caching strategy;
- deployment/runtime constraints when consequential.

Do not create ADRs for trivial library choices unless they materially constrain the system.

Name each file `ADR-###-<slug>.md` and start it with the heading `# ADR-### — <Decision>`.

Every ADR starts `Proposed`. It becomes `Accepted` only with `Accepted by: <who>, <date>, «<verbatim quote>»` from the decision owner's own message. Other authorities may cite an ADR only once it is `Accepted`; the package verifier reports any citation of a `Proposed` one.

## 4. Create Canonical Technical Artifacts

Use the most specific machine-readable/textual authority available:

- architecture: Structurizr DSL when useful; otherwise a concise text/Mermaid architecture only for compact systems;
- persistent schema: DBML;
- HTTP contract: OpenAPI;
- async/event contract: AsyncAPI;
- user/system flows: Mermaid;
- UI prototype: HTML only when visual interaction requires validation.

Do not duplicate detailed schemas or contracts in the PRD or ADRs. Cross-reference IDs/paths instead.

## 5. Quality-Attribute Design

For important NFRs, state how the architecture addresses them and what evidence must eventually verify them. Use concrete scenarios for security, reliability, performance, offline behavior, recovery, concurrency, privacy, compatibility, deployment, observability, cost, or on-device measurement when applicable.

When any NFR needs a design response, write `docs/design/architecture/quality-attributes.md`:

```markdown
| NFR | Design response | Evidence |
|---|---|---|
| NFR-001 | <how the design meets it> | <AC/TST ID, milestone, or change folder> |
```

Cite each NFR by ID without restating its target; the PRD owns the target. The table has no status column: evidence is the place where it will be or was verified. A human task that answers an NFR (for example, rotating a credential) is written in its row as `human task: <who> confirms <task>`; the row keeps that text, and `writing-build-plan` turns it into a "Stop if" of the milestone that covers the NFR; the link to the milestone lives only in that "Stop if".

## 6. Create the Manifest

Write `docs/spec/manifest.yaml` last, from `references/manifest-template.yaml`.

It must declare:

- the current baseline and the review gate status;
- PRD authority;
- applicable technical authorities;
- explicitly non-applicable artifacts;
- precedence/contradiction rule that distinguishes semantic blockers from harmless wording differences;
- IDs or paths that implementation agents should read first.

The manifest is an index of authority, not another specification. It holds only the keys in the template, including the optional ones it declares.

When the manifest is written, remove the `Status:` line from `docs/product/brief.md` and `docs/product/prd.md`; from then on the review gate status lives only in the manifest.

## 7. Output Readiness

This skill may write only one of these package states:

- `draft`
- `ready_for_review`
- `blocked`
- `escalate`

`needs_reconciliation`, `ready_for_verification`, and `approved` are workflow states owned by the review/reconciliation skills. Do not self-approve the design.

Before setting `ready_for_review`, present every ADR that other authorities cite to its decision owner and record `Accepted by` from their reply. If an ADR the design relies on is still `Proposed`, set `blocked` and state the decision request instead.

Do not write `docs/build/plan.md` in this skill.
