---
name: writing-change-spec
description: Write Change Spec. Produce a proportional implementation-ready specification for quick, medium, or large software changes. Ground it in the evidence facts or the audit, freeze only approved decisions, assign stable requirement and acceptance IDs, preserve provenance, and self-review the same spec before approval.
---

# Write a Proportional Change Spec

Treat `spec.md` as the behavioral and contract authority for implementation.

Read `references/spec-template.md`. Size picks the template: quick, medium, or large.

## 1. Inputs and Precedence

Without `audit.md`:

1. explicit user request and decisions;
2. repository evidence gathered by shaping, including the three evidence facts;
3. applicable canonical design authorities discovered through the manifest, when present;
4. clearly labeled assumptions.

With `audit.md`:

1. explicit approved stakeholder decisions;
2. `audit.md` for repository facts;
3. original requested outcome and constraints;
4. recommendations only as non-authoritative context.

If a blocking decision is not approved, do not invent it. Mark the spec `Blocked`.

## 2. Every Spec

Every template carries:

- **Evidence facts**: entry point (`path:line`), covering tests or `none`, and the consumers of each altered contract with the search command that produced them. With an audit, cite the audit instead of repeating it.
- **Triggered artifacts**: which of audit, plan, and execution fired, and why.
- **Canonical design impact**: affected authorities and their required synchronization, or `None`.
- **Other repositories**, when a consumer or dependency lives outside this repository: repository, contract affected, and who verifies the integration.
- **Parent**, when the change amends an already implemented change: the earlier change folder.

IDs (`R-*`, `REQ-*`, `AC-*`, `TST-*`, `DEC-*`) are local to the change folder. Cite them from elsewhere as `<change-folder>#AC-1`.

## 3. Quick Spec

Keep it compact.

Include:

- one observable goal;
- included/excluded scope;
- acceptance checks;
- relevant change surface;
- quality obligations;
- short implementation outline;
- stop conditions.

## 4. Medium Spec

Use stable `R-*` and `AC-*` IDs when traceability matters.

Freeze:

- required behavior;
- changed/preserved contracts;
- compatibility expectations;
- decisions and assumptions;
- risk controls;
- executable verification obligations.

## 5. Large Spec

Record the structural criteria that make the change large (see `shaping-change/references/change-sizing.md`).

Use stable:

- `REQ-*`
- `AC-*`
- `TST-*`
- `DEC-*` when decisions materially affect contracts

Every requirement must have provenance from repository evidence, audit evidence, or an explicitly approved decision.

Include:

- final observable goal;
- included and excluded scope;
- required behavior;
- architecture/contract decisions actually approved;
- exact changed/preserved API, data, config, UI, security, tenant, permission, compatibility, migration, and rollout behavior where relevant;
- the contracts frozen before parallel work starts;
- expected areas, with confidence rather than invented certainty;
- test requirements;
- acceptance criteria;
- requirement traceability;
- stop conditions preventing implementation-time redesign.

Remove obsolete alternatives and discussion from the final spec.

## 6. Self-Review and Freeze In Place

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
11. missing stakeholder decisions;
12. evidence facts filled, or the audit cited;
13. `Done when` names a runnable end-to-end check, or says why none applies;
14. `Implementation effort` is `medium`, or `high` with its reason.

Revise the same file until the status is correct.

Use exactly one status:

- `Ready for implementation`
- `Ready for planning`
- `Blocked`
- `Escalate`

A change whose plan trigger fired ends `Ready for planning`.

The status is frozen at approval: it records readiness to implement. The current state of the change lives in the header of `verification.md`.

## 7. Context Boundary

Implementation agents should not need the audit conversation. They should receive `spec.md` plus only the relevant plan section.

Save as `<change-folder>/spec.md`.
