---
name: writing-change-spec
description: Write Change Spec. Produce a proportional implementation-ready specification for quick, medium, or large software changes. For large work, use the audit as repository truth, freeze only approved decisions, assign stable requirement and acceptance IDs, preserve provenance, and self-review the same spec before approval.
---

# Write a Proportional Change Spec

Treat `spec.md` as the behavioral and contract authority for implementation.

Read `references/spec-template.md`.

## 1. Inputs and Precedence

For quick/medium:

1. explicit user request and decisions;
2. repository evidence gathered by shaping;
3. applicable canonical design authorities discovered through the manifest, when present;
4. clearly labeled assumptions.

For large:

1. explicit approved stakeholder decisions;
2. `audit.md` for repository facts;
3. original requested outcome and constraints;
4. recommendations only as non-authoritative context.

If a blocking decision is not approved, do not invent it. Mark the spec `Blocked`.

## 2. Quick Spec

Keep it compact.

Include:

- one observable goal;
- included/excluded scope;
- repository evidence;
- acceptance checks;
- relevant change surface;
- quality obligations;
- short implementation outline;
- canonical artifacts affected, if any;
- stop conditions.

A separate plan is normally unnecessary.

## 3. Medium Spec

Use stable `R-*` and `AC-*` IDs when traceability matters.

Freeze:

- required behavior;
- changed/preserved contracts;
- compatibility expectations;
- decisions and assumptions;
- risk controls;
- executable verification obligations;
- canonical artifacts affected and required synchronization.

State whether `plan.md` is required and why.

## 4. Large Spec

Use stable:

- `REQ-*`
- `AC-*`
- `TST-*`
- `DEC-*` when decisions materially affect contracts

Every requirement must have provenance from audit evidence or an explicitly approved decision.

Include:

- final observable goal;
- included and excluded scope;
- required behavior;
- architecture/contract decisions actually approved;
- exact changed/preserved API, data, config, UI, security, tenant, permission, compatibility, migration, and rollout behavior where relevant;
- expected areas, with confidence rather than invented certainty;
- test requirements;
- acceptance criteria;
- requirement traceability;
- stop conditions preventing implementation-time redesign;
- canonical artifacts that must remain unchanged, change together with code, or be superseded by an explicitly approved ADR/decision.

Remove obsolete alternatives and discussion from the final spec.

## 5. Self-Review and Freeze In Place

Do not create separate draft, review, or frozen copies.

Before approval, review the same `spec.md` for:

1. behavior vs activity wording;
2. complete observable acceptance coverage;
3. provenance;
4. facts vs assumptions;
5. unapproved recommendations;
6. contract consistency;
7. security/tenant/compatibility behavior where relevant;
8. executable validation;
9. canonical design synchronization;
10. scope exclusions;
11. missing stakeholder decisions.

Revise the same file until the status is correct.

Use exactly one status:

- `Ready for implementation`
- `Ready for planning`
- `Blocked`
- `Escalate`

Large changes should normally end `Ready for planning`.

## 6. Context Boundary

Implementation agents should not need the audit conversation. They should receive `spec.md` plus only the relevant plan section.

Save as `<change-folder>/spec.md`.
