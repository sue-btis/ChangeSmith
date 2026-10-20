# Changelog

## 1.1.0

- Split design review from design reconciliation to eliminate self-modifying review loops.
- Added `reconciling-system-design` skill and `/reconcile-system-design` command.
- Added baseline vs follow-up review modes with impact-cone verification.
- Added stable finding IDs, severity (`BLOCKER`, `MAJOR`, `MINOR`, `NOTE`), status, origin, and contradiction classification.
- Added objective approval threshold: zero unresolved BLOCKER/MAJOR findings and no blocking semantic contradiction/stakeholder decision.
- Added explicit review states: `needs_reconciliation` and `ready_for_verification`.
- Added maximum 3 automatic reconciliation cycles and escalation on repeated blocker/major count growth.
- Prevented new MINOR/NOTE discovery during follow-up verification.
- Clarified that editorial/representation differences are not automatically canonical contradictions.
- Added review ledger and reconciliation checklists plus pressure scenarios for convergence behavior.

## 1.0.0

- Initial greenfield workflow with five composable skills.
- Added focused PRD authority separated from technical architecture and contracts.
- Added canonical design manifest and artifact applicability rules.
- Added Structurizr DSL, ADR, DBML, OpenAPI, AsyncAPI, Mermaid, and optional HTML prototype guidance.
- Added cross-artifact consistency review and explicit design readiness states.
- Added vertical build planning with requirement/acceptance/test traceability.
- Added integration contract with `compact-change-skills` 2.1+ for slice-by-slice implementation and independent verification.
