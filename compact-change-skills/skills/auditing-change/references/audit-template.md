# Large Change Audit Template

```markdown
# <Change name> Audit

Status: Ready for specification | Ready after explicit decisions | Requires targeted follow-up audit | Blocked | Escalate
Size: large
Reliability: lean | strict | critical

## Baseline
| Field | Value |
|---|---|
| Repository root | |
| Branch | |
| Commit SHA | |
| Working tree | Clean / Dirty |
| Relevant pre-existing changes | |
| Audit date | |

## Desired Outcome and Constraints
- Outcome: <observable result>
- Included: <scope>
- Excluded: <non-goals>

## Current Behavior Trace
1. `<path>:<symbol>` — <entry/trigger>
2. `<path>:<symbol>` — <flow>
3. <observable current result>

## Relevant Surface
| Path / Area | Role | Evidence | Confidence |
|---|---|---|---|
| | | | High/Medium/Low |

## Actual Problem / Change Location
<Repository-grounded explanation.>

## Contracts and Boundaries
| Contract / Boundary | Current Shape | Consumers | Change Risk |
|---|---|---|---|
| | | | Low/Medium/High |

## Tests and Validation
| Test / Command | Covers | Gap | Prerequisite |
|---|---|---|---|
| | | | |

## Candidate Ownership
| Workstream | May Read | Candidate Write Set | Coupling / Conflict Risk |
|---|---|---|---|
| | | | |

## Integration and Generated-File Hotspots
| File / Area | Why Shared | Required Control |
|---|---|---|
| | | |

## Supported Options
| Option | Evidence | Pros | Cons | Approval Status |
|---|---|---|---|---|
| | | | | Not approved |

## Material Decisions Needed
| ID | Decision | Why It Matters | Supported Options | Blocking? |
|---|---|---|---|---|
| DEC-Q1 | | | | Yes/No |

## Assumptions
| ID | Assumption | Validation | Stop If False |
|---|---|---|---|
| ASM-1 | | | |

## Contradictions and Risks
- <item or None>

## Do Not Touch
- <path / behavior>

## Recommended Next Step
<Write spec / obtain decisions / targeted audit / escalate>
```
