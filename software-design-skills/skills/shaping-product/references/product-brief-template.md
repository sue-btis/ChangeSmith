# Product Brief Template

```markdown
# <Product> Product Brief

Status: Ready for PRD | Needs discovery | Blocked | Escalate
Design size: compact | standard | complex

## Problem
<problem/opportunity, not solution>

## Target Users and Context
- Primary user:
- Secondary users:
- Usage context:

## Desired Outcomes
- OUT-001 — <observable outcome>

## Scope
Included:
- <item>

Excluded:
- <non-goal>

## Constraints
- CON-001 — <hard stakeholder/product constraint>

## Core Domain Language
| Term | Meaning |
|---|---|
| | |

## Approved Product Decisions
- <decision or None>

## Open Product Decisions
- <decision, authority needed, why it matters>

## Discovery
Depth: none | light | deep
Findings: `docs/discovery/findings.md` (once discovery runs)

| ID | Evidence question | Unblocks |
|---|---|---|
| DQ-001 | | <decision> |

## Artifact Applicability
| Artifact | Required? | Reason |
|---|---:|---|
| PRD | Yes | Product authority |
| Domain model | Yes | Shared vocabulary and invariants |
| Architecture tables and diagram | Yes/No | |
| ADR | Yes/No | |
| DBML | Yes/No | |
| OpenAPI | Yes/No | |
| AsyncAPI | Yes/No | |
| Mermaid flows | Yes/No | |
| HTML prototype | Yes/No | |
| Quality attributes | Yes/No | |

## Drifts (retroactive packages only)
| ID | What differs from the target | Evidence | Affects |
|---|---|---|---|
| DR-001 | | `<path>:<line>` | FR-###, NFR-### |
```

The brief is a historical input once the PRD exists: its approved and open decisions move to PRD §15, and the only later edit is `designing-system` removing its `Status:` line.
