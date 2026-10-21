# Focused PRD Template

Delete sections that do not apply. Empty boilerplate is worse than omission. Every ID uses three digits.

```markdown
# PRD — <Product Name>

Status: Ready for system design | Blocked | Escalate

## 1. Product Overview
### Product
<what it is, in product language>

### Problem / Purpose
<problem and why it matters>

### Product Philosophy
<only durable product principles that constrain behavior>

## 2. Target Users and Usage Context
### Primary User
<who, expertise, current behavior>

### Secondary Users
<if applicable>

### Usage Context
<device/environment/network/organizational context that matters to product behavior>

## 3. Goals
- G-001 — <outcome>

## 4. Non-Goals
- NG-001 — <explicit exclusion>

## 5. Core User Journeys
### J-001 — <name>
1. <step>
2. <step>
3. <observable outcome>

## 6. Product Capabilities
### CAP-001 — <name>
<purpose, user-visible behavior, major states/edge cases>

## 7. Functional Requirements
### FR-001
<one atomic, testable behavior>

### FR-002
<one atomic, testable behavior>

## 8. Non-Functional Requirements
### NFR-001 — <quality attribute>
<measurable target or scenario>

## 9. Business Rules and Invariants
- BR-001 — <rule that must remain true>

## 10. Product / UX Principles
- UX-001 — <concrete, decidable rule>

## 11. Hard Constraints
- CON-001 — <stakeholder/platform/legal/operational constraint>

## 12. MVP Scope
### In
- FR-001, FR-002 — <capability in product language>

### Out
- <item>

## 13. Success Criteria
- SC-001 — <observable/measurable success condition>

## 14. Future Product Scope
- <deferred capability, not architecture speculation>

## 15. Product Decisions
| ID | Question | Status | Decision | Decided by | Date | Quote | Affects |
|---|---|---|---|---|---|---|---|
| PD-001 | | Open / Decided | | | | «<verbatim>» | <PRD sections / artifacts> |

If none, write `None.`

## 16. Product Traceability
| Capability / Journey | Requirements |
|---|---|
| CAP-001 / J-001 | FR-001, NFR-001 |
```
