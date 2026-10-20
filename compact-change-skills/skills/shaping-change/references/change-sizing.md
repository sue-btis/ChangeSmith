# Change Sizing and Routing

Use size and reliability as separate axes.

## Quick

Use `quick` when all are true:

- one observable behavior change or tightly coupled defect;
- one subsystem and a bounded surface, typically up to about three production files plus tests;
- no migration, breaking contract, broad rollout, unresolved trust boundary, or cross-workstream dependency;
- implementation can be expressed as a short ordered checklist;
- focused inspection leaves no material design branch unresolved.

Required artifacts: `spec.md`, `verification.md`.

A separate `plan.md` is normally unnecessary.

## Medium

Use `medium` when the work remains bounded and any are true:

- several behavior slices;
- multiple components with a real dependency order;
- API, persistence, schema, configuration, UI, or compatibility changes;
- roughly two to six independently verifiable tasks;
- rollout, migration, integration, or observability is non-trivial but still localized;
- a strict or critical reliability profile materially changes execution.

Required: `spec.md`.

Add `plan.md` when sequencing, review boundaries, migration, rollout, ownership, or verification order is not obvious.

## Large

Use `large` when the change is still specifiable and ownable but any are true:

- multiple independently implementable workstreams;
- broad change surface across one or more subsystems;
- shared contracts must be frozen before parallel or staged work;
- a dependency graph or execution waves are needed;
- migrations, generated artifacts, project files, lockfiles, or integration hotspots need explicit ownership;
- implementation may use subagents/worktrees or requires a safe sequential fallback;
- the repository is too broad for ephemeral inspection and needs a persistent focused audit artifact;
- stale-plan risk is material between planning and implementation.

Required artifacts: `audit.md`, `spec.md`, `plan.md`, `execution.md`, `verification.md`.

Large does not automatically mean parallel. Default to sequential when write sets are not provably disjoint.

## Escalate

Use `escalate` only when the work cannot be safely bounded by this workflow, including:

- program-level redesign with no frozen target architecture;
- multiple repositories or teams with unresolved authority/ownership;
- destructive migration or security boundary whose policy is not approved;
- repository evidence cannot locate or explain the requested behavior;
- coupling remains unknown after focused audit;
- the requested outcome requires product or architecture decisions not owned by the current decision maker;
- no safe write boundary or verification strategy can be defined;
- implementation would require overwriting unrelated user work.

Do not use `escalate` merely because the change is large.

## Reliability Axis

Choose independently:

- `lean`: low-risk behavior with straightforward rollback.
- `strict`: shared contracts, regressions, important business logic, persistence, or non-trivial integration.
- `critical`: authorization, money, destructive operations, sensitive data, concurrency correctness, tenant isolation, irreversible migration, or explicit high-assurance work.

Never downgrade an explicit reliability request.
