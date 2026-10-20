# Verification Template

```markdown
# <Change name> Verification

Verdict: Pass | Pass with accepted limitations | Fail | Blocked
Size: quick | medium | large
Reliability: lean | strict | critical

## Audit Baseline
| Field | Value |
|---|---|
| Repository | |
| Declared base | |
| Audited head / working tree | |
| Diff range | |
| Verification date | |

## Requirement Compliance
| Requirement / AC | Implementation Evidence | Independent Check | Result |
|---|---|---|---|
| REQ-001 / AC-001 | | | Pass/Fail/Blocked |

## Automated Checks
| Command / Check | Result | Covers | Evidence / Notes |
|---|---|---|---|
| | Pass/Fail/Not run | | |

## QA
1. <step>
Expected: <result>
Actual: <result>

## Ownership and Scope
| Workstream | Assigned Write Set | Actual Files | Compliant? |
|---|---|---|---:|
| | | | Yes/No/Partial |

## Contract / Integration Review
- Frozen contract fidelity:
- Integration gate:
- Generated/migration/project/lockfile review:

## Quality Metrics
- Changed-line coverage:
- Changed-branch coverage:
- Mutation scope/score:
- Flaky/skipped tests affecting scope:

## Missing / Partial Requirements
- <None or details>

## Extra / Unrequested Changes
- <None or details>

## Security / Tenant / Permission / Compatibility Concerns
- <None or details>

## Limitations or Deviations
- <None or accepted limitation + authority>

## Canonical Design Synchronization
| Artifact | Expected | Observed | Status |
|---|---|---|---|
| | | | Pass/Fail/N/A |

## Merge Risk
Low | Medium | High

Reason:
<concise rationale>
```
