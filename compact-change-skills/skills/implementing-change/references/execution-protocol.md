# Controlled Execution Protocol

## Canonical Workstream Packet

Give a writer only:

```markdown
Target: <WS / task / wave>
Base: <commit>
Requirements: <REQ IDs>
Acceptance: <AC IDs>
Tests: <TST IDs>

May read:
- <paths>

May edit:
- <paths>

Integration-reserved:
- <paths>

Must not edit:
- <paths>

Frozen contracts / canonical authorities:
- <only relevant contract excerpt or artifact path>

Steps:
1. <bounded step>

Checks:
- <commands>

Required evidence:
- <diff/test/output>

Stop if:
- <condition>
```

## Execution Artifact

```markdown
# <Change name> Execution

## Baseline
| Field | Value |
|---|---|
| Repository | |
| Branch | |
| Planned base | |
| Current start commit | |
| Working tree before edits | |
| Pre-existing relevant changes | |
| Untracked files before edits | |
| Without version control | Files to touch and their pre-change state |

## Preflight Verdict
Safe | Safe sequentially only | Stale | Blocked | Spec contradicts repository

Reason:
<concise evidence>

## Execution Topology
Isolated worktrees | Shared tree with disjoint writes | Sequential | Quick direct

## Executed Work
| Workstream / Task | REQ IDs | Status | Files Changed | Checks | Evidence |
|---|---|---|---|---|---|
| | | | | | |

## Integration Gates
| Gate | Owner | Diff Inspected? | Checks | Result |
|---|---|---:|---|---|
| | | Yes/No | | |

## Requirement Status
| Requirement | Implementation | Acceptance Evidence | Status |
|---|---|---|---|
| REQ-001 | | | Completed/Partial/Blocked |

## Deviations
- <None or explicit deviation>

## Canonical Design Synchronization
- <artifact -> updated/preserved/not applicable>

## Ownership / Contract Conflicts
- <None or details>

## Blockers
- <None or details>

## Independent Verification Readiness
Ready | Not ready

## Correction Rounds
### Round 1 — after verification pass <n> (<date>)
- Findings addressed: <F-1, F-2>
- Files changed: <paths>
- Checks run: <commands and results>
- New diff range: <base..head or working tree>
- Preflight delta: <what changed since the previous round, or None>
```
