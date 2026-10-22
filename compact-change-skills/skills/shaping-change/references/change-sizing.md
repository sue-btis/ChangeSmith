# Change Sizing and Artifact Triggers

Three independent decisions:

- **Size** labels the scope and picks the spec template.
- **Artifacts** beyond `spec.md` and `verification.md` each have their own trigger. Size never adds an artifact.
- **Reliability** sets the verification gates.

## Size

### Quick

Use `quick` when all are true:

- one observable behavior change or one tightly coupled defect;
- one subsystem and a bounded surface, typically up to about three production files plus tests;
- no contract, migration, rollout, or trust-boundary change;
- one writer can finish it in one sitting.

### Medium

Use `medium` for every bounded change that is not quick and not large. That covers several behaviors, or API, persistence, schema, configuration, UI, or compatibility changes.

A broad change executed by one writer in sequence is medium, however many files it touches.

### Large

Use `large` only when **at least two** of these structural criteria hold, and `plan.md` records at least one of them:

- two or more writers work at the same time (subagents, worktrees, people);
- a shared contract is frozen before parallel work starts;
- a migration or rollout lands in separately deployed stages.

Surface breadth, file count, critical reliability, an audit, or a long dependency chain alone do not make a change large.

### Escalate

Use `escalate` only when the work cannot be safely bounded by this workflow:

- program-level redesign with no frozen target architecture;
- multiple repositories or teams with unresolved authority or ownership;
- destructive migration or security boundary whose policy is not approved;
- repository evidence cannot locate or explain the requested behavior;
- coupling remains unknown after a focused audit;
- the requested outcome requires product or architecture decisions not owned by the current decision maker;
- no safe write boundary or verification strategy can be defined;
- implementation would require overwriting unrelated user work.

A dependency on another repository whose owner and contract are clear is not an escalation. Record it in the spec's "Other Repositories" section.

## Artifact Triggers

Always: `spec.md` and `verification.md`.

### `audit.md`

Create it when either holds:

- reliability is `strict` or `critical`; or
- shaping cannot fill all three **evidence facts** with repository evidence:
  1. the entry point of the behavior, as `path:line`;
  2. the tests that cover it, or `none`;
  3. for each contract the change alters, its consumers in this repository, with the method that produced the list.

Find entry points and consumers with the LSP tool (`findReferences`, `incomingCalls`, `goToImplementation`) when a language server answers for that file: it resolves the symbol, so same-named functions and fields in other types do not inflate the list. A freshly started server often returns only the declaration; retry before concluding there are no consumers. Where no server answers (for example SQL or shell), use a text search and record it as `grep`, because that list may include unrelated matches or miss dynamic uses.

For a `lean` change, only an `unknown` evidence fact triggers the audit. Consumers in other repositories go to the spec's "Other Repositories" section and do not trigger it.

Strict and critical changes always get one because, across 61 past audits, 56 found something that changed the spec, mostly contradictions between code and design artifacts that the three evidence facts would not reveal; every audit of a critical change found a permission, tenant, or contract issue.

### `plan.md`

Create it when:

- more than one writer works at the same time; or
- a migration or rollout step must land before another, across sessions.

A large change always has a plan, because the plan records its structural criteria.

### `execution.md`

Create it when the work has a **handoff**: someone other than the current session picks it up. That happens when:

- the implementer is a different tool or session from the verifier;
- the implementation continues in a later session;
- waves hand their work to an integration owner.

Without a handoff, the baseline, deviations, and correction rounds go in `verification.md`.

## Reliability Axis

Choose independently:

- `lean`: low-risk behavior with straightforward rollback.
- `strict`: shared contracts, regressions, important business logic, persistence, or non-trivial integration.
- `critical`: authorization, money, destructive operations, sensitive data, concurrency correctness, tenant isolation, irreversible migration, or explicit high-assurance work.

Never downgrade an explicit reliability request.

## Effort

Record `Implementation effort:` in the spec. The default is `medium` for every stage. Use `high` for implementation only with a `critical` profile, concurrency or migration work, or the round after a `Fail`; use it for verification with `critical` or a `large` change with frozen contracts. Never go above `high` by default. Effort buys thoroughness on a well-specified task; on an open question it buys unrequested changes.
