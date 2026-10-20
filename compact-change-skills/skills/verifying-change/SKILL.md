---
name: verifying-change
description: Verify Software Change. Independently assess a quick, medium, or large implementation against its approved spec by inspecting the declared diff range and actual changed files, rerunning feasible required checks, evaluating acceptance and ownership, reviewing contracts and risk boundaries, and producing a final evidence-based verdict.
---

# Independently Verify a Software Change

Verification must be capable of disagreeing with the implementation report.

Read `references/reliability-profiles.md` and `references/verification-template.md`.

## 1. Establish Independent Baseline

Record:

- repository root;
- declared implementation base commit;
- current head/working tree;
- exact diff range;
- pre-existing/unrelated changes;
- governing `spec.md`, or the selected approved greenfield build slice plus its canonical `manifest.yaml`;
- `plan.md`/`build-plan.md` and `execution.md` when applicable.

Do not use an ambiguous "current diff" when unrelated work may exist.

In review-only mode, do not modify production code unless the user explicitly requests fixes.

## 2. Inspect the Actual Diff

Inspect changed files directly, including:

- generated outputs;
- migrations;
- project/config files;
- lockfiles;
- integration wiring.

Check:

- scope compliance;
- ownership/write-set compliance;
- missing required changes;
- extra/unrequested changes;
- frozen contract fidelity;
- architecture and boundary consistency;
- security/tenant/permission/compatibility behavior;
- migration/rollback behavior where required;
- synchronization between implementation and applicable canonical product/architecture/API/data/UX artifacts.

Do not accept an implementation-agent summary as proof.

## 3. Re-run Feasible Evidence

Run focused checks and required broader checks.

Select applicable evidence:

- unit/component tests;
- integration/contract tests;
- end-to-end smoke tests;
- deterministic QA mapped to acceptance;
- lint/format/typecheck/build;
- schema/migration validation;
- changed-line/branch coverage;
- targeted mutation testing;
- property/fuzz/concurrency/performance/security checks when risk requires them.

Record unavailable prerequisites. Do not install tooling or alter lockfiles without authority.

## 4. Requirement Traceability

For medium/large changes, evaluate every applicable:

- `REQ-*` or `R-*`;
- `AC-*`;
- `TST-*`.

A requirement passes only when implementation evidence and required validation both support it.

## 5. Reliability Profiles

Apply the selected profile from the spec.

Preserve stricter repository gates.

Coverage and mutation metrics support judgment; they never replace behavioral evidence.

## 6. Verdict

Use exactly one:

- `Pass`
- `Pass with accepted limitations`
- `Fail`
- `Blocked`

Use `Pass` only when:

- required behavior is complete;
- required checks pass;
- ownership is compliant;
- integration is complete;
- no unexplained out-of-scope diff remains;
- applicable canonical design artifacts are synchronized or intentionally superseded by an approved decision;
- no required evidence depends only on implementation self-report.

Use `Pass with accepted limitations` only for explicit, non-behavior-breaking limitations whose acceptance/authority is recorded.

Save `<change-folder>/verification.md`.
