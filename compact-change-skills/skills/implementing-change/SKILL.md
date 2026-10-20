---
name: implementing-change
description: Implement Software Change. Execute a quick, medium, or large software change against its approved spec with a mandatory repository preflight, bounded write sets, test/regression-first evidence where practical, staged workstream or wave execution, integration gates, safe handling of unrelated changes, and an auditable execution record.
---

# Implement a Software Change

Implementation is controlled execution, not a design phase.

Read `references/execution-protocol.md`.

## 1. Establish Governing Inputs

Use exactly one governing package:

**Change package**
- `spec.md`;
- `plan.md` when the spec says planning is required.

**Approved greenfield build slice**
- canonical design `manifest.yaml`;
- the product/technical authorities named by that manifest that are relevant to the selected slice;
- `build/plan.md` (or equivalent) with one explicitly selected slice/milestone and its acceptance/tests.

Both modes require current repository access. Do not redesign a greenfield slice inside this skill.

For large changes, use `plan.md` workstream packets. Do not feed the full audit or prior conversation to each writer unless a specific fact is necessary and not already represented in the frozen spec/plan.

## 2. Mandatory Preflight

Before editing, record and compare:

- repository root;
- branch;
- planned base vs current commit;
- working-tree state;
- existing overlapping changes;
- expected files/contracts;
- validation commands and prerequisites;
- planned ownership boundaries;
- relevant canonical authorities and their expected synchronization.

Classify the preflight:

- `Safe`
- `Safe sequentially only`
- `Stale`
- `Blocked`
- `Spec contradicts repository`

Stop before editing on `Stale`, `Blocked`, or contradiction. A contradiction includes an approved spec/build slice disagreeing with an applicable canonical authority without an approved decision that supersedes it.

Never use destructive Git commands to force the workspace to match the plan.

## 3. Execute Only the Selected Scope

For quick changes, execute the spec's implementation outline.

For planned medium/large changes, execute only the selected task, workstream, wave, or integration gate.

A writer may edit only its explicit write set.

If an unowned generated file, migration, project file, or lockfile changes, stop and report.

If a required out-of-scope change appears, stop and return to specification/planning rather than broadening scope.

When the governing package declares canonical artifacts affected by the work, update them in the same controlled execution or through their explicit integration owner. Do not leave knowingly stale authoritative design artifacts behind.

## 4. Behavioral Evidence

For defects, reproduce with a regression test when practical.

For stable branching behavior:

1. define the observable behavior;
2. add/update a focused failing test when practical;
3. observe the expected failure;
4. implement minimum behavior;
5. pass focused checks;
6. refactor;
7. run required broader checks.

Do not claim red-green evidence that did not occur.

## 5. Subagents and Parallel Work

Use runtime subagents only when the plan permits them.

Parallel writers require:

- frozen contracts;
- disjoint exact write sets;
- explicit ownership of generated/lock/project/migration files;
- independent scoped checks;
- an integration owner.

If unavailable, use the plan's sequential fallback. Never simulate agents that were not run.

## 6. Integration Gates

The integration owner must:

- inspect the actual combined diff;
- check write-set compliance;
- resolve only explicitly reserved integration wiring;
- run combined checks;
- map wave completion to requirements and acceptance criteria.

Agent summaries are not sufficient evidence.

## 7. Execution Record

For large changes, always write/update `<change-folder>/execution.md`.

For medium changes, write it when implementation spans multiple tasks/sessions/agents or when a persistent handoff is useful.

For quick changes, it may be omitted if all evidence fits naturally in `verification.md`.

Use statuses:

- `Completed`
- `Implemented — verification blocked`
- `Partial`
- `Blocked before editing`
- `Blocked after partial editing`

Do not mark completed if any assigned requirement is partial, failed, or unverified without an explicitly allowed limitation.

Final merge readiness is decided by `verifying-change`, not this skill.
