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

When a plan exists, use its workstream packets. Do not feed the full audit or prior conversation to each writer unless a specific fact is necessary and not already represented in the frozen spec/plan.

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
- relevant canonical authorities and their expected synchronization;
- the baseline the verifier will diff against: base commit plus the list of untracked files, or, without version control, the list of files to touch with their pre-change state.

In build-slice mode, also check that the slice is complete: no open decision, and every contract, UI composition, and acceptance item it needs is approved in the canonical authorities. If something is missing, stop before editing and route to `writing-change-spec` to freeze it; a missing stakeholder decision makes that spec `Blocked`.

Record the full preflight once. For each later task, wave, or round, record only what changed since.

Classify the preflight:

- `Safe`
- `Safe sequentially only`
- `Stale`
- `Blocked`
- `Spec contradicts repository`

Stop before editing on `Stale`, `Blocked`, or contradiction. A contradiction includes an approved spec/build slice disagreeing with an applicable canonical authority without an approved decision that supersedes it.

Never use destructive Git commands to force the workspace to match the plan.

## 3. Execute Only the Selected Scope

Without a plan, execute the spec's implementation outline.

With a plan, execute only the selected task, workstream, wave, or integration gate.

A writer may edit only its explicit write set.

If an unowned generated file, migration, project file, or lockfile changes, stop and report.

If a required out-of-scope change appears, stop and return to specification/planning rather than broadening scope.

Do not delete, skip, disable, or weaken an existing test or assertion (looser matcher, removed case, raised tolerance, added retry or timeout) unless the spec records that decision. A test that blocks the change is a finding to report, not an obstacle to remove.

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

Run implementation at the effort the spec records in `Implementation effort:`. The default is `medium`. Use `high` only for a `critical` profile, concurrency or migration work, or the round after a `Fail`. Never go above `high`: more effort does not fix an unclear spec.

## 6. Integration Gates

The integration owner must:

- inspect the actual combined diff;
- check write-set compliance;
- resolve only explicitly reserved integration wiring;
- run combined checks;
- map wave completion to requirements and acceptance criteria.

Agent summaries are not sufficient evidence.

## 7. Execution Record

Write `<change-folder>/execution.md` when the work has a handoff, as defined in `shaping-change/references/change-sizing.md`. Without a handoff the change is self-verified, and its baseline, deviations, and correction rounds go in `verification.md`.

Use statuses:

- `Completed`
- `Implemented — verification blocked`
- `Partial`
- `Blocked before editing`
- `Blocked after partial editing`

Do not mark completed if any assigned requirement is partial, failed, or unverified without an explicitly allowed limitation.

The execution status describes the implementation only. The current state of the change lives in the header of `verification.md`; final readiness is decided by `verifying-change`.

## 8. Correction Rounds

After `verifying-change` returns `Fail`, or `Blocked` for any reason other than `reconsider approach`:

1. fix only the open findings of type *defect*, or the blocker named in the verdict;
2. leave findings of type *decision* to the user;
3. record the work as `Round N` in `execution.md`, or in the next verification pass when there is no `execution.md`: finding IDs addressed, files changed, checks run, and the new diff range;
4. return to `verifying-change` for a follow-up pass.

A round is done when every addressed finding has its fix and its check recorded.

A change gets at most three correction rounds. A `Blocked` with `reconsider approach` means the cap was reached: stop fixing, because the approach or the spec is wrong, and return to `writing-change-spec` or `shaping-change`.

Findings of type *pre-existing* are not fixed in a correction round unless the user asks.
