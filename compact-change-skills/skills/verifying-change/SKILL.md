---
name: verifying-change
description: Verify Software Change. Independently assess a quick, medium, or large implementation against its approved spec by inspecting the declared diff range and actual changed files, rerunning feasible required checks, evaluating acceptance and ownership, reviewing contracts and risk boundaries, and recording a technical verdict, typed findings, and the user's acceptance in a fixed header. Also runs follow-up passes after a fix.
---

# Independently Verify a Software Change

Verification must be capable of disagreeing with the implementation report.

Read `references/reliability-profiles.md` and `references/verification-template.md`.

## 1. Who Verifies

By default, verification runs in a different session or agent from the implementation. Record which one in `Verified by:`.

Self-verification is allowed:

- by default, only for `quick` + `lean` changes;
- for any other change, only when the user asks for it in this session.

Label it `Self-verification (<reason or "requested by <user>, <date>">)` and list the checks you reran.

## 2. Establish the Baseline

Record:

- repository root;
- declared implementation base commit;
- current head/working tree;
- exact diff range;
- pre-existing/unrelated changes;
- governing `spec.md`, or the selected approved greenfield build slice plus its canonical `manifest.yaml`;
- `plan.md`/`build-plan.md` and `execution.md` when applicable.

For uncommitted work, the diff is `git diff <base>` plus the files from `git ls-files --others --exclude-standard`. Without version control, use the files and pre-change state recorded at preflight.

Do not use an ambiguous "current diff" when unrelated work may exist.

In review-only mode, do not modify production code unless the user explicitly requests fixes.

## 3. Inspect the Actual Diff

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
- synchronization between implementation and applicable canonical product/architecture/API/data/UX artifacts;
- the spec's "Other Repositories" integrations. When the spec assigns the integration check to this verification and it cannot run, the verdict is `Blocked`. When the spec assigns it elsewhere, record a *decision* finding naming where it will be verified.

Do not accept an implementation-agent summary as proof. Report canonical-artifact gaps as findings; the verifier never edits canonical design artifacts or the manifest.

## 4. Re-run Feasible Evidence

Run focused checks and required broader checks.

Select applicable evidence:

- unit/component tests;
- integration/contract tests;
- end-to-end smoke tests;
- deterministic QA mapped to acceptance;
- lint/format/typecheck/build;
- schema/migration validation;
- changed-line/branch coverage;
- targeted mutation testing, by tool or by the manual protocol in `reliability-profiles.md`;
- property/fuzz/concurrency/performance/security checks when risk requires them.

Record unavailable prerequisites. Do not install tooling or alter lockfiles without authority.

## 5. Requirement Traceability

When the spec has IDs, evaluate every applicable:

- `REQ-*` or `R-*`;
- `AC-*`;
- `TST-*`.

A requirement passes only when implementation evidence and required validation both support it.

## 6. Reliability Profiles

Apply the selected profile from the spec. Preserve stricter repository gates.

Coverage and mutation numbers are reference targets unless the repository already has the tool; they support judgment and never replace behavioral evidence.

## 7. Findings

Give every finding an ID (`F-1`, `F-2`, …) and exactly one type:

- **defect**: behavior, contract, or a required check is wrong. Someone fixes it.
- **decision**: something only the user can settle, such as an unapproved visual composition, an unrequested-but-reasonable deviation, or a coverage gap the user may accept.

## 8. Verdict

Use exactly one:

- `Pass`: no open defect, required checks pass, ownership is compliant, integration within this repository is complete, no unexplained out-of-scope diff remains, canonical artifacts are synchronized or superseded by an approved decision, and no required evidence depends only on implementation self-report.
- `Fail`: at least one open defect.
- `Blocked`: verification could not be completed (missing environment, data, tool, or access), or a pending decision changes the required behavior.

Any other open decision does not change the verdict; it keeps `Acceptance: Pending`.

## 9. Acceptance

The acceptance records what the user accepted, separately from the verdict.

- Write `Accepted — <who>, <date>, «<verbatim quote>»` only from the user's own message in this session.
- Otherwise write `Pending`, listing what awaits the user.
- Acceptance applies only to a `Pass`.

When the user accepts after the verification pass, the session that receives the message updates `Acceptance:`, the limitations table, and `Open limitations:` in place; no new pass is needed.

Each accepted limitation goes in the limitations table, with its finding ID, who accepted it, the date, and its follow-up (`none` or the new change folder that will address it). `Open limitations:` lists the accepted limitations whose follow-up is not yet done.

## 10. Follow-up Passes

After a correction round, run a follow-up pass in the same `verification.md`:

1. inspect the open findings and the diff since the previous pass;
2. rerun every required check in full;
3. rewrite the header with the current verdict, acceptance, and limitations;
4. reduce each earlier pass to one line in the pass history.

## 11. Closed

A change is closed when all hold:

- the verdict is `Pass`;
- every finding is fixed or accepted;
- `Acceptance:` is `Accepted`.

Committing is the user's decision and happens outside this workflow.

Save `<change-folder>/verification.md` with the fixed header from `references/verification-template.md` on its first lines.
