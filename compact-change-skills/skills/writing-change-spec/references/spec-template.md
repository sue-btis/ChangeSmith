# Change Spec Templates

Omit irrelevant sections. Do not leave generic placeholder prose.

## Quick

```markdown
# <Change name>

Status: Ready for implementation
Size: quick
Reliability: lean | strict | critical
Parent: <earlier change folder>   # only for an amendment
Triggered artifacts: none | audit.md (<strict, critical, or unknown evidence fact>) | execution.md (<handoff>)

Goal: <observable outcome>

Evidence facts:
- Entry point: `<path>:<line>`
- Covering tests: `<test path>` | none
- Consumers of altered contracts: <contract>: <consumers> — `<search command>` | no contract altered

Scope:
- Include: <change>
- Exclude: <non-goal>

Acceptance:
- <pass/fail behavior>
- <regression/boundary behavior>

Change surface:
- Expected: `<paths/areas>`
- Do not touch: `<paths/behavior>`

Canonical design:
- Affected authorities: <paths or None>
- Required synchronization: <update / preserve / supersede via approved decision>

Other repositories:   # only when a consumer or dependency lives elsewhere
- <repository>: <contract affected>; integration verified by <who/where>

Quality:
- Tests: <focused checks>
- Static/build: `<commands>`
- QA: <reproducible check>

Implementation:
1. <test/regression>
2. <minimal behavior>
3. <verification>

Stop if:
- <contradiction/overlap/new decision>
```

## Medium

```markdown
# <Change name>

Status: Ready for implementation | Ready for planning | Blocked | Escalate
Size: medium
Reliability: lean | strict | critical
Parent: <earlier change folder>   # only for an amendment

## Goal
<observable outcome>

## Evidence and Current Behavior
- Entry point: `<path>:<line>`
- Covering tests: `<test path>` | none
- Consumers of altered contracts: <contract>: <consumers> — `<search command>` | no contract altered
- `<path>:<symbol>` — <other relevant fact>

## Scope
Included:
- <change>

Excluded:
- <non-goal>

## Decisions and Assumptions
- Decision: <approved behavior>
- Assumption: <assumption>; stop if <false condition>

## Requirements and Acceptance
| ID | Required Behavior | Acceptance |
|---|---|---|
| R-1 | | AC-1: |

## Contracts and Risk Controls
- <only relevant items>

## Canonical Design Impact
- Manifest: `<path>` | None
- Update: <authoritative artifacts>
- Preserve: <authoritative artifacts>
- Supersede only with approved decision: <artifact/decision>

## Other Repositories
- <repository>: <contract affected>; integration verified by <who/where>

Omit when every consumer and dependency lives in this repository.

## Quality Obligations
- Tests:
- QA:
- Static/build:
- Coverage/mutation:

## Change Surface
- Expected edits:
- Do not touch:

## Triggered Artifacts
| Artifact | Fired? | Reason |
|---|---|---|
| audit.md | Yes/No | |
| plan.md | Yes/No | |
| execution.md | Yes/No | |

## Stop Conditions
- <condition>
```

## Large

```markdown
# <Change name>

Status: Ready for planning | Blocked | Escalate
Size: large
Reliability: lean | strict | critical
Large because: <at least two structural criteria; name the one plan.md records>
Triggered artifacts: plan.md | audit.md (<strict, critical, or unknown evidence fact>) | execution.md (<handoff>)
Evidence: `audit.md` at `<commit>` | no audit — entry `<path>:<line>`; tests `<path>` | none; consumers <contract>: <consumers> (`<search command>`)
Parent: <earlier change folder>   # only for an amendment

## 1. Goal
<final observable implementation goal>

## 2. Scope
### Included
- <item>

### Excluded
- <item>

## 3. Required Behavior
| Requirement ID | Requirement | Provenance | Acceptance IDs |
|---|---|---|---|
| REQ-001 | | Audit `<path>:<symbol>` / DEC-001 | AC-001 |

## 4. Frozen Decisions
| Decision ID | Approved Decision | Authority / Source | Affected Requirements |
|---|---|---|---|
| DEC-001 | | | REQ-001 |

If no stakeholder decision was required, write `None.`

## 5. Expected Change Areas
| Area / File | Expected Change | Evidence | Confidence |
|---|---|---|---|
| | | | High/Medium/Low |

## 6. Contracts
### Changed
- <API/data/config/UI/etc.>

### Preserved
- <compatibility/invariant>

## 7. Security, Tenant, Permission, and Compatibility
- <rules or None beyond existing behavior>

## 8. Migration, Rollout, and Recovery
- <only when applicable>

## 9. Test Requirements
| Test ID | Required Check | Covers | Required Evidence |
|---|---|---|---|
| TST-001 | | REQ-001 | |

## 10. Acceptance Criteria
| Acceptance ID | Observable Pass/Fail Condition | Covers |
|---|---|---|
| AC-001 | | REQ-001 |

## 11. Traceability
| Requirement | Acceptance | Tests |
|---|---|---|
| REQ-001 | AC-001 | TST-001 |

## 12. Canonical Design Impact
- Manifest: `<path>` | None
- Update with implementation: <authoritative artifacts>
- Preserve unchanged: <authoritative artifacts>
- Supersede only through approved `DEC-*`/ADR: <items>

### Other Repositories
- <repository>: <contract affected>; integration verified by <who/where> | None

## 13. Quality Obligations
- Reliability gates:
- Required integration/contract checks:
- Coverage/mutation:
- Risk-specific checks:

## 14. Explicit Assumptions
| Assumption | Provenance | Stop If False |
|---|---|---|
| | | |

If none, write `None.`

## 15. Implementation Stop Conditions
Implementation must stop rather than invent behavior if:
- repository evidence contradicts a frozen requirement;
- required files/flows do not exist;
- implementation requires excluded scope;
- a contract/security/tenant/compatibility decision is ambiguous;
- a requirement lacks enough information to implement;
- unrelated user changes overlap the required write set.
```
