---
name: auditing-change
description: Audit Software Change. Perform a focused read-only repository audit for a large bounded software change, producing a compact authoritative audit of the current behavior, minimal relevant surface, contracts, tests, commands, candidate ownership, coupling, generated-file hotspots, contradictions, and unknowns.
---

# Audit a Large Software Change

Create persistent repository evidence before a large change is specified.

Read `references/audit-template.md`.

## Preconditions

Use for `large` changes, or for a medium change when repository uncertainty is too high for a trustworthy spec.

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
