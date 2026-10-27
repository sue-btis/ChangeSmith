# Pressure Scenarios

## 1. Tiny local web app

Request: single-user local utility with no backend API.

Expected:
- compact package;
- PRD + domain + minimal architecture;
- local data authority only if persistent data exists;
- no OpenAPI/AsyncAPI/ADR spam.

## 2. Standard SaaS CRUD product

Expected:
- PRD;
- domain;
- architecture.dsl;
- DBML;
- OpenAPI;
- selected ADRs;
- UX flows;
- vertical build plan.

## 3. Event-driven system

Expected:
- AsyncAPI only when event contracts are real system boundaries;
- architecture and ADR identify eventing rationale;
- no duplicated event payload prose in PRD.

## 4. User insists on PostgreSQL

Expected:
- record as stakeholder constraint if truly mandated;
- do not pretend the architecture selected it independently;
- DBML becomes schema authority.

## 5. PRD says one thing, OpenAPI implies another

Expected baseline review:
- classify semantic impact;
- create stable BLOCKER/MAJOR finding when behavior is materially incompatible;
- do not edit either artifact during review;
- manifest becomes `needs_reconciliation`.

Expected reconciliation:
- determine owning concern from manifest/product authority;
- revise canonical owner and only directly affected artifacts;
- mark finding `READY_FOR_VERIFICATION`;
- manifest becomes `ready_for_verification`.

Expected follow-up:
- verify the finding and impact cone;
- do not rerun a full adversarial audit.

## 6. Feature added after approval

Expected:
- do not rerun the design workflow for the whole system;
- route the change to a compact-change folder that declares the authorities it touches;
- a behavior change adds or updates its PRD §15 row in the same change;
- only a material change opens baseline `RV-n+1`, whose review covers the change's impact plus global contradictions.

## 7. Initial build implementation

Expected:
- select one build-plan milestone;
- use compact-change-skills implementing-change directly with manifest + relevant authorities + slice;
- verify independently before next milestone.

## 8. Review count reaches two findings after several cycles

Setup:
- baseline has multiple findings;
- after reconciliation, only two BLOCKER/MAJOR findings remain.

Expected:
- follow-up verifies those findings and their impact cones only;
- it must not reopen unrelated artifacts to generate a fresh improvement backlog;
- new MINOR/NOTE findings are prohibited in follow-up.

## 9. Reconciliation introduces a real regression

Expected:
- follow-up may add a new finding with origin `REGRESSION`;
- only BLOCKER/MAJOR regression findings are added;
- the count may temporarily increase once without forcing escalation;
- reconciliation remains bounded by the cycle budget.

## 10. Two consecutive follow-ups increase blocker/major count

Expected:
- verdict `Escalate`;
- no further automatic reconciliation loop;
- preserve evidence and request architectural/human judgment.

## 11. Three reconciliation cycles still leave a MAJOR finding

Expected:
- verdict `Escalate` after the third verification if blocking findings remain;
- do not begin cycle four automatically.

## 12. Naming/casing mismatch only

Example:
- domain says `submitted`;
- API enum says `SUBMITTED`;
- mapping is otherwise unambiguous.

Expected:
- classify as MINOR_INCONSISTENCY or EDITORIAL depending on context;
- do not block approval unless the mismatch can materially change implementation behavior.

## 13. Approved package still has minor debt

Expected:
- approval is allowed with OPEN/ACCEPTED MINOR or NOTE findings;
- build planning starts because BLOCKER=0 and MAJOR=0.

## 14. Review asked to reopen an approved package

Expected:
- `reviewing-system-design` refuses;
- later changes go through change folders;
- only a material change opens a new baseline.

## 15. Mechanical checks before the review

Expected:
- `check-package.mjs`, the manifest `checks:` commands, and the official validators run first, with results in the ledger;
- each failure becomes a finding owned by the artifact it names;
- an older manifest (`schema_version` below 3) is skipped, not failed.

## 16. Escalate after three cycles with two MAJOR findings open

Expected:
- the user chooses the exit, recorded as a PRD §15 decision with a verbatim quote;
- default exit: build M01 and the milestones the findings do not touch;
- each finding records the requirement IDs it affects (`Routed to`);
- the package becomes `approved`;
- when the plan is written, both finding IDs appear in the "Stop if" of every milestone covering those requirements.

## 17. Stakeholder decides in chat after the PRD is approved

Expected:
- the decision is a PRD §15 row with who, date, and the verbatim quote;
- no `decisions` or `resolved` key appears in the manifest;
- the change that applies it is a compact-change folder.

## 18. ADR written during design

Expected:
- it starts `Proposed`;
- it becomes `Accepted` only with an `Accepted by` line quoting the owner;
- no other authority relies on it while it is `Proposed`.

## 19. Status after the manifest exists

Expected:
- the brief, PRD, and plan carry no `Status:` line;
- milestone status is read from the `verification.md` headers of the change folders;
- changes since approval come from git, not from version lines.

## 20. Retroactive package with many drifts

Expected:
- each drift is listed in the brief (`DR-###`) with the requirement IDs it affects, or becomes a PRD §15 decision;
- drifts do not count as review findings and do not exhaust the cycle cap;
- when the plan is written, each drift appears in the "Stop if" of the milestone that fixes it.

## 21. NFR that needs a human task

Setup:
NFR-003 requires a leaked credential to be rotated before deployment.

Expected:
- `quality-attributes.md` has a row citing NFR-003 by ID with `human task: <who> confirms the rotation`;
- when the plan is written, the milestone covering NFR-003 has a "Stop if" that waits for that confirmation;
- the NFR target is not restated outside the PRD.

## 22. Product whose value depends on a better approach

Setup:
The user wants phone-camera bar velocity tracking. The brief names one method ("a pose model"), and nobody knows whether a phone camera is accurate enough.

Expected:
- shaping records the accuracy question as `DQ-###` with a kill criterion, sets depth `deep`, and the brief status `Needs discovery`; it does not answer it from memory or ask the user to guess;
- the comparison criteria are agreed with the user before options are shown;
- the option map has at least three options with distinct mechanisms, including the user's;
- the accuracy claim stays a hypothesis until a probe measures it against the criterion;
- the user receives a book from `explaining-skills:libro` and decides; the decision is recorded with the user's quote;
- a technical choice made there reaches `designing-system` as an ADR whose `Accepted by` carries that quote.

## 23. Typical CRUD product

Expected:
- discovery depth `none`; the brief goes straight to `Ready for PRD`;
- no `docs/discovery/` folder is created.
