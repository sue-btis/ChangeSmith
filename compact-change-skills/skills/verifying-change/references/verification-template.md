# Verification Template

The first four lines after the title are the fixed header. They hold the current state of the change and must stay in this order and format. `Open limitations` lists the accepted limitations whose follow-up is not done yet; pending decisions belong in `Acceptance: Pending`. One command lists the state of every change in the repository:

```bash
grep -H -m4 -E '^(Verdict|Acceptance|Verified by|Open limitations):' docs/changes/*/verification.md
```

Replace `docs/changes` with the repository's own change folder when it uses another convention. Folders verified before 2.2 use other formats (`**Verdict:**`, `Veredicto vigente:`, `## Segunda pasada — veredicto:`, older verdicts such as `Pass with accepted limitations`); list the first verdict line of each with:

```bash
grep -H -m1 -iE 'verdict|veredicto' docs/changes/*/verification.md
```

and read each value as it is. In those files the first verdict line is usually, but not always, the current one.

```markdown
# <Change name> Verification

Verdict: Pass | Fail | Blocked
Acceptance: Pending — <what awaits the user> | Accepted — <who>, <date>, «<verbatim quote>»
Verified by: <other session or agent> (<effort>) | Self-verification (<reason or "requested by <user>, <date>">)
Open limitations: L-1, L-2 | None

Size: quick | medium | large
Reliability: lean | strict | critical

## Pass History
- Pass 1 (<date>): Fail — F-1, F-2 open.
- Pass 2 (<date>): Pass — F-1, F-2 fixed in Round 1.

## Baseline
| Field | Value |
|---|---|
| Repository | |
| Declared base | |
| Verified head / working tree | |
| Untracked before edits | <from execution.md or preflight; excluded from the diff> |
| Diff range | `git diff <base>` + `git ls-files --others --exclude-standard` minus untracked-before-edits; without version control, the files recorded at preflight |
| Verification date | |

## Deviations
- <None, or deviation from the spec with its reason; self-verified changes record the implementer's deviations here>

## Correction Rounds
<only for self-verified changes without execution.md: Round N — findings addressed, files changed, checks run, new diff range>
<At most three rounds. If the pass after Round 3 still has an open defect, the verdict is `Blocked` — reconsider approach.>

## Findings
| ID | Type | Finding | Evidence | Status |
|---|---|---|---|---|
| F-1 | defect / decision / pre-existing | <bug class>: <finding> | | Open / Fixed (Round N) / Accepted |

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
- Other repositories: <verified / open finding / not applicable>

## Quality Metrics
- Changed-line coverage: <value | no tool>
- Changed-branch coverage: <value | no tool>
- Mutation: <tool and score | manual: written / killed / equivalent / survivors>
- Flaky/skipped tests affecting scope:

## Accepted Limitations
| ID | Finding | Accepted by | Date | Follow-up |
|---|---|---|---|---|
| L-1 | F-2 | | | none / <new change folder> |

## Canonical Design Synchronization
| Artifact | Expected | Observed | Status |
|---|---|---|---|
| | | | Pass/Fail/N/A |

## Merge Risk
Low | Medium | High

Reason:
<concise rationale>
```
