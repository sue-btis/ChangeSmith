---
name: reviewing-system-design
description: Review System Design. Independently gate a greenfield design package for build readiness using one comprehensive baseline review followed by bounded verification reviews. Record stable findings with severity and evidence, do not modify canonical design artifacts during review, and approve when blocking findings are closed rather than pursuing unlimited perfection.
---

# Review the System Design

Read `references/review-checklist.md` and `references/review-ledger-template.md`.

## Purpose

This skill is a **review gate**, not a design writer.

Its job is to determine whether the canonical design package is sufficiently coherent and complete for build planning. It must converge. Do not treat every review invocation as a fresh adversarial search for additional improvements.

Never modify canonical product or design authorities while performing this skill. Corrections belong to `reconciling-system-design`.

## Preconditions and Review Mode

Require access to `docs/spec/manifest.yaml`, every applicable authority named by it, and `docs/design/review.md` when it already exists.

Select exactly one mode from manifest status:

- `ready_for_review` -> **Baseline Review**. Perform one comprehensive review of the current design package version.
- `ready_for_verification` -> **Follow-up Verification**. Verify existing findings and inspect only the impact cone of reconciliation changes for regressions.
- `approved` -> do not reopen review unless the design package changed materially and the manifest was explicitly returned to `ready_for_review`.
- `needs_reconciliation` -> stop and invoke `reconciling-system-design` instead.
- `blocked` or `escalate` -> preserve the state unless the blocking condition has been explicitly resolved outside this skill.

Review as if you did not author the design. Inspect canonical artifacts themselves rather than trusting summaries.

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

- create or update `docs/design/review.md` using the ledger template;
- record the baseline design package version and a baseline identifier;
- set all discovered findings to `origin: BASELINE`;
- initialize reconciliation cycle count to `0` for this baseline;
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

Do not introduce new `MINOR` or `NOTE` findings during follow-up verification. Do not introduce unrelated new `MAJOR` findings that were not caused by reconciliation; they belong to a later explicitly requested full audit after a material design change.

For each existing finding:

- set `RESOLVED` only when canonical evidence satisfies its verification condition;
- return it to `OPEN` when the attempted correction is insufficient;
- use `INVALID` only when the original finding is disproven by canonical evidence;
- use `ACCEPTED` for non-blocking debt intentionally retained;
- use `BLOCKED` when resolution requires a stakeholder decision that must not be invented.

## 5. Convergence Rules

Automatic review/reconciliation must be bounded.

For each baseline:

- maximum automatic reconciliation cycles: `3`;
- if unresolved `BLOCKER + MAJOR` findings remain after cycle 3, verdict `Escalate`;
- if unresolved `BLOCKER + MAJOR` count increases in **two consecutive follow-up verifications**, verdict `Escalate`;
- a single temporary increase caused by a legitimate regression is allowed and must be recorded explicitly.

Do not continue an automatic loop after `Escalate`.

A new comprehensive review is allowed only when the design package changed materially, such as:

- major PRD scope/behavior change;
- new integration or trust/security boundary;
- material domain lifecycle change;
- consequential architecture replacement;
- explicit request for a new full audit.

Such a review begins a new baseline generation and preserves prior review history.

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

## 7. State Transitions

Update only review evidence and manifest review state; do not change canonical product/design content.

- Approved -> manifest `status: approved`.
- Needs design revision -> manifest `status: needs_reconciliation`.
- Blocked -> manifest `status: blocked`.
- Escalate -> manifest `status: escalate`.

Record the verdict, counts by severity/status, cycle history, and changed-artifact evidence in `docs/design/review.md`.
