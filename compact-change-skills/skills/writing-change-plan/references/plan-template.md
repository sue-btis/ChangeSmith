# Implementation Plan Template

```markdown
# <Change name> Implementation Plan

Status: Ready | Blocked | Stale
Size: medium | large
Reliability: lean | strict | critical
Base: `<branch>@<commit>`

## Preflight Baseline
- Working tree:
- Spec: `spec.md`
- Audit: `audit.md` | N/A
- Required commands/tools:
- Relevant overlaps:

## Dependency Graph

### True Dependencies
| ID | Dependency | Why It Must Precede | Unlocks |
|---|---|---|---|
| D-001 | | | |

### Artificial Dependencies Removable by Gate 0
| ID | Coupling | Frozen Artifact | Unlocks |
|---|---|---|---|
| A-001 | | | |

If none, write `None.`

## Execution Strategy
Topology: Isolated worktrees | Shared tree with disjoint writes | Sequential | Do not implement

Reason:
<why safe>

## Gate 0
Required: Yes / No

Goal:
<materialize frozen contract only>

| Artifact | Frozen Shape | Requirement IDs | Owner | May Edit | Check |
|---|---|---|---|---|---|
| | | | | | |

Stop if:
- materialization would require a new design decision.

## Ownership Map
| Workstream | Mode | REQ IDs | May Read | May Edit | Integration-Reserved | Must Not Edit | Depends On |
|---|---|---|---|---|---|---|---|
| WS-1 | write / read-only verify / integration | | | | | | |

## Canonical Design Artifact Ownership
| Artifact | Owner | Update / Preserve | Validation |
|---|---|---|---|
| | | | |

If none, write `None.`

## Generated / Migration / Project / Lockfile Ownership
| File / Pattern | Owner | When It May Change | Validation |
|---|---|---|---|
| | | | |

If none, write `None.`

## Wave 1 — <acceptance-driven name>

Goal:
- Requirements:
- Acceptance:

### Workstream WS-1 — <name>
- Assigned requirements:
- May read:
- May edit:
- Integration-reserved:
- Must not edit:
- Steps:
  1. <test/regression/contract first where practical>
  2. <minimal implementation>
  3. <scoped checks>
- Checks:
- Evidence:
- Stop conditions:

### Wave 1 Integration Gate
- Owner:
- May edit:
- Must inspect: actual combined diff, ownership, contracts
- Checks:
- Completion criteria:
- Stop conditions:

## Wave 2
<repeat only when required; otherwise `No second wave required.`>

## Single-Agent Fallback
1. <Gate/workstream>
2. <integration gate>
3. <next wave>

Reason:
<dependency-safe order>

## Requirement Execution Matrix
| Requirement | Wave / Gate | Implementation Owner | Integration Owner | Acceptance | Tests |
|---|---|---|---|---|---|
| REQ-001 | | | | AC-001 | TST-001 |

## Final Verification
| Command / Check | Covers | Environment | Required Evidence |
|---|---|---|---|
| | | | |

## Global Stop Conditions
- Frozen spec and repository contradict each other.
- Planned base or relevant paths changed enough to stale the plan.
- Existing user work overlaps a required write set.
- A workstream needs to write outside ownership.
- Two writers collide on a non-integration-owned file.
- A generated file, migration, project file, or lockfile lacks an owner.
- A required decision is missing.
- A required contract/security/tenant/compatibility behavior is ambiguous.
```
