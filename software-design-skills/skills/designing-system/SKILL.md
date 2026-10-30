---
name: designing-system
description: "Design System. Use after the PRD is ready for system design. Compare candidate architectures with the user, then convert the chosen one into a proportional set of canonical technical artifacts: domain model, architecture tables with an offline diagram, ADRs for consequential decisions, DBML for persistent data, OpenAPI/AsyncAPI for contracts, Mermaid flows, quality attributes with tradeoffs, threats, capacity and operations, optional HTML prototypes, and a manifest declaring authority and applicability without duplicating the PRD."
---

# Design the System

Read `references/artifact-matrix.md`, `references/manifest-template.yaml`, `references/architecture-template.md`, and `references/adr-template.md`.

## Preconditions

Require `docs/product/prd.md` status `Ready for system design` and no open product decision that blocks architecture correctness.

Treat the PRD as product authority. Do not silently rewrite product requirements to fit a preferred technology.

Load `explaining-skills:lenguaje` before writing anything the user reads. If the `explaining-skills` plugin is not installed, stop and ask the user to install it.

## Explain Decisions

The user decides every architecture choice and must understand it well enough to defend it. This section is the single source of how decisions are explained; `writing-prd`, `reviewing-system-design`, and `writing-build-plan` point here.

Before asking for a decision, explain in the voice of `explaining-skills:lenguaje`, with its evidence labels:

- what each option is and the mechanism that makes it work;
- what it gains and what it costs against the drivers;
- what it rules out, and whether a user constraint or the evidence ruled it out;
- the recommendation, labeled as one and placed after the comparison.

Size the explanation to the stakes: a table in the conversation for a single ADR or plan decision; a book with `explaining-skills:libro` in `docs/design/<slug>.html` for the candidate architectures when they differ in mechanism. The book's promise is "Al terminar, <user> puede elegir <decision> y defender por qué".

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

Distinguish confirmed constraints from design choices. Tag each driver with its source: a requirement ID, a user constraint (with the user's words), or evidence (a finding or source).

Estimate the load before choosing a shape: data volume per day, request rates against external limits, storage after one year, and monthly running cost. Label each number measured or assumed. These numbers feed the candidates and the capacity section of `quality-attributes.md`.

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

## 3. Compare Candidate Architectures

Before deciding parts, decide the shape of the whole system. Describe two or three candidate architectures that differ in mechanism: how the work is split, where state lives, what runs when, and what is built versus reused. Variations of one shape count as one candidate. When an existing platform, framework, or managed service could cover a large part of the system, one candidate reuses it. In a retroactive package, the system as built is one of the candidates.

For each candidate record:

- how it meets the drivers;
- build effort, running cost from the load estimate, and operational burden;
- what it rules out later;
- its riskiest assumption and how the first milestone would test it.

A candidate that a user constraint eliminates stays in the comparison, marked with the constraint, so the user sees what the constraint costs. When the drivers leave only one viable shape, the comparison still shows the others and the driver that eliminated each.

Explain the candidates (see Explain Decisions) and ask the user to choose. The choice becomes `ADR-001 — System shape`, with the candidates as its options. Every later ADR decides a part inside that shape.

## 4. Make Consequential Technical Decisions Explicit

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

Every ADR starts `Proposed`. It becomes `Accepted` only with `Accepted by: <who>, <date>, «<verbatim quote>»` from the decision owner's own message. Other authorities may cite an ADR only once it is `Accepted`; the package verifier reports any citation of a `Proposed` one. Explain each ADR's options before asking (see Explain Decisions).

Each option that was eliminated names what eliminated it: a user constraint or the evidence. Each ADR states its reversibility: `one-way` when undoing it means migrating data, rewriting contracts, or rebuilding much of the system; `two-way` otherwise, with the cost to reverse in one line. A one-way decision needs evidence before acceptance (a source, a probe, or a measurement); a two-way decision can be accepted on judgment and revisited at its trigger.

When `docs/discovery/findings.md` exists, an ADR whose question discovery explored takes its options and evidence from that `DQ-###` instead of from memory, and cites it. A technical decision the user already made there becomes the ADR's `Accepted by` line, with the quote recorded in the findings.

## 5. Create Canonical Technical Artifacts

Use the most specific machine-readable/textual authority available:

- architecture: `docs/design/architecture/architecture.md` from `references/architecture-template.md`, drawn as `docs/design/architecture/diagram.html` with `diagramming-architecture` in design mode;
- persistent schema: DBML;
- HTTP contract: OpenAPI;
- async/event contract: AsyncAPI;
- user/system flows: Mermaid;
- UI prototype: HTML only when visual interaction requires validation.

Do not duplicate detailed schemas or contracts in the PRD or ADRs. Cross-reference IDs/paths instead.

## 6. Quality-Attribute Design

For important NFRs, state how the architecture addresses them and what evidence must eventually verify them. Use concrete scenarios for security, reliability, performance, offline behavior, recovery, concurrency, privacy, compatibility, deployment, observability, cost, or on-device measurement when applicable.

Write `docs/design/architecture/quality-attributes.md` when any NFR needs a design response or the system runs unattended. It holds only the sections that apply, in this order:

```markdown
## NFR responses
| NFR | Design response | Evidence |
|---|---|---|
| NFR-001 | <how the design meets it> | <AC/TST ID, milestone, or change folder> |

## Tradeoffs
| Decision | Improves | Worsens | Accepted because |
|---|---|---|---|

## Threats
| Boundary crossing | Threat (STRIDE) | Mitigation or accepted risk |
|---|---|---|

## Capacity and cost
| Quantity | Estimate | Measured or assumed | Source |
|---|---|---|---|

## Operations
| Failure | How it is detected | Recovery |
|---|---|---|

## Architecture rules
| Rule | Source | Check |
|---|---|---|
```

- **NFR responses**: cite each NFR by ID without restating its target; the PRD owns the target. The table has no status column: evidence is the place where it will be or was verified. A human task that answers an NFR (for example, rotating a credential) is written in its row as `human task: <who> confirms <task>`; the row keeps that text, and `writing-build-plan` turns it into a "Stop if" of the milestone that covers the NFR; the link to the milestone lives only in that "Stop if".
- **Tradeoffs**: every decision that serves one quality attribute at the cost of another. Explain them to the user with the ADRs they come from.
- **Threats**: when data crosses a trust boundary (users, secrets, money, personal data, or external input), walk each crossing in the architecture views through STRIDE. Each threat gets a mitigation that cites its NFR or ADR, or a risk the user accepted with their quote.
- **Capacity and cost**: the load estimate from step 1, updated for the chosen shape.
- **Operations**: each failure the system must survive, from the NFRs and the external dependencies; also backups and restore, and the human steps an operator follows.
- **Architecture rules**: the boundaries and budgets the design depends on, such as "the evaluator never calls a platform API" or a latency budget, each with the ADR or view it comes from. `writing-build-plan` turns each rule into a test.

## 7. Create the Manifest

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

Then run `node <this skill's directory>/scripts/render-package.mjs <repository root>`. It writes `docs/site/<project>-architecture.html`, a single offline page that renders every applicable authority. The page is a generated view and never an authority: never edit it, and never cite it.

## 8. Output Readiness

This skill may write only one of these package states:

- `draft`
- `ready_for_review`
- `blocked`
- `escalate`

`needs_reconciliation`, `ready_for_verification`, and `approved` are workflow states owned by the review/reconciliation skills. Do not self-approve the design.

Before setting `ready_for_review`, present every ADR that other authorities cite to its decision owner, explained as Explain Decisions describes, and record `Accepted by` from their reply. If an ADR the design relies on is still `Proposed`, set `blocked` and state the decision request instead.

Do not write `docs/build/plan.md` in this skill.
