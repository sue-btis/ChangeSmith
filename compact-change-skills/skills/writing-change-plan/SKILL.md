---
name: writing-change-plan
description: Write Change Plan. Convert an approved specification whose plan trigger fired (parallel writers, or ordered migration/rollout across sessions) into an executable dependency-aware plan. For large changes, define true dependencies, optional Gate 0 contract materialization, execution topology, exact write-set ownership, waves, integration gates, generated-file ownership, fallback order, checks, evidence, and stop conditions.
---

# Write an Executable Change Plan

Read `references/plan-template.md`.

## Preconditions

Require:

- `spec.md` status `Ready for planning`;
- the plan trigger in `shaping-change/references/change-sizing.md` fired;
- no open blocker;
- observable acceptance criteria;
- current repository baseline available;
- `audit.md` when the spec cites one.

Verify current root, branch, base commit, working tree, named contracts, expected paths, and validation commands before finalizing the plan.

If the repository changed materially since the audit/spec baseline, mark the plan `Blocked` or `Stale` rather than silently adapting frozen requirements.

## Medium Planning

A medium plan carries one structural criterion: parallel writers on disjoint write sets, or a migration/rollout ordered across sessions. Create two to six vertical tasks. When writers run in parallel, also apply the topology and ownership rules of Large Planning.

Each task includes:

- requirement/acceptance ownership;
- dependencies;
- expected edit areas;
- canonical artifact updates assigned to the same task or an explicit integration owner;
- tests/checks;
- evidence;
- stop conditions.

Order the tasks that do not run in parallel sequentially.

## Large Planning

Record in the plan header the structural criteria that make the change large.

### 1. Dependency Graph

Separate:

- true dependencies;
- artificial dependencies removable by a frozen contract artifact;
- integration-only couplings.

### 2. Gate 0

Gate 0 is optional.

Use it only to materialize an already frozen fixture, schema, interface, stub, manifest, or test input that safely unlocks downstream work.

Gate 0 may not redesign or extend the spec.

### 3. Execution Topology

Choose exactly one:

- isolated worktrees with bounded workstreams;
- one working tree with proven disjoint write sets;
- single-agent sequential execution;
- do not implement yet.

Do not recommend concurrent writers when exact write sets, including generated files and lockfiles, are not provably disjoint.

### 4. Ownership

Every workstream must define:

- repository;
- assigned `REQ-*`;
- may-read paths;
- exact may-edit paths or tightly bounded path patterns;
- integration-reserved files;
- forbidden paths;
- generated/migration/project/lockfile ownership;
- canonical design artifact ownership;
- checks;
- required evidence;
- stop conditions.

Shared mutable files get one writer or are integration-owned.

### 5. Waves

Prefer acceptance-driven vertical waves.

Each wave must end with an integration gate that:

- inspects the actual combined diff;
- checks ownership compliance;
- verifies contract consistency;
- runs combined tests/checks;
- maps completion to `REQ-*`, `AC-*`, and `TST-*`.

### 6. Fallback

Always include a real sequential fallback. Never simulate unavailable subagents.

## Readiness

The plan is ready only when:

- every requirement has an implementation owner;
- every acceptance and test item is scheduled;
- dependency order is executable;
- shared files have explicit ownership;
- topology is safe;
- final verification commands are known or explicitly blocked;
- no task depends on an unapproved decision.

Save as `<change-folder>/plan.md`.
