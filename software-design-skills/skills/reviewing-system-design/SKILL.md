---
name: reviewing-system-design
description: Review System Design. Use when a design package is ready for review or a new baseline opens. Independently gate it for build readiness: run the mechanical checks first, then one baseline review followed by bounded verification reviews. Record stable findings with severity and evidence, do not modify canonical design artifacts during review, and approve when blocking findings are closed or routed rather than pursuing unlimited perfection.
---

# Review the System Design

Read `references/review-checklist.md` and `references/review-ledger-template.md`.

Run the review in a fresh session or subagent that did not author the design.

## Purpose

This skill is a **review gate**, not a design writer.

Its job is to determine whether the canonical design package is sufficiently coherent and complete for build planning. It must converge. Do not treat every review invocation as a fresh adversarial search for additional improvements.

Never modify canonical product or design authorities while performing this skill. Corrections belong to `reconciling-system-design`.

## Preconditions and Review Mode

Require access to `docs/spec/manifest.yaml`, every applicable authority named by it, and `docs/design/review.md` when it already exists.

Select exactly one mode from manifest status:

- `ready_for_review` with `review.baseline_id` `RV-001` -> **Baseline Review**. Perform one comprehensive review of the package.
- `ready_for_review` with a later baseline (`RV-002` onward) -> **New Baseline Review**. A material change opened that baseline. Review the impact of that change on the authorities it touches, plus global contradictions; do not re-review the whole package.
- `ready_for_verification` -> **Follow-up Verification**. Verify existing findings and inspect only the impact cone of reconciliation changes for regressions.
- `approved` -> refuse to reopen it. Later changes go through change folders; only a new baseline returns the package to `ready_for_review`.
- `needs_reconciliation` -> stop and invoke `reconciling-system-design` instead.
- `blocked` or `escalate` -> preserve the state unless the blocking condition has been explicitly resolved outside this skill.

Inspect canonical artifacts themselves rather than trusting summaries.

## 0. Mechanical Checks

Before reading the package for meaning, run:

1. `node <this skill's directory>/scripts/check-package.mjs <repository root>` — the package verifier. It checks `schema_version: 3` packages and skips older ones.
2. Every command listed under `checks:` in the manifest.
3. The official validator of each artifact present, when available: Structurizr for the DSL, an OpenAPI linter, `@dbml/core` for DBML.

Record each command and its result in the ledger. Each failure becomes a finding owned by the artifact it names. Do not spend review effort on what these checks already cover.

In a retroactive package, a drift between code and target design is not a finding: it belongs in the brief's drift list, against the requirement IDs it affects, or in a PRD §15 decision (routing rule: `writing-build-plan` §3). Record a finding only when a drift has neither.

## 1. Finding Model

Use stable finding IDs in `docs/design/review.md` and never renumber or silently delete a finding.

Every finding must include:

- `id`: `F-001`, `F-002`, ...;
- `severity`: `BLOCKER`, `MAJOR`, `MINOR`, or `NOTE`;
- `status`: `OPEN`, `READY_FOR_VERIFICATION`, `RESOLVED`, `ACCEPTED`, `INVALID`, or `BLOCKED`;
- `origin`: `BASELINE`, `REGRESSION`, or `CRITICAL_NEW`;
- owning canonical artifact;
- concrete evidence;
- why it matters;
- required resolution or verification condition.

Severity means:

- `BLOCKER`: implementation would be materially incorrect, unsafe, impossible, or would violate a mandatory MVP/business/security constraint.
- `MAJOR`: likely to cause substantial implementation rework, incompatible contracts, broken lifecycle/integrity, or an unresolved architectural decision that materially affects build correctness.
- `MINOR`: valid design debt or inconsistency that does not prevent implementation planning.
- `NOTE`: editorial, naming, optional hardening, or improvement advice.

Only `BLOCKER` and `MAJOR` block approval.

## 2. Contradiction Classification

Do not treat every textual mismatch as an implementation-stopping contradiction.

Classify inconsistencies by semantic effect:

- `BLOCKING_CONTRADICTION`: two authorities require incompatible behavior or constraints. Severity `BLOCKER`.
- `MAJOR_INCONSISTENCY`: authorities could lead implementers to materially different implementations. Severity `MAJOR`.
- `MINOR_INCONSISTENCY`: terminology or representation differs but required behavior remains clear. Severity `MINOR`.
- `EDITORIAL`: wording, labels, comments, or presentation differ without changing meaning. Severity `NOTE`.

The manifest rule to stop implementation applies to unresolved `BLOCKING_CONTRADICTION` and `MAJOR_INCONSISTENCY`, not harmless wording differences.

## 3. Baseline Review

In `ready_for_review`, perform one comprehensive review against the checklist.

Check:

### Authority Integrity

- every applicable concern has one clear authority;
- canonical artifacts do not redefine the same semantic detail incompatibly;
- the PRD does not contain implementation detail that conflicts with technical design;
- ADR status and supersession are explicit;
- non-applicable artifacts are declared rather than represented by empty placeholders.

### Requirement Coverage

Trace MVP `FR-*`, `NFR-*`, `BR-*`, and `CON-*` into design where architecture must respond.

Look for material gaps such as:

- unimplemented architectural drivers;
- architecture with no product driver;
- missing security/permission boundaries;
- missing failure/recovery behavior where required by risk;
- missing integration contracts;
- missing data lifecycle/integrity decisions;
- important quality attributes with no design response or future verification strategy.

### Cross-Artifact Consistency

Check applicable relationships, not every possible pair mechanically:

- PRD ↔ domain;
- PRD/NFR ↔ architecture;
- domain ↔ DBML;
- domain ↔ API/event contracts;
- architecture ↔ API/event boundaries;
- API ↔ persistent constraints where effects are stored;
- UX flows ↔ functional requirements;
- ADRs ↔ architecture/contracts;
- security/identity rules ↔ exposed boundaries.

### Proportionality

Flag artifacts that add no authority or duplicate another source only when the duplication creates material ambiguity or maintenance risk. Do not demand more artifacts unless they close a material ambiguity.

At the end of the baseline review:

- create or update `docs/design/review.md` using the ledger template; it holds only the current baseline. A new baseline rewrites it but carries over every finding still `OPEN`, `ACCEPTED`, or `BLOCKED` with its ID, and continues the numbering; resolved and invalid findings stay in git history;
- record the baseline identifier (`RV-n`), which is also `review.baseline_id` in the manifest;
- set all discovered findings to `origin: BASELINE`;
- initialize the reconciliation cycle count to `0` in the ledger;
- do **not** modify canonical design artifacts.

## 4. Follow-up Verification

In `ready_for_verification`, do **not** run another comprehensive baseline review.

Verify:

1. findings with status `READY_FOR_VERIFICATION` or `OPEN`;
2. canonical artifacts changed by reconciliation;
3. directly affected authorities and requirements in the change impact cone.

A typical impact cone is:

```text
changed artifact
    -> canonical authorities directly coupled to that concern
    -> requirements/invariants/contracts directly affected
```

Do not reopen unrelated artifacts merely to search for additional improvements.

### New findings after baseline

After the baseline, create a new finding only when clear evidence shows one of the following:

- `REGRESSION`: reconciliation introduced a new `BLOCKER` or `MAJOR` defect in the impact cone;
- `CRITICAL_NEW`: a previously unseen `BLOCKER` would make implementation materially incorrect, unsafe, or impossible.

Do not introduce new `MINOR` or `NOTE` findings during follow-up verification. Do not introduce unrelated new `MAJOR` findings that were not caused by reconciliation; they belong to a new baseline opened after a material design change.

For each existing finding:

- set `RESOLVED` only when canonical evidence satisfies its verification condition;
- return it to `OPEN` when the attempted correction is insufficient;
- use `INVALID` only when the original finding is disproven by canonical evidence;
- use `ACCEPTED` for non-blocking debt intentionally retained; on a `BLOCKER` or `MAJOR` only with the decision owner's verbatim quote recorded in the finding;
- use `BLOCKED` when resolution requires a stakeholder decision that must not be invented.

## 5. Convergence Rules

Automatic review/reconciliation must be bounded.

For each baseline:

- maximum automatic reconciliation cycles: `3`;
- if unresolved `BLOCKER + MAJOR` findings remain after cycle 3, verdict `Escalate`;
- if unresolved `BLOCKER + MAJOR` count increases in **two consecutive follow-up verifications**, verdict `Escalate`;
- a single temporary increase caused by a legitimate regression is allowed and must be recorded explicitly.

Do not continue an automatic loop after `Escalate`. The cycle count lives only in the ledger.

### Leaving `Escalate`

The user chooses the exit, recorded as a PRD §15 decision with their verbatim quote:

- **build the unaffected milestones** (default): build M01 and every milestone the open findings do not touch;
- **accept with risk**: mark the findings `ACCEPTED` with the quote;
- **cut scope**: remove the affected capability from the MVP through the §15 decision.

Whatever the exit, record in each open `BLOCKER` or `MAJOR` finding the requirement IDs it affects (`Routed to`); `writing-build-plan` §3 copies it into the "Stop if" of every milestone covering them, so implementation sees it before editing. With the exit recorded and the findings routed, the package becomes `approved`.

### New baseline

A new baseline opens only when the package changes materially after approval, such as:

- major PRD scope/behavior change;
- new integration or trust/security boundary;
- material domain lifecycle change;
- consequential architecture replacement;
- explicit request from the user for a new baseline.

The user decides to open it; the session acting on that decision sets `review.baseline_id` to the next identifier (`RV-n+1`) and the manifest to `ready_for_review`. Its review covers the impact of the change plus global contradictions. A redesign too broad to bound is a compact-change `escalate`, not a new baseline.

## 6. Objective Approval Threshold

Use exactly one verdict:

- `Approved for build planning`
- `Needs design revision`
- `Blocked`
- `Escalate`

`Approved for build planning` requires all of the following:

- zero unresolved `BLOCKER` findings;
- zero unresolved `MAJOR` findings;
- zero unresolved `BLOCKING_CONTRADICTION` or `MAJOR_INCONSISTENCY` findings;
- no stakeholder/product/architecture decision currently blocks implementation;
- applicable canonical authorities required for the MVP are present and readable.

`MINOR` and `NOTE` findings may remain `OPEN` or `ACCEPTED` and do not block approval.

Use `Needs design revision` when one or more resolvable `BLOCKER` or `MAJOR` findings remain and convergence limits have not been exceeded.

Use `Blocked` when progress requires a stakeholder/product decision that cannot be inferred safely.

Use `Escalate` when convergence rules trigger or architectural judgment is required beyond bounded automatic reconciliation.

A package also becomes `Approved for build planning` after `Escalate` once the user's exit is recorded and every open `BLOCKER`/`MAJOR` is routed to the requirement IDs it affects (see Leaving `Escalate`).

## 7. State Transitions

Update only review evidence and manifest review state; do not change canonical product/design content.

- Approved -> manifest `status: approved`.
- Needs design revision -> manifest `status: needs_reconciliation`.
- Blocked -> manifest `status: blocked`.
- Escalate -> manifest `status: escalate`.

Record the verdict, counts by severity/status, cycle history, and changed-artifact evidence in `docs/design/review.md`.
