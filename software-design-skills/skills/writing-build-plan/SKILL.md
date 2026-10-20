---
name: writing-build-plan
description: Write Build Plan. Convert an approved greenfield design package into an executable sequence of small vertical slices that each deliver observable behavior, map product requirements to canonical contracts and tests, minimize cross-slice dependencies, prove architecture early, and can be handed one at a time to compact-change-skills for controlled implementation and independent verification.
---

# Write the Greenfield Build Plan

Read `references/build-plan-template.md`.

## Preconditions

Require:

- `docs/spec/manifest.yaml` status `approved`;
- design review verdict `Approved for build planning`;
- no blocking product/architecture decision;
- applicable canonical contract paths known.

Do not redesign the architecture while planning. If planning exposes a new material contradiction, return the manifest to `ready_for_review` for an explicit new baseline/full audit rather than silently reopening the previous verification loop.

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

## 6. Output

Write `docs/build/plan.md`.

Use one status:

- `Ready`
- `Blocked`
- `Stale`

A plan is `Stale` when the approved design package changed materially after planning.
