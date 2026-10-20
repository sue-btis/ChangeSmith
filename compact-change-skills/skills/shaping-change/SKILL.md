---
name: shaping-change
description: Shape Software Change. Inspect a repository-grounded software request, resolve only material ambiguity, classify size and reliability, decide which artifacts their triggers require, and route it through the smallest safe specification, audit, planning, implementation, and verification workflow.
---

# Shape a Software Change

Choose the smallest workflow that can safely carry the request from intent to verified diff.

Read `references/change-sizing.md` before classification.

## 1. Establish Initial Repository Evidence

Inspect only enough repository surface to determine:

- where the requested behavior enters and flows;
- likely files, symbols, tests, contracts, and commands;
- whether the suspected area is correct;
- whether unrelated working-tree changes overlap likely edits;
- whether the repository declares a canonical design manifest or authoritative product/architecture/API/data/UX artifacts relevant to the request;
- whether the request amends a change that is already implemented.

Separate facts, assumptions, user decisions, and recommendations. Never invent paths, commands, contracts, architecture, or ownership.

This step is done when each of the three evidence facts in `change-sizing.md` is filled with evidence or marked `unknown`. A `strict` or `critical` change, or any `unknown`, routes to `auditing-change`; do not perform a pseudo-global audit inside this skill.

## 2. Audit Material Decisions

Identify decisions affecting:

- observable behavior;
- scope and explicit exclusions;
- API/data/config/UI contracts;
- compatibility and rollout;
- permissions, tenancy, privacy, or destructive behavior;
- migration/recovery;
- testability or acceptance.

Resolve repository-answerable questions through inspection. When a canonical design manifest exists, inspect only the relevant declared authorities and treat them as governing design context unless repository evidence proves they are stale or contradictory.

Ask only when a material stakeholder decision remains. Ground every question in evidence and provide supported options when possible. A recommendation is not approval.

Do not create implementation requirements from an unanswered blocking decision.

## 3. Classify and Decide Artifacts

Classify size as exactly one of `quick`, `medium`, `large`, `escalate`, and reliability as exactly one of `lean`, `strict`, `critical`. Use the highest applicable risk level. File counts are heuristics, never quotas.

Then apply each artifact trigger in `change-sizing.md` independently and record which fire. Size picks the spec template; it never adds an artifact.

## 4. Route

Run the stages whose artifacts were triggered, in this order:

1. `auditing-change` — when the audit trigger fired;
2. `writing-change-spec` — always;
3. `writing-change-plan` — when the plan trigger fired;
4. `implementing-change` — always;
5. `verifying-change` — always.

An amendment to an already implemented change becomes a new change folder whose spec names the earlier folder as its parent.

### Escalate
Stop before implementation. State the exact condition that prevents safe bounding and what authority, repository evidence, contract, or ownership boundary is missing.

## 5. Context-Control Rule

Do not propagate the full conversation through the workflow.

The handoff from shaping to the next stage contains only:

- desired observable outcome;
- known constraints and exclusions;
- suspected area and the three evidence facts;
- material decisions already approved;
- unresolved blockers;
- size, reliability, and triggered artifacts.

## Output

State:

- size and reliability, each with its rationale;
- each artifact trigger that fired, and why;
- the route and the change folder;
- approved decisions already known;
- assumptions the next stage must verify;
- canonical design authorities discovered, if any;
- parent change, if this is an amendment;
- unresolved blocker, if any.

Do not implement code while shaping unless the user explicitly requests combined execution and the classification is quick.
