---
name: writing-build-plan
description: Write Build Plan. Use once the design package is approved. Convert it into an executable sequence of small vertical slices that each deliver observable behavior, map product requirements to canonical contracts and tests, minimize cross-slice dependencies, prove architecture early, and can be handed one at a time to compact-change-skills for controlled implementation and independent verification.
---

# Write the Build Plan

Read `references/build-plan-template.md`.

## Preconditions

Require:

- `docs/spec/manifest.yaml` status `approved`;
- design review verdict `Approved for build planning`;
- no blocking product/architecture decision;
- applicable canonical contract paths known.

Do not redesign the architecture while planning. If planning exposes a new material contradiction, open a new baseline (manifest back to `ready_for_review`) rather than silently reopening the previous verification loop.

## 1. Plan Vertical Slices

Prefer slices that deliver a thin end-to-end behavior across required layers rather than horizontal infrastructure batches.

Good:

```text
M01: user can create and retrieve one valid document end-to-end
M02: user can upload a second version and see history
```

Avoid when possible:

```text
M01: create all database tables
M02: create all repositories
M03: create all controllers
```

A foundation slice is allowed only for prerequisites that cannot be proven through a vertical behavior.

## 2. First Architectural Milestone

Choose the smallest slice that proves the core architecture works end to end, including the highest-risk assumption that can be tested early.

Do not front-load every abstraction or future capability.

## 3. Slice Contract

Every slice must define:

- goal/observable outcome;
- `FR-*`/`NFR-*`/`BR-*`/`CON-*` coverage;
- acceptance IDs `AC-*`;
- test obligations `TST-*`;
- canonical artifacts it consumes;
- expected create/edit areas (without inventing nonexistent paths as facts);
- prerequisites;
- implementation stop conditions;
- completion evidence.

### Stop-if routing

Before the plan exists, three kinds of open item are recorded against the requirement IDs a milestone declares (FR/NFR/BR/CON) instead of milestones:

- open review findings, in the ledger field `Routed to`, when the package was approved with them open;
- human tasks, in `quality-attributes.md` as `human task: <who> confirms <task>`;
- in a retroactive package, code-to-design drifts, in the brief's drift list.

While planning, copy each one into the "Stop if" of every milestone that covers its requirement IDs, as "stop while F-### is open", "stop until <who> confirms <task>", or "fixes drift <id>". This section is the single source of the routing rule; other skills point here.

Every MVP FR from PRD §12 appears in at least one slice. The package verifier checks it.

### Architecture rules

Each row of the "Architecture rules" section of `quality-attributes.md` becomes a `TST-*` in the milestone that first creates the boundary or budget it guards: a test that fails when the rule is broken, such as an import check between modules or a size or latency budget. The plan cites the rule; the rule's text stays in `quality-attributes.md`.

### Open decisions

A decision the plan needs from the user (an order, a cut, an exit when a milestone's evidence is not conclusive) is explained as `designing-system` "Explain Decisions" describes before asking, and recorded with the user's quote in the milestone it affects. A decision that changes product behavior is not a plan decision: it opens a new baseline.

## 4. Dependencies

Make dependencies explicit. Prefer a sequence that keeps each slice independently verifiable and reduces long-lived partial architecture.

## 5. Execution Handoff

The plan is designed for one-slice-at-a-time execution:

```text
select M01
 -> compact-change-skills:implementing-change
 -> compact-change-skills:verifying-change
 -> select M02
```

Implementation agents receive only:

- selected slice;
- `manifest.yaml`;
- canonical authorities relevant to that slice;
- current repository evidence.

Do not pass the entire design conversation.

## 6. Status

The plan stores no status, neither for itself nor per milestone.

- **Milestone status** is the fixed header of the milestone's `verification.md` in its change folder (manifest `change_folders`). A milestone is done when its header reads `Verdict: Pass` and `Acceptance: Accepted`. This is informational only: an approval given in chat may still show `Pending`, so nothing automatic depends on it. The plan template carries the command that lists them.
- **Changes since approval** come from git: find the approval commit with `git log -1 --format=%H -S'status: approved' -- docs/spec/manifest.yaml`, then list later changes with `git log --oneline <sha>.. -- docs/product docs/design`. Without version control, record that later changes cannot be verified.

## 7. Output

Write `docs/build/plan.md`. It names the baseline it plans (`RV-n`), never a version of another artifact.

Then rebuild the package view with `node <designing-system skill directory>/scripts/render-package.mjs <repository root>`, so `docs/site/<project>-architecture.html` includes the plan.
