# Changelog

## 1.2.0

- After approval, authorities change only through compact-change folders. A material change opens a new baseline whose review covers the change's impact plus global contradictions, not the whole package. `reviewing-system-design` refuses to reopen an approved package otherwise.
- Removed stored status from the brief, PRD, and plan. `designing-system` removes the brief and PRD `Status:` lines when it writes the manifest. Milestone status is the fixed `verification.md` header of compact-change 2.2.
- Removed package semver, `design_package_version`, the PRD `Version:` line, and "changes since" sections. The package version is the review baseline (`RV-n`). Consumer contracts keep their own semver. Changes since approval are derived from git.
- PRD §15 becomes "Product Decisions", the single decision register (status, who, date, verbatim quote, authorities affected). ADRs start `Proposed` and need an `Accepted by` line with a quote.
- New `scripts/check-package.mjs` inside `reviewing-system-design`. It has no dependencies and runs only on `schema_version: 3` manifests. It checks manifest keys, paths, and status; leftover `Status:` lines; ADR status and acceptance; cited IDs; MVP FR coverage; and English ledger enums. Reviews run it, the manifest's `checks:`, and the official validators first.
- Manifest template moves to `schema_version: 3`. It drops the reconciliation counter, which now lives only in `review.md`, and adds `quality_attributes`, `change_folders`, and the optional `checks`, `cross_repo_dependencies`, `nature`, and `superseded_documents`.
- Defined the exit from `escalate`: the user chooses (default: build unaffected milestones), recorded in PRD §15. Every open BLOCKER/MAJOR records the requirement IDs it affects, and `writing-build-plan` §3 (the single routing rule) copies it into the "Stop if" of every milestone covering them. `ACCEPTED` on BLOCKER/MAJOR requires the owner's quote. A broad redesign is a compact-change `escalate`, not a new baseline.
- `review.md` keeps only the current baseline, carrying over findings still open, accepted, or blocked; resolved ones live in git.
- ADRs are named `ADR-###-<slug>.md`; ADRs that other authorities cite must be accepted before `ready_for_review`.
- New conditional artifact `quality-attributes.md` (NFR ID, design response, evidence). Human tasks are written as `human task:` rows and become milestone "Stop if" items at planning.
- Retroactive packages: optional manifest fields, a shaping section, and a brief drift table (`DR-###`). Drifts become milestone "Stop if" items at planning or PRD decisions, never review findings.
- The verifier does not check `superseded_documents` paths, because a milestone may delete those documents; AC/TST IDs are not checked because compact-change keeps them local to each change folder.
- IDs use three digits everywhere (`CON-001`, `G-001`); the PRD MVP section cites FR IDs; skill descriptions state when to use them.

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
