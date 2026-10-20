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

## 6. Feature added after v0.1

Expected:
- do not rerun greenfield workflow for the whole system by default;
- route ordinary changes to compact-change-skills;
- if the change materially alters architecture/product boundaries, explicitly start a new design baseline/full audit.

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
