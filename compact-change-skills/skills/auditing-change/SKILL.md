---
name: auditing-change
description: Audit Software Change. Perform a focused read-only repository audit for every strict or critical change, and for a lean change whose evidence facts shaping could not establish, producing a compact authoritative audit of the current behavior, minimal relevant surface, contracts, consumers, tests, commands, candidate ownership, coupling, generated-file hotspots, contradictions, and unknowns.
---

# Audit a Software Change

Create persistent repository evidence before a change is specified.

Read `references/audit-template.md`.

## Preconditions

Use when the audit trigger in `shaping-change/references/change-sizing.md` fired: the change is `strict` or `critical`, or at least one evidence fact (entry point, covering tests, consumers of each altered contract) is `unknown`. Size does not decide it.

The audit is done when all three evidence facts are filled with repository evidence, or each remaining `unknown` is named as a blocking unknown with the exact area still to inspect, and the current code has been compared with every applicable canonical artifact the change touches. Past audits found their most valuable issues in that comparison: permission and tenant gaps, and code that contradicts its contract or design.

Do not use this skill as a global architecture survey unless the requested behavior is genuinely global.

## 1. Record Baseline

Record:

- repository root;
- branch;
- commit SHA;
- working-tree state;
- relevant pre-existing changes;
- audit date.

Do not reset, clean, restore, stash, or overwrite unrelated work.

## 2. Trace Current Behavior

Inspect only files needed to trace the requested behavior from entry point to observable result.

Identify:

- entry points and call/data flow;
- current behavior and actual problem location;
- minimal relevant file/area set;
- tests and validation commands;
- runtime prerequisites;
- public/shared contracts;
- data/schema/configuration boundaries;
- security/tenant/permission boundaries;
- generated artifacts, project files, migrations, and lockfiles;
- candidate read and write sets;
- integration-owned files and merge-conflict hotspots;
- canonical design manifest and relevant declared authorities, when present;
- any mismatch between current code behavior and those canonical artifacts.

Expand inspection only when imports, references, routes, tests, generated outputs, or configuration prove that the wider area is relevant.

## 3. Separate Evidence From Decisions

The audit may report supported implementation options, but it must not approve one.

Record:

- facts with path/symbol evidence;
- relevant canonical design facts with artifact/path evidence;
- contradictions with the requested outcome;
- assumptions requiring validation;
- blocking unknowns;
- supported options and trade-offs;
- material stakeholder decisions still required.

Never turn a recommendation into a frozen contract.

## 4. Assess Execution Shape

Determine whether:

- one writer can safely implement sequentially;
- workstreams can be separated;
- exact write sets can plausibly be disjoint;
- a shared frozen contract would remove artificial dependencies;
- a migration/rollout/integration owner will be required.

Do not declare parallel implementation safe merely because components are conceptually separate.

## 5. Output

Write `<change-folder>/audit.md`.

The artifact becomes the factual repository source for `writing-change-spec`.

Use exactly one readiness verdict:

- `Ready for specification`
- `Ready after explicit decisions`
- `Requires targeted follow-up audit`
- `Blocked`
- `Escalate`

A targeted follow-up audit must name the exact missing fact and the exact area to inspect.
