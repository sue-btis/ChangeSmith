---
name: reconciling-system-design
description: Reconcile System Design. Use when a design review left the package in needs_reconciliation. Resolve the bounded BLOCKER and MAJOR findings from an existing design-review ledger by editing only the owning canonical artifacts and their directly affected authorities, preserving product intent, recording a precise change set, and handing the package back for follow-up verification rather than performing another review.
---

# Reconcile the System Design

Read `references/reconciliation-checklist.md`.

## Purpose

This skill is the **design correction writer** between review passes.

It does not discover a fresh backlog of problems and it does not approve its own work. It resolves findings already recorded by `reviewing-system-design`, then returns the changed package for independent follow-up verification.

## Preconditions

Require:

- `docs/spec/manifest.yaml` status `needs_reconciliation`;
- `docs/design/review.md` with a current baseline and stable finding IDs;
- access to every canonical authority needed to resolve the open findings.

If the review ledger is missing, malformed, or contains no actionable `BLOCKER`/`MAJOR` finding, stop rather than inventing work.

## 1. Select the Bounded Work Set

Resolve only findings that are:

- severity `BLOCKER` or `MAJOR`; and
- status `OPEN`.

Non-blocking `MINOR` and `NOTE` findings may be left as design debt unless the user explicitly asks to address them. Do not expand them into new architecture work.

If a finding is `BLOCKED` because it requires stakeholder/product judgment, do not invent the decision. Set manifest status `blocked` and preserve the exact decision request.

## 2. Respect Canonical Ownership

For each finding:

1. identify the owning canonical artifact from the ledger;
2. change that authority rather than adding reconciliation prose elsewhere;
3. update directly affected canonical authorities only when necessary to preserve semantic consistency;
4. preserve PRD product intent; edit the PRD only when a decided PRD §15 row authorizes the change, and cite its PD ID in the change set;
5. do not create a new artifact merely to avoid editing the actual owner.

Use the smallest coherent change set that satisfies the finding's required resolution.

## 3. Impact Cone

Before editing, identify the direct impact cone for each finding.

Examples:

```text
OpenAPI behavior change
  -> domain invariant if semantics changed
  -> DBML if persistence constraints changed
  -> architecture boundary only if responsibility changed
```

```text
Domain lifecycle correction
  -> DBML constraints if persistent
  -> API/event state representations
  -> UX flow only when user-observable behavior changes
```

Do not opportunistically redesign unrelated areas.

## 4. No Self-Review

After editing:

- do not perform a comprehensive review;
- do not create new findings;
- do not mark a finding `RESOLVED` based only on your own correction;
- change each attempted finding from `OPEN` to `READY_FOR_VERIFICATION` and record the changed paths plus expected verification evidence.

Independent verification belongs to `reviewing-system-design`.

## 5. Reconciliation Cycle Budget

Increment the reconciliation cycle count in `docs/design/review.md` exactly once per invocation that changes canonical artifacts. The ledger is the only place that holds it.

Maximum automatic reconciliation cycles per baseline: `3`.

If the next cycle would exceed the maximum while blocking findings remain, do not continue editing. Set manifest status `escalate` and record why human/stakeholder architectural judgment is required.

## 6. Output State

After a coherent correction pass:

- record the exact change set in `docs/design/review.md` cycle history;
- set attempted findings to `READY_FOR_VERIFICATION`;
- set `docs/spec/manifest.yaml` status to `ready_for_verification`.

Use `blocked` when a required stakeholder decision prevents correction.

Use `escalate` when the cycle budget is exhausted or findings cannot be reconciled without reopening foundational product/architecture choices.

Do not set manifest status `approved` in this skill.
