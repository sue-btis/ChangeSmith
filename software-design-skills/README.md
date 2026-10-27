# Software Design Skills

Plugin that turns a product idea, or an existing system, into a software design package ready for implementation, without turning the PRD into a monolithic document.

Compatible with **OpenAI Codex** and **Claude Code**. The `SKILL.md` files are in English for portability; artifacts can be written in the user's language. Release notes are in [CHANGELOG.md](./CHANGELOG.md).

## Core idea

One source of truth per kind of decision:

| Question | Authority |
|---|---|
| Why does the product exist and what must it do? | `docs/product/prd.md` |
| What did the stakeholder decide? | `docs/product/prd.md` §15 |
| What did discovery find, and which options were compared? | `docs/discovery/findings.md` *(evidence, not design authority)* |
| Which concepts and rules form the domain? | `docs/design/domain.md` |
| How is the system structured? | `docs/design/architecture/architecture.dsl` |
| Why was a technical decision made? | `docs/design/architecture/adr/` |
| How does the design answer each NFR, and how will it be verified? | `docs/design/architecture/quality-attributes.md` |
| What is the persistent model? | `docs/design/data/schema.dbml` |
| What is the HTTP contract? | `docs/design/api/openapi.yaml` |
| What is the event contract? | `docs/design/events/asyncapi.yaml` |
| How does the user move through the product? | `docs/design/ux/flows.mmd` |
| How is an important UI validated visually? | `docs/design/ux/prototype.html` |
| What is the state of review findings? | `docs/design/review.md` *(evidence, not design authority)* |
| In what order is it built? | `docs/build/plan.md` |
| How is each milestone going? | `verification.md` header in its change folder |
| Where is it declared which file governs? | `docs/spec/manifest.yaml` |

Not every project needs every file. The design skill creates only the applicable artifacts.

## Flow

```text
shaping-product
      ↓
   Needs discovery?
      ├─ yes → discovering-product   # audit, research, options, probes, explained to the user
      ↓
writing-prd
      ↓
designing-system
      ↓
reviewing-system-design        # mechanical checks, then baseline RV-001
      ↓
   BLOCKER/MAJOR?
      ├─ no ───────────────→ approved
      │                         ↓
      │                  writing-build-plan
      │
      └─ yes
          ↓
reconciling-system-design      # fixes existing findings
          ↓
reviewing-system-design        # follow-up over the impact cone
          ↓
      approved / reconcile / blocked / escalate
```

The review does not fix its own findings. `reviewing-system-design` acts as an independent gate, in a session that did not write the design; `reconciling-system-design` edits the canonical authorities and hands the package back for verification.

## After approval

```text
approved package (RV-n)
   │
   ├─ plan milestone ──────────────→ compact-change folder (Mxx)
   ├─ new capability or amendment ─→ compact-change folder (Parent: if applicable)
   └─ material change ─────────────→ baseline RV-n+1: impact review + global contradictions
```

- The change folder declares in its "Canonical Design Impact" which authorities it touches, and the implementation updates them. A product behavior change adds or updates its PRD §15 row in the same change.
- compact-change does not need to know anything about this plugin.
- Each milestone's status is read with the command in the plan template.
- What changed after approval:

```bash
git log -1 --format=%H -S'status: approved' -- docs/spec/manifest.yaml
```

```bash
git log --oneline <sha>.. -- docs/product docs/design
```

## Review convergence

- Before reading the package, run `scripts/check-package.mjs` (inside `reviewing-system-design`), the manifest's `checks:` commands, and each artifact's official validators.
- There is one full **baseline review** for the first approval. A new baseline reviews only the impact zone of the material change plus global contradictions.
- Findings carry stable IDs and severity `BLOCKER`, `MAJOR`, `MINOR` or `NOTE`, always in English.
- Only `BLOCKER` and `MAJOR` block the build plan.
- Follow-up reviews verify existing findings and regressions inside the **impact cone**, adding no new `MINOR` or `NOTE`.
- At most 3 automatic reconciliation cycles per baseline. The counter lives only in `review.md`.
- **Exit from `escalate`:** the user chooses, and the choice is recorded as a decision in §15:
  - build the unaffected milestones (default);
  - accept the risk, with their quote;
  - cut scope.

  In every exit, each open `BLOCKER`/`MAJOR` is annotated with the requirement IDs it affects, and the plan copies it into the "Stop if" of each milestone covering them (single rule in `writing-build-plan` §3).
- The reviewer never modifies canonical sources.
- `review.md` keeps only the current baseline; earlier ones stay in git.

Approval has an objective threshold: zero `BLOCKER`, zero `MAJOR`, zero blocking semantic contradictions, and no stakeholder decision that prevents implementation, or the `escalate` exit recorded with its findings routed. Minor debt does not prevent approval.

## Artifacts

### Core

```text
docs/
├── product/
│   ├── brief.md
│   └── prd.md
├── spec/
│   └── manifest.yaml
├── design/
│   ├── review.md
│   ├── domain.md
│   ├── architecture/
│   │   ├── architecture.dsl
│   │   ├── quality-attributes.md
│   │   └── adr/
│   ├── data/
│   ├── api/
│   ├── events/
│   └── ux/
└── build/
    └── plan.md
```

`data/`, `api/`, `events/`, `quality-attributes.md` and the UX prototypes are conditional. `review.md` appears when the review starts and holds evidence and workflow state, not canonical specification. The brief is a historical input once the PRD exists.

### Package view

`docs/site/<project>-architecture.html` is one self-contained page that renders the whole package: Markdown authorities, Mermaid flows, the DBML schema as tables plus an entity-relationship diagram, and the Structurizr views. It opens with a double-click and works offline, because it inlines the pinned libraries and font in `vendor/`. It is generated, never edited, and never an authority.

The page shows one document at a time: a document tree with ADR statuses on the left, the document in the middle, and its sections on the right, with previous and next links at the end. Every link has its own address (`#product/FR-012`), so the browser's back and forward buttons work and a requirement can be shared as a link.

Every mention of an ID that the package defines (`FR-012`, `PD-014`, `ADR-003`, `F-006`) links to its definition and shows it on hover or keyboard focus. Under each definition, "Cited in" lists the places that mention it, grouped by document. A definition is a heading (`### FR-001`), a list line (`- BR-001 — …`) or the first cell of a table row (`| PD-012 |`); when an ID appears in more than one of these forms, the heading wins over the list line and the list line over the table row. IDs inside code or diagrams are not linked.

Diagrams open fitted to the page width and can be zoomed with their buttons or Ctrl and the mouse wheel, moved by dragging or with the arrow keys, and shown full screen; a line under each diagram says how.

The top bar carries the package status and review baseline, a filter over documents, headings and IDs (press `/`), and light, dark and automatic themes. Narrow screens get a document menu, and printing prints the current document.

```bash
node skills/designing-system/scripts/render-package.mjs <repo>                     # build once
node skills/designing-system/scripts/render-package.mjs <repo> --watch             # rebuild on every save
node skills/designing-system/scripts/render-package.mjs <repo> --install-git-hook  # rebuild and stage it on each commit that touches docs/
```

- The Structurizr views need Java and the official [Structurizr CLI](https://docs.structurizr.com/cli): set `STRUCTURIZR_CLI` to the unzipped CLI folder. Without it, the page shows the DSL source with a note.
- The page is rewritten only when a source changes, so it does not add noise to every commit.
- The Claude Code hook in `hooks/` rebuilds the page after an agent edits a file under `docs/`. It is off until you set `CHANGESMITH_RENDER_PACKAGE=1`.
- The git hook installer never overwrites a `pre-commit` hook it did not write; it prints the line to add instead.

## Retroactive package

For a system that already exists:

- the manifest is marked `nature: retroactive` with `superseded_documents`;
- the code can be the authority, with its snapshot marked non-authoritative;
- each gap between code and design is listed in the brief with the requirements it affects (and the plan carries it into the "Stop if" of the milestone that fixes it), or becomes a §15 decision. It is never a review finding.

## Authority rules

- The PRD owns **product, scope, users, required behavior, NFR targets and product decisions**.
- Structurizr/C4 owns **technical structure and architectural relationships**, not product goals.
- ADRs own **rationale and trade-offs of technical decisions**.
- `quality-attributes.md` owns **the design's response to each NFR and its evidence**; it cites the NFR by ID without repeating the target.
- DBML owns the **persistent schema**; the PRD does not replicate columns or tables.
- OpenAPI/AsyncAPI own **integration contracts** and their own semver; the PRD references requirements and does not duplicate payloads.
- Mermaid owns **flows**, not architectural decisions.
- HTML serves as a **verifiable prototype**, not as architecture.
- `manifest.yaml` declares which sources are authoritative and which do not apply, and carries only the keys of its template.
- `review.md` records findings and cycles but cannot redefine product or architecture.
- No artifact cites another's version.
- Only a **material semantic** contradiction stops implementation. Editorial, casing or representation differences are not automatically blockers.

## PRD

This plugin's PRD is deliberately smaller than a mega-PRD. It keeps:

- problem/purpose;
- users/context;
- goals/non-goals;
- journeys;
- capabilities;
- FR/NFR;
- business rules and invariants;
- constraints;
- MVP, citing its FR IDs;
- success criteria;
- future scope;
- product decisions (§15).

Architecture, schema, contracts and implementation order live in separate artifacts. The PRD carries no version and no "Changes since" sections: its history stays in git and in the change folders.

## Initial implementation

Do not run the whole project in a single prompt. `writing-build-plan` splits the system into verifiable vertical slices:

```text
M01 -> implement -> verify
M02 -> implement -> verify
M03 -> implement -> verify
```

`compact-change-skills:implementing-change` 2.2+ can consume an approved slice of this plugin directly, together with `manifest.yaml` and the relevant authorities. Before editing, it checks that the slice is complete.

## Principles

- Problem and constraints first; technology after.
- Do not invent decisions the user or the repository/project has not approved.
- One source of truth per kind of decision.
- Versionable, machine-readable text where a standard beats free prose.
- A script checks the mechanical; the model checks the meaning.
- Create only the artifacts that reduce real ambiguity.
- Do not store state that another source already knows.
- Do not mix product requirements with implementation choices.
- Design for incremental implementation by vertical slices.
- Separate discovery of defects from fixing and verification.
- Approve by objective build readiness, not by the absence of possible improvements.
