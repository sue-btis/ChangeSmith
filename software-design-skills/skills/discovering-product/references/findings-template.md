# Findings Template

```markdown
# <Product> Discovery Findings

Depth: light | deep

## Comparison Criteria
| ID | Criterion | Must? | Agreed by |
|---|---|---:|---|
| CR-001 | | Yes/No | <who>, <date>, «<verbatim quote>» |

## DQ-001 — <question>

Unblocks: <decision>
Kill or change criterion: <which answer cancels, cuts, or reshapes the product>

### Audit
- <what exists> — `<path>:<line>` or <source>

### Options
| ID | Option | Mechanism | Origin | Evidence | Label |
|---|---|---|---|---|---|
| OP-001 | | | research / adjacent field / user / session | [S-001] | Confirmado / Hipótesis / Preguntar / Problema |

### Probes
| Option | Setup | Measured | Result against the criterion |
|---|---|---|---|
| OP-001 | `docs/discovery/spikes/DQ-001-<slug>/` | | |

### Challenge
- <what the challenger found> → <what changed>

### Decision
Status: Open | Decided
Decision: <chosen option and scope>
Decided by: <who>, <date>, «<verbatim quote>»
Route: brief decision | ADR input | brief Escalate

## Sources
- S-001 — <title>, <URL or path>, <primary | secondary | vendor>
```

Light depth fills only the criteria, each question's audit, a sourced answer in place of the option map, and the decision.

Option, criterion, and source IDs are local to this file. Authorities cite a finding as `docs/discovery/findings.md` plus its `DQ-###`.
