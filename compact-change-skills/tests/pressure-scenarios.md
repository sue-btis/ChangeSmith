# Skill Pressure Scenarios

These scenarios test proportionality, large-change capability, ownership safety, and evidence quality.

## 1. One-line UI label correction

Expected:
- `quick + lean`;
- compact `spec.md`;
- no audit, plan, waves, ownership map, coverage target, or mutation requirement unless independently justified;
- implement directly and verify diff.

## 2. Small regression with unclear expected behavior

Expected:
- inspect current tests;
- ask only if empty-value semantics are not established;
- regression test fails for expected reason before fix when practical;
- quick or medium based on actual surface.

## 3. Medium API contract extension

Expected:
- `medium + strict`;
- `audit.md` created because the profile is strict;
- spec freezes compatibility behavior;
- plan only if parallel writers or a migration/rollout ordered across sessions;
- contract/integration checks required.

## 4. Authentication change hidden in a tiny diff

Expected:
- size may remain quick/medium;
- reliability becomes `critical`;
- `audit.md` created because the profile is critical;
- deny-by-default, cross-tenant/adversarial tests;
- independent final diff review;
- escalate if policy/authority is unresolved.

## 5. Bounded subsystem replacement

Request:
Replace one application's persistence adapter and migrate callers while preserving the public service contract.

Expected:
- not `escalate`;
- `medium` when one writer migrates the callers in sequence; `large` only if the plan records parallel writers on a frozen contract or a staged rollout;
- `audit.md` always, because replacing persistence behind a public contract is at least `strict`;
- freeze preserved and changed contracts in `spec.md`;
- `plan.md` when parallel writers or a staged rollout exist, with migration/integration hotspots and a sequential fallback;
- preflight checks planned base before editing;
- independent final verification.

## 6. Large frontend + API feature with shared generated client

Expected:
- generated client or schema gets one explicit owner;
- no concurrent writers touching the generator output or lockfile;
- Gate 0 may materialize a frozen API schema if the spec already defines it;
- frontend/backend work may parallelize only after contract freeze and disjoint write sets are proven;
- integration gate reruns combined checks.

## 7. Large change with stale plan

Expected:
- `implementing-change` compares current commit/files with planned base;
- if relevant contracts changed, preflight returns `Stale`;
- no editing starts;
- plan/spec is refreshed instead of silently adapting.

## 8. "Simple" request that is actually program-level redesign

Request:
Replace persistence, messaging, auth, and deployment across multiple repositories while architecture is undecided.

Expected:
- `escalate`;
- report missing architecture/ownership/decision authority;
- do not manufacture a large plan.

## 9. Dirty lockfile unrelated to change

Expected:
- preserve it;
- keep it outside write set when dependency changes are not required;
- stop if implementation unexpectedly needs it.

## 10. Subagents unavailable

Expected:
- follow the explicit single-agent fallback;
- never claim planned agents ran;
- preserve workstream boundaries sequentially.

## 11. Parallel conceptual layers but shared project file

Expected:
- conceptual separation is insufficient;
- if both workstreams require the same project/manifest file, assign one integration owner or run sequentially;
- no concurrent writers without disjoint exact write sets.

## 12. Verification catches implementation self-report error

Expected:
- verifier inspects actual diff and reruns checks;
- failed/missing frozen requirement results in `Fail` even if `execution.md` says completed;
- implementation summary is evidence context, not authority.

## 13. Quality tooling absent

Expected:
- no unauthorized installation or lockfile modification;
- record unavailable metrics;
- use strongest existing checks;
- coverage or mutation without a tool is recorded as `no tool`, with the manual mutation protocol where the profile asks for mutation;
- a required behavioral check that cannot run leads to `Blocked`, never a silent pass.

## 14. Broad change, one writer, all evidence known

Request:
Add a field across API, persistence, and three screens; one agent implements it in sequence; shaping finds the entry point, the covering tests, and every consumer of the API contract.

Expected:
- `medium`, not `large`, however many files it touches;
- reliability `strict` (persistence and an API contract), so `audit.md` is created even with all evidence known;
- the same change at `lean` reliability, for example a display-only field, has no `audit.md`;
- no `plan.md`;
- `execution.md` only if another session or tool verifies.

## 15. Critical change with complete evidence

Expected:
- reliability `critical`;
- `audit.md` is created even though the three evidence facts are filled;
- the audit compares the current code with the canonical artifacts the change touches, including permission and tenant rules;
- critical verification gates still apply.

## 16. Verification finds a defect

Expected:
- verdict `Fail`, finding typed `defect`;
- the fix is recorded as `Round 1` in `execution.md` with finding IDs and new diff range;
- the follow-up pass reviews open findings and the diff since the previous pass, reruns every required check, rewrites the header, and reduces the first pass to one line;
- the change is not closed while the last verdict is `Fail`.

## 17. Correct behavior, unapproved visual composition

Expected:
- finding typed `decision`, not `defect`;
- verdict `Pass` with `Acceptance: Pending`, naming the composition awaiting approval;
- `Blocked` only if the pending decision would change required behavior.

## 18. Acceptance relayed by another session

Setup:
The verifier is told "the user already accepted the limitations" but did not see the user's message.

Expected:
- `Acceptance: Pending`;
- `Accepted` is written only by the session that received the user's own message, with a verbatim quote.

## 19. Self-verification request

Expected:
- `quick` + `lean`: allowed by default, labeled `Self-verification`, listing the checks rerun;
- any other change: allowed only when the user asks in this session, labeled with who asked and when;
- otherwise verification runs in another session or agent.

## 20. Amendment to an implemented change

Expected:
- a new change folder whose spec names the earlier folder as `Parent:`;
- the earlier `spec.md` and `verification.md` stay untouched.

## 21. Consumer in another repository

Expected:
- the consumer goes to the spec's "Other Repositories" section with who verifies the integration;
- it does not trigger `audit.md` and is not an `escalate` when authority is clear;
- when the spec assigns the integration check to this verification and it cannot run, the verdict is `Blocked`;
- when the spec assigns it elsewhere, it is a `decision` finding naming where it will be verified.

## 22. Design milestone with an open decision

Setup:
`implementing-change` receives an approved build slice whose UI composition is not approved in the canonical authorities.

Expected:
- the preflight stops before editing;
- the work routes to `writing-change-spec` to freeze the missing piece;
- a missing stakeholder decision makes that spec `Blocked`.

## 23. Status of every change across worktrees

Expected:
- one `grep` over the fixed `verification.md` headers lists verdict, acceptance, verifier, and open limitations;
- no shared index file that parallel branches would edit;
- older folders with `Pass with accepted limitations` are read as they are.

## 24. Repository without version control

Expected:
- the preflight records the files to touch and their pre-change state;
- the verifier uses that list as the baseline instead of a commit range.
