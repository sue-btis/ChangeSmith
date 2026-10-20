# Focused PRD Template

Delete sections that do not apply. Empty boilerplate is worse than omission.

```markdown
# PRD — <Product Name>

Status: Ready for system design | Blocked | Escalate
Version: <version>

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
- G-01 — <outcome>

## 4. Non-Goals
- NG-01 — <explicit exclusion>

## 5. Core User Journeys
### J-01 — <name>
1. <step>
2. <step>
3. <observable outcome>

## 6. Product Capabilities
### CAP-01 — <name>
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
- UX-01 — <concrete, decidable rule>

## 11. Hard Constraints
- CON-001 — <stakeholder/platform/legal/operational constraint>

## 12. MVP Scope
### In
- <item>

### Out
- <item>

## 13. Success Criteria
- SC-001 — <observable/measurable success condition>

## 14. Future Product Scope
- <deferred capability, not architecture speculation>

## 15. Open Product Decisions
| ID | Decision Needed | Why It Matters | Authority |
|---|---|---|---|
| PD-001 | | | |

If none, write `None.`

## 16. Product Traceability
| Capability / Journey | Requirements |
|---|---|
| CAP-01 / J-01 | FR-001, NFR-001 |
```
