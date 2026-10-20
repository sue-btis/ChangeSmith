# System Design Review

This file is review evidence and workflow state for the current baseline only. It is not a canonical product, architecture, schema, or contract authority. A new baseline rewrites it, carrying over findings still `OPEN`, `ACCEPTED`, or `BLOCKED` with their IDs; resolved and invalid ones stay in git history.

All enum values below stay in English, whatever language the prose uses.

## Review State

- Baseline ID: `RV-001`
- Current review mode: `baseline | new_baseline | follow_up`
- Reconciliation cycles used: `0`
- Maximum automatic reconciliation cycles: `3`
- Current verdict: `<verdict>`
- Escalate exit: `<none | build unaffected milestones | accept with risk | cut scope>, PD-###`

## Mechanical Checks

| Command | Result |
|---|---|
| `node <skill dir>/scripts/check-package.mjs <repo root>` | Pass / Fail / Skipped (schema < 3) |
| `<manifest checks: command>` | |
| `<official validator>` | |

## Current Blocking Summary

| Severity | Open | Ready for verification | Resolved | Accepted/Invalid |
|---|---:|---:|---:|---:|
| BLOCKER | 0 | 0 | 0 | 0 |
| MAJOR | 0 | 0 | 0 | 0 |
| MINOR | 0 | 0 | 0 | 0 |
| NOTE | 0 | 0 | 0 | 0 |

## Findings

### F-001 — <short title>

- Severity: `BLOCKER | MAJOR | MINOR | NOTE`
- Status: `OPEN | READY_FOR_VERIFICATION | RESOLVED | ACCEPTED | INVALID | BLOCKED`
- Origin: `BASELINE | REGRESSION | CRITICAL_NEW`
- Classification: `BLOCKING_CONTRADICTION | MAJOR_INCONSISTENCY | MINOR_INCONSISTENCY | EDITORIAL | COVERAGE_GAP | DESIGN_GAP | OTHER`
- Owner: `<canonical artifact path>`
- Related requirements: `<FR/NFR/BR/CON IDs or n/a>`
- Evidence: `<specific canonical evidence>`
- Why it matters: `<material effect>`
- Required resolution: `<what must become true>`
- Verification evidence: `<filled by follow-up review>`
- Routed to: `<requirement IDs it affects, e.g. FR-012, NFR-003 — only when the package is approved with this finding open; writing-build-plan §3 copies it to the matching milestones>`
- Accepted by: `<who, date, «verbatim quote» — required for ACCEPTED on BLOCKER/MAJOR>`

## Cycle History

### Baseline — cycle 0

- BLOCKER open: `<n>`
- MAJOR open: `<n>`
- MINOR open: `<n>`
- NOTE open: `<n>`
- Verdict: `<verdict>`

### Follow-up — cycle 1

- Reconciliation change set: `<paths or change summary>`
- Findings verified: `<IDs>`
- New regressions: `<IDs or none>`
- Critical new blockers: `<IDs or none>`
- BLOCKER open: `<n>`
- MAJOR open: `<n>`
- Previous BLOCKER+MAJOR open: `<n>`
- Current BLOCKER+MAJOR open: `<n>`
- Consecutive increases: `<0|1|2>`
- Verdict: `<verdict>`
